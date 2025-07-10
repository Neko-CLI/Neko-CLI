import chalk from "chalk";
import { execAsync } from "../utils/execUtils.js";
import readline from "readline";

export const handleUpdateCommand = async () => {
  try {
    const { stdout: currentVersionOutput } = await execAsync(
      "npm list -g neko-cli --depth=0"
    );
    const installedVersionMatch = currentVersionOutput.match(/neko-cli@([^\s]+)/);
    const installedVersion = installedVersionMatch ? installedVersionMatch[1] : null;

    if (!installedVersion) {
      console.log(chalk.yellow("❌ neko-cli is not installed globally."));
      return;
    }

    console.log(chalk.cyan(`Current installed version: ${installedVersion}`));

    const { stdout: latestVersionOutput } = await execAsync(
      "npm show neko-cli version"
    );
    const cleanLatestVersion = latestVersionOutput.trim();

    console.log(chalk.cyan(`Latest available version: ${cleanLatestVersion}`));

    if (installedVersion === cleanLatestVersion) {
      console.log(chalk.cyan("✨ Your `neko-cli` is already up to date."));
      console.log(chalk.cyan("\n--- Version Information ---"));
      console.log(chalk.cyan("For details on changes and features in this version, visit:"));
      console.log(chalk.cyan("🔗 https://github.com/Neko-CLI/Neko-CLI (official repository)"));
      console.log(chalk.cyan("---------------------------\n"));
      return;
    }

    console.log(chalk.cyan("\n--- Changelog and New Features ---"));
    console.log(chalk.cyan("A new version is available. To view the changes, visit:"));
    console.log(chalk.cyan("🔗 https://github.com/Neko-CLI/Neko-CLI (official repository)"));
    console.log(chalk.cyan("----------------------------------\n"));

    const response = await new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(
        chalk.cyan(
          "A new version is available. Do you want to update neko-cli? (y/n) > "
        ),
        (answer) => {
          rl.close();
          resolve(answer.toLowerCase());
        }
      );
    });

    if (response === "y") {
      console.log(chalk.cyan("⏳ Updating neko-cli..."));
      await execAsync("npm install -g neko-cli --silent");
      console.log(chalk.cyan("✅ `neko-cli` has been successfully updated."));
    } else {
      console.log(chalk.yellow("❌ Skipped updating `neko-cli`."));
    }
  } catch (error) {
    console.error(
      chalk.yellow("❌ Error while checking or updating neko-cli:"),
      error.message
    );
  }
};