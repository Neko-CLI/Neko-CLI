import chalk from "chalk";
import ora from "ora";
import chalkAnimation from "chalk-animation";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
function updateNekoRockForRemoval(packageName, isDevDependency) {
    const nekoRockPath = path.join(process.cwd(), 'deps.neko');
    let nekoRockContent = {};
    if (fs.existsSync(nekoRockPath)) {
        try {
            const fileContent = fs.readFileSync(nekoRockPath, 'utf8');
            nekoRockContent = yaml.load(fileContent);
            if (typeof nekoRockContent !== 'object' || nekoRockContent === null) {
                console.log(chalk.yellow(`(deps.neko) Warning: 'deps.neko' content is invalid for removal. Reinitializing.`));
                nekoRockContent = {};
            }
        } catch (error) {
            console.error(chalk.red(`(deps.neko) Error reading or parsing 'deps.neko' for removal: ${error.message}. Reinitializing.`));
            nekoRockContent = {};
        }
    } else {
        console.log(chalk.gray(`(deps.neko) 'deps.neko' file not found during removal. No lock file update needed.`));
        return;
    }
    nekoRockContent.dependencies = nekoRockContent.dependencies || {};
    nekoRockContent.devDependencies = nekoRockContent.devDependencies || {};
    let removed = false;
    if (isDevDependency) {
        if (nekoRockContent.devDependencies[packageName]) {
            delete nekoRockContent.devDependencies[packageName];
            console.log(chalk.gray(`(deps.neko) Removed ${packageName} from devDependencies.`));
            removed = true;
        }
    } else {
        if (nekoRockContent.dependencies[packageName]) {
            delete nekoRockContent.dependencies[packageName];
            console.log(chalk.gray(`(deps.neko) Removed ${packageName} from dependencies.`));
            removed = true;
        }
    }
    if (removed) {
        try {
            const header = "# Neko-CLI package lock file\n# This file tracks installed package versions and integrity.\n";
            const dumpedContent = yaml.dump(nekoRockContent, { lineWidth: -1 });
            fs.writeFileSync(nekoRockPath, header + dumpedContent, 'utf8');
        } catch (error) {
            console.error(chalk.red(`(deps.neko) Error writing to 'deps.neko' after removal for ${packageName}: ${error.message}`));
        }
    } else {
        console.log(chalk.yellow(`(deps.neko) Package ${packageName} not found in 'deps.neko' for removal. No lock file update needed.`));
    }
}
export const handleRemoveCommand = async (args) => {
    const commandArgs = args.slice(1);
    if (commandArgs.length === 0) {
        console.log(
            chalk.yellow("❌ Error: You must specify at least one package name to remove.")
        );
        console.log(chalk.cyan("Usage: meow remove <package-name> [--global | --dev]"));
        return;
    }
    const isGlobalRemove = commandArgs.includes("-g") || commandArgs.includes("--global");
    const isDevRemove = commandArgs.includes("--dev");
    const packagesToRemove = commandArgs.filter(
        (arg) => !arg.startsWith("-")
    );
    if (packagesToRemove.length === 0) {
        console.log(
            chalk.yellow("❌ Error: No valid packages specified for removal.")
        );
        console.log(chalk.cyan("Usage: meow remove <package-name> [--global | --dev]"));
        return;
    }
    const animationRemove = chalkAnimation.rainbow(
        "=^._.^= Meow is removing the packages..."
    );
    const spinnerRemove = ora(
        isGlobalRemove ? "Removing global packages..." : "Removing packages..."
    ).start();
    const removeScope = isGlobalRemove
        ? "globally"
        : isDevRemove
            ? "from dev dependencies locally"
            : "locally";
    const uninstallPackage = (packageName) => {
        return new Promise((resolve, reject) => {
            const uninstallCommand = `npm uninstall ${packageName} ${
                isGlobalRemove ? "--global" : isDevRemove ? "--save-dev" : "--save"
            } --silent`;
            exec(uninstallCommand, (err, stdout, stderr) => {
                if (err) {
                    return reject(
                        `Error during ${removeScope} package uninstallation: ${stderr || stdout || err.message}`
                    );
                } else {
                    updateNekoRockForRemoval(packageName, isDevRemove);
                    resolve(`${packageName} removed ${removeScope} successfully.`);
                }
            });
        });
    };
    const uninstallSequentially = async () => {
        for (let i = 0; i < packagesToRemove.length; i++) {
            const packageName = packagesToRemove[i];
            try {
                const result = await uninstallPackage(packageName);
                console.log(chalk.cyan(`🗑️ ${result}`));
            } catch (err) {
                console.log(
                    chalk.yellow(
                        `An error occurred with ${packageName}: ${err}`
                    )
                );
            }
        }
        spinnerRemove.stop();
        animationRemove.stop();
        console.log(chalk.cyan("Uninstallation complete! 🎉"));
    };
    uninstallSequentially();
};