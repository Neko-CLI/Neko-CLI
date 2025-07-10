import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import https from "https";
import { exec} from "child_process";

function calculateIntegrity(tarballUrl) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha512");
    https
      .get(tarballUrl, (response) => {
        response.on("data", (chunk) => hash.update(chunk));
        response.on("end", () => resolve(`sha512-${hash.digest("base64")}`));
        response.on("error", reject);
      })
      .on("error", reject);
  });
}

async function updateNekoRockWithIntegrity(nekoRockPath, packagesToInstall) {

  const resolvedPackages = await Promise.all(packagesToInstall.map((pkg) => {
    const [name, version] = pkg.split('@');
    const resolvedUrl = `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`;
    return calculateIntegrity(resolvedUrl)
      .then((integrity) => {
        return `🐱 ${name}:
  🔖 version: "${version}"
  📦 resolved: "${resolvedUrl}"
  🔒 integrity: "${integrity}"
  ⚙️ type: runtime
`;
      });
  }));

  const updatedNekoRockData = `
🐾 neko-cli package lock 🐾

dependencies:
${resolvedPackages.join("\n")}
`;

  fs.writeFileSync(nekoRockPath, updatedNekoRockData, "utf-8");
  console.log(chalk.cyan("Updated deps.neko with dependencies and integrity."));
}

export const handleInstallCommand = async () => {
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

  if (fs.existsSync(nekoRockPath)) {
    console.log(chalk.cyan("Found deps.neko, installing dependencies..."));

    const nekoData = fs.readFileSync(nekoRockPath, "utf-8");

    const packageRegex = /🐱 (.*?)\s*:\s*[\s\S]*?🔖 version:\s*"([^"]+)"/g;
    let match;

    const packagesToInstall = [];
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
          await updateNekoRockWithIntegrity(nekoRockPath, packagesToInstall);
          console.log(chalk.cyan("Updated deps.neko with dependencies from package.json."));
        }
      } else {
        console.log(chalk.yellow("No package.json found."));
      }
    }

    if (packagesToInstall.length > 0) {

      const spinner = ora("Installing dependencies...").start();
      exec(
        `npm install ${packagesToInstall.join(" ")} --silent`,
        (err) => {
          spinner.stop();
          if (err) {} else {
            console.log(chalk.cyan("Dependencies installed successfully."));
          }
        }
      );
    } else {
      console.log(chalk.yellow("No dependencies found to install."));
    }
  }

  const hasPnpmLock = fs.existsSync("pnpm-lock.yaml");
  const hasPackageJson = fs.existsSync("package.json");
  const hasYarnLock = fs.existsSync("yarn.lock");

  if (hasPnpmLock) {
    console.log(chalk.cyan("Found pnpm-lock.yaml, running install for all dependencies..."));
    const spinner = ora("Installing all dependencies...").start();
    exec("pnpm install --silent", (err) => {
      spinner.stop();
      if (err) {} else {
        console.log(chalk.cyan("All dependencies installed successfully."));
      }
    });
  } else if (hasPackageJson) {
    console.log(chalk.cyan("Found package.json, running install for all dependencies..."));
    const spinner = ora("Installing all dependencies...").start();
    exec("npm install --silent", (err) => {
      spinner.stop();
      if (err) {
      } else {
        console.log(chalk.cyan("All dependencies installed successfully."));
      }
    });
  } else if (hasYarnLock) {
    console.log(chalk.cyan("Found yarn.lock, running install for all dependencies..."));
    const spinner = ora("Installing all dependencies...").start();
    exec("yarn install --silent", (err) => {
      spinner.stop();
      if (err) {} else {
        console.log(chalk.cyan("All dependencies installed successfully."));
      }
    });
  } else {
    console.log(chalk.yellow("Error: No package.json, yarn.lock, pnpm-lock.yaml, or deps.neko found."));
  }
};