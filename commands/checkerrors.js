import chalk from "chalk";
import path from "path";
import { exec } from "child_process";
import fs from "fs";

async function installJshint() {
  return new Promise((resolve, reject) => {
    exec("npm list -g jshint", (err, stdout, stderr) => {
      if (err || stderr) {
        console.log(chalk.cyan("⚙️ Installing deps..."));

        exec(
          "npm install jshint -g --silent",
          (installErr, installStdout, installStderr) => {
            if (installErr || installStderr) {
              reject("❌ Failed to install Deps. Please check your npm setup.");
            } else {
              console.log(chalk.cyan("✅ Deps installed successfully."));
              resolve();
            }
          }
        );
      } else {
        console.log(chalk.cyan("✅ Deps is already installed."));
        resolve();
      }
    });
  });
}

export const handleCheckerrorsCommand = async () => {
    const jshintConfigPath = path.join(process.cwd(), ".jshintrc");
  const jshintIgnorePath = path.join(process.cwd(), ".jshintignore");

  try {
    await installJshint();
  } catch (error) {
    console.error(chalk.red(error));
    return;
  }

  if (!fs.existsSync(jshintConfigPath)) {
    console.log(
      chalk.cyan(
        "⚙️ .jshintrc not found, creating a basic configuration file..."
      )
    );

    const defaultConfig = {
      esversion: 6,
      node: true,
      browser: true,
      strict: false,
      unused: true,
    };

    try {
      fs.writeFileSync(
        jshintConfigPath,
        JSON.stringify(defaultConfig, null, 2)
      );
      console.log(
        chalk.cyan("✅ .jshintrc created with default configuration")
      );
    } catch (error) {
      console.error(
        chalk.red("❌ Error occurred while creating the .jshintrc file:"),
        error
      );
      return;
    }
  }

  if (!fs.existsSync(jshintIgnorePath)) {
    console.log(
      chalk.cyan(
        "⚙️ .jshintignore not found, creating one to exclude node_modules..."
      )
    );
    try {
      fs.writeFileSync(jshintIgnorePath, "node_modules/\n");
      console.log(
        chalk.cyan("✅ .jshintignore created with exclusion for node_modules")
      );
    } catch (error) {
      console.error(
        chalk.red("❌ Error occurred while creating the .jshintignore file:"),
        error
      );
      return;
    }
  }

  console.log(chalk.cyan("🔍 Scanning project for code errors...\n"));

  try {
    const output = await new Promise((resolve, reject) => {
      exec("npx jshint .", (err, stdout, stderr) => {
        if (err) {
          console.error(chalk.red("❌ stdout: "), stdout);
          reject(stderr || err);
        } else {
          resolve(stdout);
        }
      });
    });

    if (output) {
      console.log(chalk.red("❌ Errors found:\n"));
      console.log(output);
    } else {
      console.log(chalk.cyan("✅ No errors found in the project!"));
    }
  } catch (error) {
    return;
  }
};