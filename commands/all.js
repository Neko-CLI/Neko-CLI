import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs";
import { exec } from "child_process";

const installAllPackages = async () => {
  const nekoRockPath = path.resolve(process.cwd(), "deps.neko");

  if (!fs.existsSync(nekoRockPath)) {
    console.log(chalk.cyan("Creating deps.neko file..."));
    const nekoRockData = `
🐾 neko-cli package lock 🐾

dependencies:
`;
    fs.writeFileSync(nekoRockPath, nekoRockData, "utf-8");
    console.log(chalk.cyan("deps.neko file created successfully."));
  }

  const packagesToInstall = [];

  if (fs.existsSync(nekoRockPath)) {
    console.log(chalk.cyan("Found deps.neko, checking for dependencies..."));

    const nekoData = fs.readFileSync(nekoRockPath, "utf-8");
    const packageRegex = /🐱 (.*?)\s*:\s*[\s\S]*?🔖 version:\s*"([^"]+)"/g;
    let match;

    while ((match = packageRegex.exec(nekoData)) !== null) {
      const packageName = match[1];
      const packageVersion = match[2];
      packagesToInstall.push(`${packageName}@${packageVersion}`);
    }

    if (packagesToInstall.length === 0) {
      console.log(chalk.cyan("No dependencies found in deps.neko, checking package.json..."));

      const packageJsonPath = path.resolve(process.cwd(), "package.json");
      if (fs.existsSync(packageJsonPath)) {
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
      } else {
        console.log(chalk.yellow("No package.json found."));
      }
    }
  }

  if (packagesToInstall.length > 0) {
    const spinner = ora("Installing dependencies...").start();
    exec(
      `npm install ${packagesToInstall.join(" ")} --silent`,
      (err, stdout, stderr) => {
        spinner.stop();
        if (err) {
          console.error(chalk.red(`❌ Error installing dependencies from deps.neko/package.json: ${err.message}`));
          if (stderr) console.error(chalk.red(`   ${stderr}`));
        } else {
          console.log(chalk.cyan("Dependencies installed successfully."));
        }
      }
    );
  } else {
    const hasPnpmLock = fs.existsSync("pnpm-lock.yaml");
    const hasPackageJson = fs.existsSync("package.json");
    const hasYarnLock = fs.existsSync("yarn.lock");

    if (hasPnpmLock) {
      console.log(chalk.cyan("Found pnpm-lock.yaml, running install for all dependencies..."));
      const spinner = ora("Installing all dependencies...").start();
      exec("pnpm install --silent", (err, stdout, stderr) => {
        spinner.stop();
        if (err) {
          console.error(chalk.red(`❌ Error installing with pnpm: ${err.message}`));
          if (stderr) console.error(chalk.red(`   ${stderr}`));
        } else {
          console.log(chalk.cyan("All dependencies installed successfully."));
        }
      });
    } else if (hasPackageJson) {
      console.log(chalk.cyan("Found package.json, running install for all dependencies..."));
      const spinner = ora("Installing all dependencies...").start();
      exec("npm install --silent", (err, stdout, stderr) => {
        spinner.stop();
        if (err) {
          console.error(chalk.red(`❌ Error installing with npm: ${err.message}`));
          if (stderr) console.error(chalk.red(`   ${stderr}`));
        } else {
          console.log(chalk.cyan("All dependencies installed successfully."));
        }
      });
    } else if (hasYarnLock) {
      console.log(chalk.cyan("Found yarn.lock, running install for all dependencies..."));
      const spinner = ora("Installing all dependencies...").start();
      exec("yarn install --silent", (err, stdout, stderr) => {
        spinner.stop();
        if (err) {
          console.error(chalk.red(`❌ Error installing with yarn: ${err.message}`));
          if (stderr) console.error(chalk.red(`   ${stderr}`));
        } else {
          console.log(chalk.cyan("All dependencies installed successfully."));
        }
      });
    } else {
      console.log(chalk.yellow("Error: No package.json, yarn.lock, pnpm-lock.yaml, or deps.neko found."));
    }
  }
};

export const handleAllCommand = async () => {
  await installAllPackages();
};