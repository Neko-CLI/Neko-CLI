import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import axios from "axios";
import moment from "moment";
const DEFAULT_STALE_THRESHOLD_DAYS = 180;
async function getPackageJsonDependencies() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error("package.json not found in the current directory.");
    }
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const dependencies = packageJson.dependencies || {};
        const devDependencies = packageJson.devDependencies || {};
        return { dependencies, devDependencies };
    } catch (error) {
        throw new Error(`Error reading or parsing package.json: ${error.message}`);
    }
}
async function getNpmPackageInfo(packageName) {
    try {
        const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
        const data = response.data;
        let repoUrl = data.repository && data.repository.url;
        if (repoUrl) {
            repoUrl = repoUrl.replace(/^git\+/, '');
            repoUrl = repoUrl.replace(/\.git$/, '');
        }
        const latestVersion = data['dist-tags'] && data['dist-tags'].latest;
        let lastPublishDate = null;
        if (latestVersion && data.time && data.time[latestVersion]) {
            lastPublishDate = moment(data.time[latestVersion]);
        } else if (data.time && data.time.modified) {
            lastPublishDate = moment(data.time.modified);
        }
        return { repoUrl, lastPublishDate };
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return { repoUrl: null, lastPublishDate: null, error: "Package not found on npm." };
        }
        return { repoUrl: null, lastPublishDate: null, error: `Failed to fetch npm info: ${error.message}` };
    }
}
async function getGitHubActivity(repoUrl, githubToken = null) {
    if (!repoUrl || !repoUrl.includes('github.com')) {
        return { lastCommitDate: null, error: "Not a GitHub repository or unsupported." };
    }
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
        return { lastCommitDate: null, error: "Could not parse GitHub repository URL." };
    }
    const [, owner, repo] = match;
    try {
        const headers = githubToken ? { 'Authorization': `token ${githubToken}` } : { 'User-Agent': 'neko-cli-stale-checker' };
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
            { headers }
        );
        if (response.data && response.data.length > 0) {
            const lastCommitDate = moment(response.data[0].commit.author.date);
            return { lastCommitDate };
        }
        return { lastCommitDate: null, error: "No commits found on GitHub." };
    } catch (error) {
        let errorMessage = `Failed to fetch GitHub activity for ${owner}/${repo}: ${error.message}`;
        if (error.response && error.response.status === 403) {
            errorMessage += " (GitHub API rate limit hit. Consider providing a GitHub token with --github-token)";
        }
        return { lastCommitDate: null, error: errorMessage };
    }
}
export const handleStaleCommand = async (args) => {
    const spinner = ora(chalk.cyan("🐾 Neko is sniffing out stale dependencies...")).start();
    let staleThresholdDays = DEFAULT_STALE_THRESHOLD_DAYS;
    let githubToken = null;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--threshold' && args[i + 1]) {
            const threshold = parseInt(args[i + 1], 10);
            if (!isNaN(threshold) && threshold > 0) {
                staleThresholdDays = threshold;
                i++;
            } else {
                spinner.warn(chalk.yellow(`Invalid value for --threshold: "${args[i+1]}". Using default ${DEFAULT_STALE_THRESHOLD_DAYS} days.`));
                i++;
            }
        } else if (args[i] === '--github-token' && args[i + 1]) {
            githubToken = args[i + 1];
            i++;
        }
    }
    try {
        const { dependencies, devDependencies } = await getPackageJsonDependencies();
        const allDependencies = { ...dependencies, ...devDependencies };
        const results = [];
        const today = moment();
        if (Object.keys(allDependencies).length === 0) {
            spinner.info(chalk.cyan("🐈 No dependencies found in package.json."));
            spinner.stop();
            return;
        }
        const totalDependencies = Object.keys(allDependencies).length;
        let processedCount = 0;
        for (const packageName of Object.keys(allDependencies)) {
            spinner.text = chalk.cyan(`🐾 Analyzing ${packageName} (${++processedCount}/${totalDependencies})...`);
            const npmInfo = await getNpmPackageInfo(packageName);
            if (npmInfo.error) {
                results.push({
                    name: packageName,
                    version: allDependencies[packageName],
                    type: allDependencies[packageName] === dependencies[packageName] ? "Dependency" : "DevDependency",
                    status: chalk.red("ERROR"),
                    reasons: npmInfo.error,
                    lastPublish: "N/A",
                    lastCommit: "N/A",
                    repo: "N/A"
                });
                await new Promise(resolve => setTimeout(resolve, 50));
                continue;
            }
            const { repoUrl, lastPublishDate } = npmInfo;
            let lastCommitDate = null;
            let githubError = null;
            if (repoUrl && repoUrl.includes('github.com')) {
                const githubActivity = await getGitHubActivity(repoUrl, githubToken);
                lastCommitDate = githubActivity.lastCommitDate;
                githubError = githubActivity.error;
            } else {
                githubError = "No GitHub repo found or supported.";
            }
            let isStale = false;
            const reasons = [];
            if (lastPublishDate) {
                const daysSincePublish = today.diff(lastPublishDate, 'days');
                if (daysSincePublish > staleThresholdDays) {
                    isStale = true;
                    reasons.push(`No npm publish in ${daysSincePublish} days (threshold: ${staleThresholdDays}d)`);
                }
            } else {
                reasons.push("No publish date found on npm.");
            }
            if (lastCommitDate) {
                const daysSinceCommit = today.diff(lastCommitDate, 'days');
                if (daysSinceCommit > staleThresholdDays) {
                    isStale = true;
                    reasons.push(`No repo commit in ${daysSinceCommit} days (threshold: ${staleThresholdDays}d)`);
                }
            } else if (!githubError.includes("No GitHub repo") && githubError !== "No commits found on GitHub.") {
                reasons.push(`GitHub activity check issue: ${githubError}`);
            } else if (githubError === "No commits found on GitHub.") {
                reasons.push("Repository found, but no commits detected on GitHub.");
            } else {
                reasons.push(githubError);
            }
            results.push({
                name: packageName,
                version: allDependencies[packageName],
                type: allDependencies[packageName] === dependencies[packageName] ? "Dependency" : "DevDependency",
                status: isStale ? chalk.yellow("STALE") : chalk.cyan("ACTIVE"),
                lastPublish: lastPublishDate ? lastPublishDate.format('YYYY-MM-DD') : "N/A",
                lastCommit: lastCommitDate ? lastCommitDate.format('YYYY-MM-DD') : "N/A",
                reasons: reasons.join('; ') || "Seems actively maintained within the threshold.",
                repo: repoUrl || "N/A"
            });
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        spinner.succeed(chalk.cyan("Dependency staleness analysis complete! ✨"));
        console.log("\n--- Neko Stale Report ---");
        let staleCount = 0;
        let errorCount = 0;
        let activeCount = 0;
        results.sort((a, b) => {
            if (a.status.includes("ERROR")) return -1;
            if (b.status.includes("ERROR")) return 1;
            if (a.status.includes("STALE") && !b.status.includes("STALE")) return -1;
            if (!a.status.includes("STALE") && b.status.includes("STALE")) return 1;
            return a.name.localeCompare(b.name);
        });
        results.forEach(pkg => {
            if (pkg.status.includes("STALE")) {
                staleCount++;
                console.log(`\n${pkg.status} ${chalk.white(pkg.name)} (${pkg.version}) [${pkg.type}]`);
                console.log(chalk.gray(`  Last Publish: ${pkg.lastPublish}`));
                console.log(chalk.gray(`  Last Commit : ${pkg.lastCommit}`));
                console.log(chalk.red(`  Reason(s)   : ${pkg.reasons}`));
                console.log(chalk.gray(`  Repo        : ${pkg.repo}`));
            } else if (pkg.status.includes("ERROR")) {
                errorCount++;
                console.log(`\n${pkg.status} ${chalk.white(pkg.name)} (${pkg.version}) [${pkg.type}]`);
                console.log(chalk.red(`  Error       : ${pkg.reasons}`));
            } else {
                activeCount++;
            }
        });
        console.log("\n--- Summary ---");
        console.log(`Total dependencies checked: ${totalDependencies}`);
        console.log(`Active packages: ${activeCount}`);
        console.log(chalk.yellow(`Potentially stale packages: ${staleCount}`));
        console.log(chalk.red(`Packages with check errors: ${errorCount}`));
        if (githubToken === null) {
            console.log(chalk.cyan("\nTip: For more reliable GitHub checks on larger projects, provide a GitHub Personal Access Token using `--github-token <YOUR_TOKEN>` to avoid API rate limits."));
            console.log(chalk.cyan("   You can generate a token at https://github.com/settings/tokens (no special permissions needed for public repos)."));
        }
    } catch (error) {
        spinner.fail(chalk.red(`An unexpected error occurred during staleness check: ${error.message}`));
        console.error(chalk.red(error.stack));
    }
};