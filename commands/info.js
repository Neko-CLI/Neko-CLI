import chalk from "chalk";
import ora from "ora";
import { execAsync } from "../utils/execUtils.js";
import * as fsp from "fs/promises";
import readline from "readline";
async function getPackageManager() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const askQuestion = (query) =>
        new Promise((resolve) => rl.question(query, resolve));
    let hasYarnLock, hasPackageJson;
    const checkFilesSpinner = ora(chalk.cyan("Detecting local package manager configuration...")).start();
    try {
        hasYarnLock = await fsp.access("yarn.lock").then(() => true).catch(() => false);
        hasPackageJson = await fsp.access("package.json").then(() => true).catch(() => false);
        checkFilesSpinner.succeed(chalk.cyan("Local package manager configuration detected."));
    } catch (fileAccessError) {
        checkFilesSpinner.fail(chalk.red(`❌ Error checking for manifest files: ${fileAccessError.message}`));
        rl.close();
        return null;
    }
    let packageManager;
    if (hasYarnLock && hasPackageJson) {
        const answer = await askQuestion(
            chalk.cyan("Both yarn.lock and package.json are detected. Which package manager would you like to use? (y/npm) > ")
        );
        packageManager = answer.toLowerCase() === "y" ? "yarn" : "npm";
        rl.close();
    } else if (hasYarnLock) {
        packageManager = "yarn";
        console.log(chalk.cyan("Yarn lock file detected. Using Yarn."));
        rl.close();
    } else if (hasPackageJson) {
        packageManager = "npm";
        console.log(chalk.cyan("package.json detected. Using NPM."));
        rl.close();
    } else {
        rl.close();
        const npmSpinner = ora(chalk.cyan("No local config found. Checking for global npm installation...")).start();
        try {
            await execAsync("npm --version", { stdio: "ignore" });
            npmSpinner.succeed(chalk.cyan("NPM found globally."));
            return "npm";
        } catch (npmError) {
            npmSpinner.fail(chalk.yellow("NPM not found globally."));
        }
        const yarnSpinner = ora(chalk.cyan("Checking for global yarn installation...")).start();
        try {
            await execAsync("yarn --version", { stdio: "ignore" });
            yarnSpinner.succeed(chalk.cyan("Yarn found globally."));
            return "yarn";
        } catch (yarnError) {
            yarnSpinner.fail(chalk.yellow("Yarn not found globally."));
        }
        return null;
    }
    return packageManager;
}
export const handleInfoCommand = async (packageName) => {
    let infoSpinner;
    try {
        if (!packageName) {
            console.error(chalk.yellow("❌ Please specify a package name for the info command. Example: `meow info express`"));
            return;
        }
        console.log(chalk.cyan(`\n🔍 Fetching advanced information for package: ${chalk.cyan(packageName)}...`));
        const packageManager = await getPackageManager();
        if (!packageManager) {
            console.error(chalk.red("❌ No package manager (npm or yarn) found or detected. Aborting."));
            return;
        }
        const command =
            packageManager === "npm"
                ? `npm show ${packageName} --json`
                : `yarn info ${packageName} --json`;
        infoSpinner = ora(chalk.cyan(`Running meow info to fetch details...`)).start();
        let stdout, stderr;
        try {
            ({ stdout, stderr } = await execAsync(command));
            infoSpinner.succeed(chalk.cyan(`✔️ Successfully fetched info for ${packageName}.`));
        } catch (execError) {
            infoSpinner.fail(chalk.red(`❌ Failed to fetch package info for ${packageName}.`));
            console.error(chalk.red(`  Error: ${execError.message}`));
            if (execError.stderr) console.error(chalk.red(`  Details: ${execError.stderr.trim()}`));
            return;
        }
        if (stderr && stderr.trim() !== "") {
            console.log(chalk.yellow(`⚠️ Warnings/Info from ${packageManager} info: ${stderr.trim()}`));
        }
        let packageInfo;
        try {
            const parsedOutput = JSON.parse(stdout);
            packageInfo = packageManager === "yarn" ? parsedOutput.data : parsedOutput;
            if (!packageInfo) {
                console.error(chalk.yellow(`❌ No information found for package: ${packageName}. It might not exist or the output format is unexpected.`));
                return;
            }
        } catch (jsonError) {
            console.error(chalk.red(`❌ Error parsing JSON output from ${packageManager} info: ${jsonError.message}`));
            console.error(chalk.red(`Raw output: ${stdout}`));
            return;
        }
        console.log(chalk.cyan(`\n--- Detailed Information for ${chalk.cyan(packageName)} ---`));
        console.log(chalk.gray("------------------------------------------------------"));
        const formatInfo = (label, value) => {
            return value
                ? `${chalk.cyan(label)}: ${chalk.white(value)}`
                : `${chalk.cyan(label)}: ${chalk.dim("N/A")}`;
        };
        console.log(formatInfo("Name", packageInfo.name || packageName));
        console.log(formatInfo("Version", packageInfo.version));
        console.log(formatInfo("Description", packageInfo.description));
        console.log(formatInfo("Homepage", packageInfo.homepage));
        console.log(formatInfo("License", packageInfo.license));
        console.log(
            formatInfo(
                "Keywords",
                packageInfo.keywords ? packageInfo.keywords.join(", ") : null
            )
        );
        console.log(
            formatInfo(
                "Repository",
                packageInfo.repository && packageInfo.repository.url ? packageInfo.repository.url : null
            )
        );
        console.log(
            formatInfo("Author", packageInfo.author && packageInfo.author.name ? packageInfo.author.name : null)
        );
        const maintainers = packageInfo.maintainers
            ? packageInfo.maintainers.map((m) => typeof m === 'object' ? m.name : m).filter(Boolean).join(", ")
            : null;
        console.log(formatInfo("Maintainers", maintainers));
        const contributors = packageInfo.contributors
            ? packageInfo.contributors.map((c) => typeof c === 'object' ? c.name : c).filter(Boolean).join(", ")
            : null;
        console.log(formatInfo("Contributors", contributors));
        const deps = packageInfo.dependencies
            ? Object.keys(packageInfo.dependencies).join(", ")
            : null;
        console.log(formatInfo("Dependencies", deps));
        const devDeps = packageInfo.devDependencies
            ? Object.keys(packageInfo.devDependencies).join(", ")
            : null;
        console.log(formatInfo("DevDependencies", devDeps));
        const distTags = packageInfo["dist-tags"] || (packageInfo.versions && packageInfo.versions[packageInfo.version] && packageInfo.versions[packageInfo.version]["dist-tags"])
            ? Object.entries(packageInfo["dist-tags"] || packageInfo.versions[packageInfo.version]["dist-tags"])
                .map(([tag, version]) => `${tag}: ${version}`)
                .join(", ")
            : null;
        console.log(formatInfo("Dist Tags", distTags));
        console.log(formatInfo("Latest Version", packageInfo['dist-tags']?.latest || packageInfo.version));
        console.log(formatInfo("Last Publish Date", packageInfo.time?.modified || 'N/A'));
        console.log(chalk.gray("------------------------------------------------------"));
    } catch (error) {
        if (infoSpinner && infoSpinner.isSpinning) {
            infoSpinner.fail(chalk.red("💥 An unexpected error occurred!"));
        }
        console.error(chalk.red(`\n💥 Error during fetching package info: ${error.message}`));
        if (error.stdout) console.error(chalk.red(`  Output: ${error.stdout}`));
        if (error.stderr) console.error(chalk.red(`  Error: ${error.stderr}`));
        console.error(chalk.yellow("Please ensure the package name is correct and your internet connection is stable."));
    }
};