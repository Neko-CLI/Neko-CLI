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
                return reject(new Error(`Failed to download tarball: HTTP status code ${response.statusCode}`));
            }
            response.on('data', (chunk) => {
                hash.update(chunk);
            });
            response.on('end', () => {
                resolve(`sha512-${hash.digest('base64')}`);
            });
            response.on('error', (err) => {
                reject(new Error(`Error downloading tarball: ${err.message}`));
            });
        }).on('error', (err) => {
            reject(new Error(`Error making HTTP request: ${err.message}`));
        });
    });
}

function updateNekoRockForAddition(packageName, packageInfo, isDevAdd) {
    const nekoRockPath = path.join(process.cwd(), 'deps.neko');
    let nekoRockContent = {};

    if (fs.existsSync(nekoRockPath)) {
        try {
            const fileContent = fs.readFileSync(nekoRockPath, 'utf8');
            const yamlContent = fileContent.replace(/# Neko-CLI package lock file\n# This file tracks installed package versions and integrity.\n/, '');
            nekoRockContent = yaml.load(yamlContent);
            if (typeof nekoRockContent !== 'object' || nekoRockContent === null) {
                console.log(chalk.yellow(`(deps.neko) Warning: 'deps.neko' content is invalid. Reinitializing.`));
                nekoRockContent = { dependencies: {}, devDependencies: {} };
            }
        } catch (error) {
            console.error(chalk.red(`(deps.neko) Error reading or parsing 'deps.neko': ${error.message}. Reinitializing.`));
            nekoRockContent = { dependencies: {}, devDependencies: {} };
        }
    } else {
        console.log(chalk.gray(`(deps.neko) 'deps.neko' file not found. Creating new file.`));
        nekoRockContent = { dependencies: {}, devDependencies: {} };
    }

    nekoRockContent.dependencies = nekoRockContent.dependencies || {};
    nekoRockContent.devDependencies = nekoRockContent.devDependencies || {};

    const targetSection = isDevAdd ? nekoRockContent.devDependencies : nekoRockContent.dependencies;

    targetSection[packageName] = {
        version: packageInfo.version,
        resolved: packageInfo.resolved,
        integrity: packageInfo.integrity
    };

    console.log(chalk.gray(`(deps.neko) Added/Updated ${packageName} in ${isDevAdd ? 'devDependencies' : 'dependencies'}.`));

    try {
        const header = "# Neko-CLI package lock file\n# This file tracks installed package versions and integrity.\n";
        const dumpedContent = yaml.dump(nekoRockContent, { lineWidth: -1, skipInvalid: true });
        fs.writeFileSync(nekoRockPath, header + dumpedContent, 'utf8');
    } catch (error) {
        console.error(chalk.red(`(deps.neko) Error writing to 'deps.neko' after addition for ${packageName}: ${error.message}`));
    }
}

export const handleAddCommand = async (args) => {
    const commandArgs = args.slice(1);

    if (commandArgs.length === 0) {
        console.log(
            chalk.yellow("❌ Error: You must specify at least one package name to add.")
        );
        console.log(chalk.cyan("Usage: meow add <package-name> [--global | --dev]"));
        return;
    }

    const isGlobalAdd = commandArgs.includes("-g") || commandArgs.includes("--global");
    const isDevAdd = commandArgs.includes("--dev");
    const packagesToAdd = commandArgs.filter(
        (arg) => !arg.startsWith("-")
    );

    if (packagesToAdd.length === 0) {
        console.log(
            chalk.yellow("❌ Error: No valid packages specified for addition.")
        );
        console.log(chalk.cyan("Usage: meow add <package-name> [--global | --dev]"));
        return;
    }

    const filteredPackagesToAdd = packagesToAdd;
    const animationAdd = chalkAnimation.rainbow(
        "=^._.^= Meow is adding the packages..."
    );
    const spinnerAdd = ora(
        isGlobalAdd ? "Adding global packages..." : "Adding packages..."
    ).start();

    const addScope = isGlobalAdd
        ? "globally"
        : isDevAdd
            ? "to dev dependencies locally"
            : "locally";

    const installPackage = (packageName) => {
        return new Promise((resolve, reject) => {
            const npmCommand = `npm show ${packageName} dist version --json`;
            exec(npmCommand, async (err, stdout, stderr) => {
                if (err) {
                    let errorMessage = `Failed to fetch package details for ${packageName}`;
                    if (stderr && stderr.includes("E404")) {
                        errorMessage = `Package '${packageName}' not found in npm registry.`;
                    } else if (err.message) {
                        errorMessage += `: ${err.message}`;
                    }
                    return reject(errorMessage);
                }
                try {
                    const info = JSON.parse(stdout);
                    if (!info.dist || !info.dist.tarball) {
                        return reject(`Package ${packageName} does not have a valid tarball URL.`);
                    }
                    const tarballUrl = info.dist.tarball;
                    const packageInfo = {
                        version: info.version,
                        resolved: tarballUrl,
                        integrity: await calculateIntegrity(tarballUrl),
                    };

                    updateNekoRockForAddition(packageName, packageInfo, isDevAdd);

                    const installCommand = `npm install ${packageName} ${
                        isGlobalAdd ? "--global" : isDevAdd ? "--save-dev" : "--save"
                    } --silent`;

                    exec(installCommand, (err, stdout, stderr) => {
                        if (err) {
                            return reject(
                                `Error during ${addScope} package installation: ${stderr || stdout || err.message}`
                            );
                        } else {
                            resolve(`${packageName} added ${addScope} successfully.`);
                        }
                    });
                } catch (error) {
                    return reject(`Error processing package ${packageName}: ${error.message || error.toString()}`);
                }
            });
        });
    };

    const installSequentially = async () => {
        for (let i = 0; i < filteredPackagesToAdd.length; i++) {
            const packageName = filteredPackagesToAdd[i];
            try {
                const result = await installPackage(packageName);
                console.log(chalk.cyan(`🎉 ${result}`));
            } catch (err) {
                console.log(
                    chalk.yellow(
                        `An error occurred with ${packageName}: ${err}`
                    )
                );
            }
        }
        spinnerAdd.stop();
        animationAdd.stop();
        console.log(chalk.cyan("Installation complete! 🎉"));
    };

    installSequentially();
};