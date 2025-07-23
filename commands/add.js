import chalk from "chalk";
import ora from "ora";
import chalkAnimation from "chalk-animation";
import { exec } from "child_process";
import crypto from "crypto";
import https from "https";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

async function calculateIntegrity(tarballUrl) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha512');
        https.get(tarballUrl, (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to download tarball: HTTP status code ${response.statusCode} for ${tarballUrl}`));
            }
            response.on('data', (chunk) => {
                hash.update(chunk);
            });
            response.on('end', () => {
                resolve(`sha512-${hash.digest('base64')}`);
            });
            response.on('error', (err) => {
                reject(new Error(`Error downloading tarball from ${tarballUrl}: ${err.message}`));
            });
        }).on('error', (err) => {
            reject(new Error(`Error making HTTP request to ${tarballUrl}: ${err.message}`));
        });
    });
}

function readNekoRockFile() {
    const nekoRockPath = path.join(process.cwd(), 'deps.neko');
    if (fs.existsSync(nekoRockPath)) {
        try {
            const fileContent = fs.readFileSync(nekoRockPath, 'utf8');
            const yamlContent = fileContent.replace(/# Neko-CLI package lock file\n# This file tracks installed package versions and integrity.\n/, '');
            const parsedContent = yaml.load(yamlContent);
            if (typeof parsedContent !== 'object' || parsedContent === null) {
                console.log(chalk.yellow(`(deps.neko) Warning: 'deps.neko' content is invalid. Reinitializing.`));
                return { dependencies: {}, devDependencies: {} };
            }
            return parsedContent;
        } catch (error) {
            console.error(chalk.red(`(deps.neko) Error reading or parsing 'deps.neko': ${error.message}. Reinitializing.`));
            return { dependencies: {}, devDependencies: {} };
        }
    } else {
        console.log(chalk.gray(`(deps.neko) 'deps.neko' file not found. Creating new file.`));
        return { dependencies: {}, devDependencies: {} };
    }
}

function writeNekoRockFile(content) {
    const nekoRockPath = path.join(process.cwd(), 'deps.neko');
    try {
        const header = "# Neko-CLI package lock file\n# This file tracks installed package versions and integrity.\n";
        const dumpedContent = yaml.dump(content, { lineWidth: -1, skipInvalid: true });
        fs.writeFileSync(nekoRockPath, header + dumpedContent, 'utf8');
    } catch (error) {
        console.error(chalk.red(`(deps.neko) Error writing to 'deps.neko': ${error.message}`));
    }
}

function updateNekoRockForAddition(packageName, packageInfo, isDevAdd) {
    const nekoRockContent = readNekoRockFile();

    nekoRockContent.dependencies = nekoRockContent.dependencies || {};
    nekoRockContent.devDependencies = nekoRockContent.devDependencies || {};

    const targetSection = isDevAdd ? nekoRockContent.devDependencies : nekoRockContent.dependencies;

    targetSection[packageName] = {
        version: packageInfo.version,
        resolved: packageInfo.resolved,
        integrity: packageInfo.integrity
    };

    console.log(chalk.gray(`(deps.neko) Added/Updated ${packageName} in ${isDevAdd ? 'devDependencies' : 'dependencies'}.`));
    writeNekoRockFile(nekoRockContent);
}

async function fetchPackageDetails(packageName) {
    return new Promise((resolve, reject) => {
        const npmCommand = `npm view ${packageName} version dist.tarball --json`;
        exec(npmCommand, async (err, stdout, stderr) => {
            if (err) {
                let errorMessage = `Failed to fetch package details for ${packageName}`;
                if (stderr && stderr.includes("E404")) {
                    errorMessage = `Package '${packageName}' not found in registry.`;
                } else if (err.message) {
                    errorMessage += `: ${err.message}`;
                }
                return reject(errorMessage);
            }
            try {
                const info = JSON.parse(stdout);
                if (!info || !info['dist.tarball'] || !info.version) {
                    return reject(`Package ${packageName} does not have complete metadata (tarball URL or version).`);
                }
                const tarballUrl = info['dist.tarball'];
                const integrity = await calculateIntegrity(tarballUrl);
                resolve({
                    version: info.version,
                    resolved: tarballUrl,
                    integrity: integrity,
                });
            } catch (error) {
                return reject(`Error processing package metadata for ${packageName}: ${error.message || error.toString()}`);
            }
        });
    });
}

async function installPackage(packageName, isGlobalAdd, isDevAdd, addScope) {
    try {
        const packageInfo = await fetchPackageDetails(packageName);
        updateNekoRockForAddition(packageName, packageInfo, isDevAdd);

        const installCommand = `npm install ${packageName} ${
            isGlobalAdd ? "--global" : isDevAdd ? "--save-dev" : "--save"
        } --silent`;

        return new Promise((resolve, reject) => {
            exec(installCommand, (err, stdout, stderr) => {
                if (err) {
                    return reject(
                        `Error during ${addScope} package installation for ${packageName}: ${stderr || stdout || err.message}`
                    );
                } else {
                    resolve(`${packageName} added ${addScope} successfully.`);
                }
            });
        });
    } catch (error) {
        throw new Error(`Failed to install ${packageName}: ${error.message || error.toString()}`);
    }
}

export const handleAddCommand = async (args) => {
    const commandArgs = args.slice(1);

    if (commandArgs.length === 0) {
        console.log(chalk.yellow("❌ Error: You must specify at least one package name to add."));
        console.log(chalk.cyan("Usage: meow add <package-name> [--global | --dev]"));
        return;
    }

    const isGlobalAdd = commandArgs.includes("-g") || commandArgs.includes("--global");
    const isDevAdd = commandArgs.includes("--dev");
    const packagesToAdd = commandArgs.filter((arg) => !arg.startsWith("-"));

    if (packagesToAdd.length === 0) {
        console.log(chalk.yellow("❌ Error: No valid packages specified for addition."));
        console.log(chalk.cyan("Usage: meow add <package-name> [--global | --dev]"));
        return;
    }

    if (isGlobalAdd && isDevAdd) {
        console.log(chalk.yellow("❌ Error: Cannot use --global and --dev together."));
        return;
    }

    const animationAdd = chalkAnimation.rainbow("=^._.^= Meow is adding the packages...");
    const spinnerAdd = ora(
        isGlobalAdd ? "Adding global packages..." : "Adding packages..."
    ).start();

    const addScope = isGlobalAdd
        ? "globally"
        : isDevAdd
            ? "to dev dependencies locally"
            : "locally";

    const installPromises = packagesToAdd.map(packageName =>
        installPackage(packageName, isGlobalAdd, isDevAdd, addScope)
            .then(result => {
                console.log(chalk.cyan(`🎉 ${result}`));
                return { packageName, status: 'success' };
            })
            .catch(err => {
                console.log(chalk.yellow(`An error occurred with ${packageName}: ${err}`));
                return { packageName, status: 'failure', error: err };
            })
    );

    await Promise.allSettled(installPromises);

    spinnerAdd.stop();
    animationAdd.stop();
    console.log(chalk.cyan("Installation complete! 🎉"));
};