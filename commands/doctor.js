import chalk from "chalk";
import fsExtra from "fs-extra";
import os from "os";
import { exec } from "child_process";
import axios from "axios";

export const handleDoctorCommand = async () => {
    console.log(chalk.cyan("🩺 Running Doctor Check for neko-cli..."));

  try {
    let hasIssues = false;

    const packagePath = "./package.json";
    if (!fsExtra.existsSync(packagePath)) {
      console.error(
        chalk.yellow(
          "❌ Missing package.json! Please ensure your project has a package.json."
        )
      );
      hasIssues = true;
    } else {
      console.log(chalk.cyan("✔️ package.json found."));
    }

    const yarnLockPath = "./yarn.lock";
    const packageLockPath = "./package-lock.json";
    if (
      !fsExtra.existsSync(yarnLockPath) &&
      !fsExtra.existsSync(packageLockPath)
    ) {
      console.warn(
        chalk.yellow(
          "⚠️ No lock file found. Install dependencies to ensure consistency."
        )
      );
      hasIssues = true;
    } else {
      console.log(chalk.cyan("✔️ Lock file found."));
    }

    const nodeModulesPath = "./node_modules";
    if (!fsExtra.existsSync(nodeModulesPath)) {
      console.warn(
        chalk.yellow(
          "⚠️ node_modules is missing. Run `npm install` or `yarn install` to install dependencies."
        )
      );
      hasIssues = true;
    } else {
      console.log(chalk.cyan("✔️ node_modules folder exists."));
    }

    exec("npm list -g neko-cli", (err, stdout, stderr) => {
      if (err) {
        console.warn(chalk.yellow("⚠️ neko-cli is not installed globally."));
        hasIssues = true;
      } else {
        console.log(chalk.cyan("✔️ neko-cli is installed globally."));
      }
    });

    exec("npm outdated", (err, stdout, stderr) => {
      if (err) {
        console.error(
          chalk.yellow("❌ Error while checking for outdated dependencies.")
        );
        hasIssues = true;
      }
      if (stdout) {
        console.log(chalk.cyan("📦 Outdated dependencies:"));
        console.log(stdout);
      } else {
        console.log(chalk.cyan("✔️ No outdated dependencies."));
      }
    });

    const platform = os.platform();

    if (platform === "win32") {
      exec("dir C:\\", (err, stdout, stderr) => {
        if (err || stderr) {
          console.error(
            chalk.yellow(
              "❌ Permission issues detected on Windows! Please check your system permissions."
            )
          );
          hasIssues = true;
        } else {
          console.log(
            chalk.cyan("✔️ Permissions are correctly set (Windows).")
          );
        }
      });
    } else if (platform === "linux" || platform === "darwin") {
      exec("ls /usr/bin", (err, stdout, stderr) => {
        if (err || stderr) {
          console.error(
            chalk.yellow(
              "❌ Permission issues detected on Linux/macOS! Please check your system permissions."
            )
          );
          hasIssues = true;
        } else {
          console.log(
            chalk.cyan("✔️ Permissions are correctly set (Linux/macOS).")
          );
        }
      });
    }

    try {
      const response = await axios.get(
        "https://api.github.com/repos/Neko-CLI/Neko-CLI/issues"
      );
      const openIssues = response.data;

      if (openIssues.length > 0) {
        console.log(chalk.cyan("🔧 Open issues on GitHub:"));
        openIssues.forEach((issue) => {
          console.log(chalk.yellow(`- ${issue.title}: ${issue.html_url}`));
        });
        hasIssues = true;
      } else {
        console.log(chalk.cyan("✔️ No open issues found on GitHub."));
      }
    } catch (error) {
      console.error(
        chalk.yellow(`❌ Error fetching GitHub issues: ${error.message}`)
      );
      hasIssues = true;
    }

    if (hasIssues) {
      console.log(chalk.yellow("🛑 Doctor check completed with issues."));
    } else {
      console.log(
        chalk.cyan(
          "✔️ Doctor check completed successfully! No issues detected."
        )
      );
    }
  } catch (error) {
    console.error(
      chalk.yellow(`❌ Error during doctor check: ${error.message}`)
    );
  }
};