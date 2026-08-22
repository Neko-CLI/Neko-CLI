import chalk from "chalk";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import ora from "ora";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

function readDepsNeko() {
  const nekoRockPath = path.join(process.cwd(), "deps.neko");
  if (!fs.existsSync(nekoRockPath)) return null;
  const fileContent = fs.readFileSync(nekoRockPath, "utf8");
  const yamlContent = fileContent.replace(
    /# Neko-CLI package lock file\n# This file tracks installed package versions and integrity.\n/,
    ""
  );
  return yaml.load(yamlContent) || {};
}

export const handleCiCommand = async () => {
  const pkgPath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(pkgPath)) {
    console.log(chalk.yellow("❌ No package.json found in the current directory."));
    process.exit(1);
  }

  const lock = readDepsNeko();
  if (!lock) {
    console.log(chalk.red("❌ No deps.neko lock file found."));
    console.log(chalk.gray("   `meow ci` requires a committed deps.neko lock file for reproducible installs."));
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const declared = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const locked = { ...(lock.dependencies || {}), ...(lock.devDependencies || {}) };

  const problems = [];
  for (const name of Object.keys(declared)) {
    if (!locked[name]) {
      problems.push(`  - ${chalk.yellow(name)} is in package.json but missing from deps.neko`);
    }
  }

  if (problems.length > 0) {
    console.log(chalk.red("❌ package.json and deps.neko are out of sync:\n"));
    console.log(problems.join("\n"));
    console.log(chalk.gray("\n   Run `meow meow` locally to update deps.neko, then commit it."));
    process.exit(1);
  }

  console.log(chalk.cyan("🔒 deps.neko matches package.json. Installing exact versions...\n"));

  const spinner = ora(chalk.cyan("Installing...")).start();
  try {
    if (fs.existsSync(path.join(process.cwd(), "package-lock.json"))) {
      await execAsync("npm ci");
    } else {
      await execAsync("npm install --no-save");
    }
    spinner.succeed(chalk.green("✅ Clean, reproducible install complete."));
  } catch (error) {
    spinner.fail(chalk.red("❌ Install failed."));
    console.error(chalk.red(error.stderr || error.message));
    process.exit(1);
  }
};
