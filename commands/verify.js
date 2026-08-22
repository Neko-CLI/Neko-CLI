import chalk from "chalk";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

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

export const handleVerifyCommand = async () => {
  const lock = readDepsNeko();
  if (!lock) {
    console.log(chalk.yellow("❌ No deps.neko lock file found in this project."));
    console.log(chalk.gray("   Run `meow meow` or `meow add <pkg>` first."));
    process.exit(1);
  }

  const allDeps = { ...(lock.dependencies || {}), ...(lock.devDependencies || {}) };
  const names = Object.keys(allDeps);

  if (names.length === 0) {
    console.log(chalk.cyan("ℹ️ deps.neko has no tracked dependencies."));
    return;
  }

  console.log(chalk.cyan(`🔍 Verifying ${names.length} package(s) from deps.neko against node_modules...\n`));

  let ok = 0;
  let missing = 0;
  let mismatched = 0;

  for (const name of names) {
    const lockedInfo = allDeps[name];
    const lockedVersion = typeof lockedInfo === "string" ? lockedInfo : lockedInfo?.version;
    const installedPkgPath = path.join(process.cwd(), "node_modules", name, "package.json");

    if (!fs.existsSync(installedPkgPath)) {
      console.log(`  ${chalk.red("✗")} ${name} — ${chalk.red("not installed")} (expected ${lockedVersion || "unknown"})`);
      missing++;
      continue;
    }

    try {
      const installedPkg = JSON.parse(fs.readFileSync(installedPkgPath, "utf8"));
      if (lockedVersion && installedPkg.version !== lockedVersion) {
        console.log(`  ${chalk.yellow("!")} ${name} — locked ${chalk.yellow(lockedVersion)}, installed ${chalk.yellow(installedPkg.version)}`);
        mismatched++;
      } else {
        console.log(`  ${chalk.green("✓")} ${name}@${installedPkg.version}`);
        ok++;
      }
    } catch {
      console.log(`  ${chalk.red("✗")} ${name} — ${chalk.red("could not read installed package.json")}`);
      missing++;
    }
  }

  console.log(chalk.cyan(`\n📋 Summary: ${chalk.green(`${ok} ok`)}, ${chalk.yellow(`${mismatched} mismatched`)}, ${chalk.red(`${missing} missing`)}`));

  if (missing > 0 || mismatched > 0) {
    console.log(chalk.yellow("\n⚠️ deps.neko is out of sync with node_modules. Run `meow meow` to reinstall."));
    process.exit(1);
  } else {
    console.log(chalk.green("\n✅ deps.neko matches node_modules exactly."));
  }
};
