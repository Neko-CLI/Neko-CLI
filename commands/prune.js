import chalk from "chalk";
import fsExtra from "fs-extra";
import { execAsync } from "../utils/execUtils.js";
import ora from "ora";
import path from "path";
const { existsSync } = fsExtra;
export const handlePruneCommand = async () => {
    console.log(chalk.cyan("✨ Initiating dependency declutter operation..."));
    const packagePath = path.join(process.cwd(), "package.json");
    const yarnLockPath = path.join(process.cwd(), "yarn.lock");
    const checkManifestSpinner = ora(chalk.cyan("Verifying project manifest (package.json)...")).start();
    if (!existsSync(packagePath)) {
        checkManifestSpinner.fail(chalk.red("❌ Error: Project manifest (package.json) not found. Cannot proceed."));
        return;
    }
    checkManifestSpinner.succeed(chalk.cyan("Project manifest found!"));
    let packageData;
    const loadManifestSpinner = ora(chalk.cyan("Loading project dependencies... (from package.json)")).start();
    try {
        packageData = await fsExtra.readJson(packagePath);
        loadManifestSpinner.succeed(chalk.cyan("Dependencies loaded successfully."));
    } catch (error) {
        loadManifestSpinner.fail(chalk.red(`❌ Error: Could not read package.json. ${error.message}`));
        return;
    }
    let changedManifest = false;
    console.log(chalk.cyan("\n🚀 Analyzing manifest for development and optional dependencies..."));
    const devDependencies = packageData.devDependencies || {};
    const optionalDependencies = packageData.optionalDependencies || {};
    const devSpinner = ora(chalk.yellow("Processing development dependencies...")).start();
    if (Object.keys(devDependencies).length > 0) {
        delete packageData.devDependencies;
        changedManifest = true;
        devSpinner.succeed(chalk.cyan("🔧 Development dependencies removed from manifest."));
    } else {
        devSpinner.info(chalk.cyan("✨ No development dependencies to remove from manifest."));
    }
    const optionalSpinner = ora(chalk.yellow("Processing optional dependencies...")).start();
    if (Object.keys(optionalDependencies).length > 0) {
        delete packageData.optionalDependencies;
        changedManifest = true;
        optionalSpinner.succeed(chalk.cyan("🔧 Optional dependencies removed from manifest."));
    } else {
        optionalSpinner.info(chalk.cyan("✨ No optional dependencies to remove from manifest."));
    }
    if (changedManifest) {
        const writeManifestSpinner = ora(chalk.cyan("Updating project manifest (package.json)...")).start();
        try {
            await fsExtra.writeJson(packagePath, packageData, { spaces: 2 });
            writeManifestSpinner.succeed(chalk.cyan("✔️ Project manifest updated."));
            console.log(chalk.yellow("\n⚠️ Warning: Development and optional dependencies have been removed from your package.json."));
            console.log(chalk.yellow("This means they will no longer be installed by default."));
        } catch (error) {
            writeManifestSpinner.fail(chalk.red(`❌ Error: Failed to write updated package.json. ${error.message}`));
            return;
        }
    } else {
        console.log(chalk.cyan("\n🔍 No changes required in package.json."));
    }
    const isYarn = fsExtra.existsSync(yarnLockPath);
    const packageManager = isYarn ? "yarn" : "npm";
    const pruneCommand =
        packageManager === "yarn"
            ? "yarn install --force --silent"
            : "npm prune --silent";
    console.log(chalk.cyan(`\n🧹 Performing module cleanup with ${packageManager}...`));
    const cleanupSpinner = ora(chalk.cyan(`Executing ${packageManager} cleanup command...`)).start();
    try {
        const { stdout, stderr } = await execAsync(pruneCommand);
        if (stdout || stderr) {
            cleanupSpinner.succeed(chalk.cyan("✅ Module cleanup complete! Unused packages removed."));
        } else {
            cleanupSpinner.succeed(chalk.cyan("✔️ Module cleanup complete! No unused packages found."));
        }
    } catch (error) {
        cleanupSpinner.fail(chalk.red(`💥 Module cleanup failed! ${error.message}`));
        console.error(chalk.red("\n🔍 Detailed error from package manager:"));
        if (error.stdout) console.error(chalk.red(`  Output: ${error.stdout}`));
        if (error.stderr) console.error(chalk.red(`  Error: ${error.stderr}`));
        console.error(chalk.yellow("Tip: Check the above output for reasons. Ensure your package manager is installed and functioning."));
    }
};