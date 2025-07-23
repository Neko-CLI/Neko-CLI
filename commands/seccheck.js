import chalk from "chalk";
import fsExtra from "fs-extra";
import { exec } from "child_process";

export const handleSeccheckCommand = async () => {
  console.log(chalk.cyan("🔍 Starting security check..."));

  if (!fsExtra.existsSync("./package.json")) {
    console.error(
      chalk.yellow(
        "❌ Error: No package.json found. Ensure the project has dependencies."
      )
    );
    process.exit(1);
  }

  exec("retire --version", (error) => {
    if (error) {
      console.log(chalk.blue("ℹ️  'retire' command not found. Installing globally..."));
      exec("npm install -g retire --silent", (installError, installStdout, installStderr) => {
        if (installError) {
          console.error(chalk.red(installStderr || installError.message));
          process.exit(1);
        }
        runRetireCheck();
      });
    } else {
      runRetireCheck();
    }
  });

  const runRetireCheck = () => {
    exec("retire --path .", (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.yellow("❌ Error during security analysis:"));
        console.error(chalk.yellow(stderr || error.message));
        process.exit(1);
      }

      if (stdout.includes("Vulnerable modules found")) {
        console.log(chalk.yellow("❌ Vulnerabilities found in your project!"));
        console.log(chalk.yellow(stdout));
      } else {
        console.log(chalk.cyan("🎉 No vulnerabilities found."));
      }
    });
  };
};