import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import yaml from "js-yaml";

async function detectPackageManager() {
    if (fs.existsSync(path.resolve(process.cwd(), "pnpm-lock.yaml"))) {
        return "pnpm";
    }
    if (fs.existsSync(path.resolve(process.cwd(), "yarn.lock"))) {
        return "yarn";
    }
    if (fs.existsSync(path.resolve(process.cwd(), "package.json"))) {
        return "npm";
    }
    return null;
}

async function installDependencies(command, packages = []) {
    const fullCommand = packages.length > 0 ? `${command} install ${packages.join(" ")} --silent` : `${command} install --silent`;
    const spinner = ora(`Installing dependencies with ${command}...`).start();

    return new Promise((resolve, reject) => {
        exec(fullCommand, (err, stdout, stderr) => {
            spinner.stop();
            if (err) {
                console.error(chalk.red(`❌ Error installing dependencies with ${command}: ${err.message}`));
                if (stderr) console.error(chalk.red(`   ${stderr}`));
                return reject(err);
            }
            console.log(chalk.cyan(`Dependencies installed successfully with ${command}.`));
            resolve();
        });
    });
}

async function readNekoRockDependencies() {
    const nekoRockPath = path.resolve(process.cwd(), "deps.neko");
    const packagesToInstall = [];

    if (fs.existsSync(nekoRockPath)) {
        console.log(chalk.cyan("Found deps.neko, checking for dependencies..."));
        try {
            const fileContent = fs.readFileSync(nekoRockPath, 'utf8');
            const yamlContent = fileContent.replace(/# Neko-CLI package lock file\n# This file tracks installed package versions and integrity.\n/, '');
            const nekoData = yaml.load(yamlContent);

            if (nekoData && nekoData.dependencies) {
                Object.keys(nekoData.dependencies).forEach(pkgName => {
                    const pkgInfo = nekoData.dependencies[pkgName];
                    if (pkgInfo.version) {
                        packagesToInstall.push(`${pkgName}@${pkgInfo.version}`);
                    }
                });
            }
            if (nekoData && nekoData.devDependencies) {
                Object.keys(nekoData.devDependencies).forEach(pkgName => {
                    const pkgInfo = nekoData.devDependencies[pkgName];
                    if (pkgInfo.version) {
                        packagesToInstall.push(`${pkgName}@${pkgInfo.version}`);
                    }
                });
            }

            if (packagesToInstall.length > 0) {
                console.log(chalk.cyan(`Dependencies found in deps.neko.`));
            } else {
                console.log(chalk.cyan("No specific package versions found in deps.neko for direct installation."));
            }
        } catch (error) {
            console.error(chalk.red(`Error parsing deps.neko: ${error.message}. Attempting to fall back to package.json.`));
        }
    } else {
        console.log(chalk.cyan("deps.neko file not found."));
    }
    return packagesToInstall;
}

async function readPackageJsonDependencies() {
    const packageJsonPath = path.resolve(process.cwd(), "package.json");
    const packagesToInstall = [];

    if (fs.existsSync(packageJsonPath)) {
        console.log(chalk.cyan("Found package.json, checking for dependencies..."));
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
            const dependencies = packageJson.dependencies || {};
            const devDependencies = packageJson.devDependencies || {};

            Object.keys(dependencies).forEach((dep) => {
                packagesToInstall.push(`${dep}@${dependencies[dep]}`);
            });
            Object.keys(devDependencies).forEach((dep) => {
                packagesToInstall.push(`${dep}@${devDependencies[dep]}`);
            });

            if (packagesToInstall.length > 0) {
                console.log(chalk.cyan("Dependencies found in package.json."));
            } else {
                console.log(chalk.yellow("No dependencies found in package.json."));
            }
        } catch (error) {
            console.error(chalk.red(`Error parsing package.json: ${error.message}`));
        }
    } else {
        console.log(chalk.yellow("No package.json found."));
    }
    return packagesToInstall;
}

const installAllPackages = async () => {
    const nekoRockPath = path.resolve(process.cwd(), "deps.neko");

    if (!fs.existsSync(nekoRockPath)) {
        console.log(chalk.cyan("deps.neko file not found. It will be created when packages are added."));
    }

    let packagesFromNekoRock = await readNekoRockDependencies();
    let packagesFromPackageJson = [];

    if (packagesFromNekoRock.length === 0) {
        packagesFromPackageJson = await readPackageJsonDependencies();
    }

    const packagesToInstall = packagesFromNekoRock.length > 0 ? packagesFromNekoRock : packagesFromPackageJson;

    if (packagesToInstall.length > 0) {
        const packageManager = await detectPackageManager();
        if (packageManager) {
            console.log(chalk.cyan(`Detected ${packageManager} for installation.`));
            try {
                await installDependencies(packageManager, packagesToInstall);
            } catch (error) {}
        } else {
            console.log(chalk.yellow("No supported package manager lock file or package.json found to directly install listed dependencies."));
            console.log(chalk.yellow("Please ensure npm, yarn, or pnpm is set up, or run 'npm install', 'yarn install', or 'pnpm install' manually."));
        }
    } else {
        console.log(chalk.yellow("No specific package dependencies found in deps.neko or package.json for direct installation."));
        console.log(chalk.cyan("Attempting a generic install based on detected lock files."));
        const packageManager = await detectPackageManager();
        if (packageManager) {
             console.log(chalk.cyan(`Detected ${packageManager} lock file. Running ${packageManager} install...`));
            try {
                await installDependencies(packageManager);
            } catch (error) {}
        } else {
            console.log(chalk.yellow("Error: No package.json, yarn.lock, or pnpm-lock.yaml found for a generic installation."));
        }
    }
};

export const handleAllCommand = async () => {
    await installAllPackages();
};