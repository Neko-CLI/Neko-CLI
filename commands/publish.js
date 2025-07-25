import chalk from "chalk";
import { exec } from "child_process";
import fsExtra from "fs-extra";
import ora from "ora";
import axios from "axios";
import path from "path";
import https from "https";

const { readJson, existsSync, removeSync, readFileSync } = fsExtra;

const execAsync = (command, options) => {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                error.stdout = stdout;
                error.stderr = stderr;
                return reject(error);
            }
            resolve({ stdout, stderr });
        });
    });
};

const checkNpmLoginStatus = async () => {
    try {
        const { stdout } = await execAsync("npm whoami");
        return stdout.trim() !== "";
    } catch (error) {
        return false;
    }
};

const publishToNpm = async (dir, otp) => {
    const spinner = ora(chalk.cyan("Publishing to npm...")).start();
    let command = "npm publish";
    if (otp) {
        command += ` --otp="${otp}"`;
    }

    try {
        const { stdout, stderr } = await execAsync(command, { cwd: dir });
        spinner.succeed(chalk.cyan("Package published to npm successfully!"));
        console.log(chalk.gray(stdout));
        if (stderr) console.error(chalk.yellow(stderr));
        return true;
    } catch (error) {
        spinner.fail(chalk.red(`❌ Failed to publish to npm: ${error.message}`));
        if (error.stderr) {
            if (error.stderr.includes("You cannot publish over the previously published versions")) {
                console.error(
                    chalk.red(
                        "🚨 Error: This version has already been published. Please update the 'version' field in your package.json."
                    )
                );
            } else if (error.stderr.includes("Two factor authentication enabled") || error.stderr.includes("requires a one-time password")) {
                console.error(
                    chalk.red("🚨 Error: Two-factor authentication is enabled. Use `meow publish npm --otp=<your-otp-code>`.")
                );
            } else {
                console.error(chalk.red(error.stderr));
            }
        }
        if (error.stdout) console.error(chalk.red(error.stdout));
        return false;
    }
};

const publishToYarn = async (dir, otp) => {
    const spinner = ora(chalk.cyan("Publishing to Yarn registry...")).start();
    let command = "yarn publish";
    if (otp) {
        command += ` --otp="${otp}"`;
    }

    try {
        const { stdout, stderr } = await execAsync(command, { cwd: dir });
        spinner.succeed(chalk.cyan("Package published to Yarn registry successfully!"));
        console.log(chalk.gray(stdout));
        if (stderr) console.error(chalk.yellow(stderr));
        return true;
    } catch (error) {
        spinner.fail(chalk.red(`❌ Failed to publish to Yarn registry: ${error.message}`));
        if (error.stderr) {
            if (error.stderr.includes("Can't answer a question unless a user TTY") && error.stderr.includes("Two factor authentication enabled")) {
                console.error(chalk.red("🚨 Error: Two-factor authentication is enabled. Use `meow publish yarn --otp=<your-otp-code>` to provide the OTP."));
            } else if (error.stderr.includes("already exists") || error.stderr.includes("You cannot publish over the previously published versions")) {
                console.error(chalk.red("🚨 Error: This version has already been published. Please update the 'version' field in your package.json."));
            } else {
                console.error(chalk.red(error.stderr));
            }
        }
        if (error.stdout) console.error(chalk.red(error.stdout));
        return false;
    }
};

const publishToMeowRegistry = async (dir) => {
    const spinner = ora(chalk.cyan(`Publishing to NekoCLI custom registry...`)).start();
    let tarballPath = null;

    try {
        const packageJson = await readJson(path.join(dir, 'package.json'));
        const { name: packageName, version: packageVersion } = packageJson;
        const meowRegistryUrl = packageJson.publishConfig?.registry || process.env.NEKO_REGISTRY_URL;

        if (!meowRegistryUrl) {
            spinner.fail(chalk.red("Custom 'meow' registry URL not configured in package.json (publishConfig.registry) or NEKO_REGISTRY_URL environment variable."));
            return false;
        }

        if (!packageName || !packageVersion) {
            spinner.fail(chalk.red("package.json must have 'name' and 'version' fields for custom registry publish."));
            return false;
        }

        try {
            new URL(meowRegistryUrl);
        } catch (e) {
            spinner.fail(chalk.red(`Invalid 'meow' registry URL: ${meowRegistryUrl}. Please check package.json or NEKO_REGISTRY_URL.`));
            return false;
        }

        tarballPath = path.join(dir, `${packageName}-${packageVersion}.tgz`);
        await execAsync(`npm pack --pack-destination "${dir}"`, { cwd: dir });

        if (!existsSync(tarballPath)) {
            spinner.fail(chalk.red(`Failed to create tarball at ${tarballPath}.`));
            return false;
        }

        const tarballBuffer = readFileSync(tarballPath);

        const agent = new https.Agent({ rejectUnauthorized: false });

        const publishUrl = `${meowRegistryUrl.endsWith('/') ? meowRegistryUrl : meowRegistryUrl + '/'}${packageName}/-/${packageName}-${packageVersion}.tgz`;

        const response = await axios.put(publishUrl, tarballBuffer, {
            headers: {
                'Content-Type': 'application/octet-stream',
            },
            httpsAgent: agent,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        if (response.status >= 200 && response.status < 300) {
            spinner.succeed(chalk.cyan(`Package published to NekoCLI custom registry successfully! Status: ${response.status}`));
            return true;
        } else {
            spinner.fail(chalk.red(`Failed to publish to NekoCLI custom registry. Status: ${response.status}, Message: ${response.statusText}`));
            return false;
        }

    } catch (error) {
        spinner.fail(chalk.red(`Failed to publish to NekoCLI custom registry: ${error.message}`));
        if (error.response?.data) {
            console.error(chalk.red(`Registry response: ${JSON.stringify(error.response.data, null, 2)}`));
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            console.error(chalk.red(`Network error: Could not connect to the registry at ${error.config?.url || 'unknown URL'}. Please check the URL and your internet connection.`));
        }
        return false;
    } finally {
        if (tarballPath && existsSync(tarballPath)) {
            removeSync(tarballPath);
            console.log(chalk.gray(`Cleaned up temporary tarball: ${tarballPath}`));
        }
    }
};

export const handlePublishCommand = async (registryType, options) => {
    console.log(chalk.cyan(`🚀 Attempting to publish package to: ${registryType || 'default'}...`));

    const currentDir = process.cwd();
    const packageJsonPath = path.join(currentDir, 'package.json');

    if (!existsSync(packageJsonPath)) {
        console.error(chalk.red("❌ package.json not found in the current directory. Cannot publish."));
        return;
    }

    const otpOption = options.find(opt => opt.startsWith('--otp='));
    const otp = otpOption ? otpOption.split('=')[1] : null;

    switch (registryType) {
        case "npm":
            const loggedInNpm = await checkNpmLoginStatus();
            if (!loggedInNpm) {
                console.warn(chalk.yellow("⚠️ Not logged in to npm. Please run 'npm login' first."));
                return;
            }
            await publishToNpm(currentDir, otp);
            break;
        case "yarn":
            await publishToYarn(currentDir, otp);
            break;
        case "meow":
            await publishToMeowRegistry(currentDir);
            break;
        default:
            console.error(chalk.red("❌ Invalid publish platform specified. Use 'npm', 'yarn', or 'meow'."));
            break;
    }
    console.log(chalk.yellow("⚠️ Remember to increment the version number in your package.json before each new publication!"));
};