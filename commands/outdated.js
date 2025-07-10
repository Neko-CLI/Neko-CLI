import chalk from "chalk";
import { execAsync } from "../utils/execUtils.js";
import readline from "readline";
import * as fsp from "fs/promises";
import ora from "ora";
import path from "path";
export const handleOutdatedCommand = async () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const askQuestion = (query) =>
        new Promise((resolve) => rl.question(query, resolve));
    try {
        let hasYarnLock, hasPackageJson;
        const checkFilesSpinner = ora(chalk.cyan("Checking for project manifest files...")).start();
        try {
            const yarnLockPath = path.join(process.cwd(), "yarn.lock");
            const packageJsonPath = path.join(process.cwd(), "package.json");
            hasYarnLock = await fsp.access(yarnLockPath).then(() => true).catch(() => false);
            hasPackageJson = await fsp.access(packageJsonPath).then(() => true).catch(() => false);
            checkFilesSpinner.succeed(chalk.cyan("Manifest files checked."));
        } catch (fileAccessError) {
            checkFilesSpinner.fail(chalk.red(`❌ Error accessing files: ${fileAccessError.message}`));
            return;
        }
        let packageManager;
        if (hasYarnLock && hasPackageJson) {
            const answer = await askQuestion(
                chalk.cyan(
                    "Both yarn.lock and package.json are detected. Which package manager would you like to use? (y/npm) > "
                )
            );
            packageManager = answer.toLowerCase() === "y" ? "yarn" : "npm";
        } else if (hasYarnLock) {
            packageManager = "yarn";
            console.log(chalk.cyan("Yarn lock file detected. Using Yarn."));
        } else if (hasPackageJson) {
            packageManager = "npm";
            console.log(chalk.cyan("package.json detected."));
        } else {
            console.log(
                chalk.yellow("❌ No yarn.lock or package.json found in the current directory. Aborting.")
            );
            return;
        }
        const outdatedCommand =
            packageManager === "yarn"
                ? "yarn outdated --json"
                : "npm outdated --json";
        const updateCommand =
            packageManager === "yarn" ? "yarn upgrade" : "npm update";
        console.log(chalk.cyan("\n🔍 Initiating check for outdated packages..."));
        const checkOutdatedSpinner = ora(chalk.cyan(`Running meow outdated command...`)).start();
        let stdout, stderr;
        try {
            ({ stdout, stderr } = await execAsync(outdatedCommand));
            checkOutdatedSpinner.succeed(chalk.cyan("Outdated packages check complete."));
        } catch (execError) {
            checkOutdatedSpinner.fail(chalk.red(`❌ Failed to check for outdated packages: ${execError.message}`));
            if (execError.stdout) console.error(chalk.red(`  Output: ${execError.stdout}`));
            if (execError.stderr) console.error(chalk.red(`  Error: ${execError.stderr}`));
            return;
        }
        if (stderr && stderr.trim() !== "") {
            console.log(chalk.yellow(`⚠️ Warnings/Info from ${packageManager} outdated: ${stderr.trim()}`));
        }
        let outdatedData;
        try {
            outdatedData = JSON.parse(stdout);
        } catch (jsonError) {
            console.error(chalk.red(`❌ Error parsing JSON output from ${packageManager} outdated: ${jsonError.message}`));
            console.error(chalk.red(`Raw output: ${stdout}`));
            return;
        }
        let packageUpdates;
        if (packageManager === "npm") {
            packageUpdates = outdatedData;
        } else {
            packageUpdates = outdatedData?.data?.body || [];
        }
        if (!packageUpdates || (Array.isArray(packageUpdates) && packageUpdates.length === 0) || (typeof packageUpdates === 'object' && Object.keys(packageUpdates).length === 0)) {
            console.log(chalk.cyan("\n✨ All packages are up-to-date. Fantastic!"));
            return;
        }
        console.log(chalk.cyan("\n📦 Outdated packages found:"));
        console.log(chalk.gray("--------------------------------------------------"));
        if (packageManager === "npm") {
            for (const [packageName, packageInfo] of Object.entries(packageUpdates)) {
                const currentVersion = packageInfo.current;
                const latestVersion = packageInfo.latest;
                console.log(
                    `${chalk.cyan(packageName)}: ${chalk.yellow(
                        currentVersion
                    )} ➔ ${chalk.cyan(latestVersion)}`
                );
            }
        } else {
            for (const packageArray of packageUpdates) {
                const packageName = packageArray[0];
                const currentVersion = packageArray[1];
                const latestVersion = packageArray[3];
                console.log(
                    `${chalk.cyan(packageName)}: ${chalk.yellow(
                        currentVersion
                    )} ➔ ${chalk.cyan(latestVersion)}`
                );
            }
        }
        console.log(chalk.gray("--------------------------------------------------"));
        const action = await askQuestion(
            chalk.cyan(
                "\nDo you want to update packages? (y = all, n = none, s = select) > "
            )
        );
        if (action.toLowerCase() === "y") {
            console.log(chalk.cyan("⏳ Updating all packages... This might take a moment."));
            const updateAllSpinner = ora(chalk.cyan(`Running outdated command'...`)).start();
            try {
                await execAsync(`${updateCommand} --silent`);
                updateAllSpinner.succeed(chalk.cyan("✅ All packages have been successfully updated!"));
            } catch (updateError) {
                updateAllSpinner.fail(chalk.red(`❌ Failed to update all packages: ${updateError.message}`));
                if (updateError.stdout) console.error(chalk.red(`  Output: ${updateError.stdout}`));
                if (updateError.stderr) console.error(chalk.red(`  Error: ${updateError.stderr}`));
            }
        } else if (action.toLowerCase() === "n") {
            console.log(chalk.cyan("❌ No packages were updated."));
        } else if (action.toLowerCase() === "s") {
            console.log(chalk.cyan("\n🎯 Starting selective update:"));
            let updatedCount = 0;
            let skippedCount = 0;
            const packagesToIterate = packageManager === "npm" ? Object.entries(packageUpdates) : packageUpdates;
            for (const entry of packagesToIterate) {
                let packageName, currentVersion, latestVersion;
                if (packageManager === "npm") {
                    [packageName, { current: currentVersion, latest: latestVersion }] = entry;
                } else {
                    [packageName, currentVersion, , latestVersion] = entry;
                }
                const updatePackage = await askQuestion(
                    `${chalk.cyan(
                        `Update ${packageName} (${chalk.yellow(currentVersion)} ➔ ${chalk.cyan(latestVersion)})?`
                    )} (y/n) > `
                );
                if (updatePackage.toLowerCase() === "y") {
                    const packageUpdateCommand =
                        packageManager === "yarn"
                            ? `yarn upgrade ${packageName} --silent`
                            : `npm update ${packageName} --silent`;
                    console.log(chalk.cyan(`⏳ Updating ${packageName}...`));
                    const updateIndividualSpinner = ora(chalk.cyan(`Running outdated update update...`)).start();
                    try {
                        await execAsync(packageUpdateCommand);
                        updateIndividualSpinner.succeed(chalk.cyan(`✅ ${packageName} updated successfully!`));
                        updatedCount++;
                    } catch (individualUpdateError) {
                        updateIndividualSpinner.fail(chalk.red(`❌ Failed to update ${packageName}: ${individualUpdateError.message}`));
                        if (individualUpdateError.stdout) console.error(chalk.red(`  Output: ${individualUpdateError.stdout}`));
                        if (individualUpdateError.stderr) console.error(chalk.red(`  Error: ${individualUpdateError.stderr}`));
                    }
                } else {
                    console.log(chalk.yellow(`❌ ${packageName} was not updated.`));
                    skippedCount++;
                }
            }
            console.log(chalk.cyan("\n--- Selective Update Summary ---"));
            console.log(chalk.cyan(`Packages updated: ${updatedCount}`));
            console.log(chalk.yellow(`Packages skipped: ${skippedCount}`));
            console.log(chalk.cyan("--------------------------------"));
        } else {
            console.log(chalk.yellow("⚠️ Invalid option. No packages were updated."));
        }
    } catch (error) {
        console.error(chalk.red(`\n💥 An unexpected error occurred: ${error.message}`));
        if (error.stdout) console.error(chalk.red(`  Output: ${error.stdout}`));
        if (error.stderr) console.error(chalk.red(`  Error: ${error.stderr}`));
        console.error(chalk.yellow("Please check the error details above and ensure your environment is set up correctly."));
    } finally {
        rl.close();
    }
};