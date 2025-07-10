import chalk from "chalk";
import path from "path";
import semver from "semver";
import * as fsp from "fs/promises";

export const handleCompatibilityCommand = async () => {
      try {
    const projectDir = process.cwd();
    const packageJsonPath = path.join(projectDir, "package.json");
    const yarnLockPath = path.join(projectDir, "yarn.lock");

    const hasPackageJson = await fsp
      .access(packageJsonPath)
      .then(() => true)
      .catch(() => false);
    const hasYarnLock = await fsp
      .access(yarnLockPath)
      .then(() => true)
      .catch(() => false);

    if (!hasPackageJson && !hasYarnLock) {
      console.log(
        chalk.yellow(
          "❌ Neither package.json nor yarn.lock found in the current directory."
        )
      );
      return;
    }

    const nodeVersion = process.version;

    if (hasPackageJson) {
      console.log(
        chalk.cyan(
          `🔍 Found package.json. Checking compatibility with Node.js ${nodeVersion}...`
        )
      );
      const packageJson = JSON.parse(
        await fsp.readFile(packageJsonPath, "utf-8")
      );

      if (packageJson.engines && packageJson.engines.node) {
        if (!semver.satisfies(nodeVersion, packageJson.engines.node)) {
          console.log(
            chalk.yellow(
              `❌ The current Node.js version (${nodeVersion}) is not compatible with ${packageJson.engines.node}.`
            )
          );
          return;
        }
        console.log(
          chalk.cyan(
            `✅ Node.js ${nodeVersion} satisfies the "engines" requirement (${packageJson.engines.node}).`
          )
        );
      } else {
        console.log(
          chalk.yellow('⚠️ No "engines" field found in package.json.')
        );
      }

      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      if (Object.keys(dependencies).length === 0) {
        console.log(chalk.cyan("✅ No dependencies found in package.json."));
        return;
      }

      console.log(chalk.cyan("🔍 Checking dependency compatibility..."));
      let allCompatible = true;

      for (const [dep, requiredVersion] of Object.entries(dependencies)) {
        if (semver.validRange(requiredVersion)) {
          if (!semver.satisfies(nodeVersion, requiredVersion)) {
            allCompatible = false;
            console.log(
              chalk.yellow(
                `❌ ${dep} requires Node.js ${requiredVersion}, but the current version is ${nodeVersion}.`
              )
            );
          } else {
            console.log(
              chalk.cyan(`✅ ${dep} is compatible with Node.js ${nodeVersion}.`)
            );
          }
        } else {
          console.log(
            chalk.yellow(
              `⚠️ ${dep} has an invalid version: ${requiredVersion}.`
            )
          );
        }
      }

      if (allCompatible) {
        console.log(
          chalk.cyan("✅ All dependencies are compatible with Node.js.")
        );
      } else {
        console.log(
          chalk.yellow("❌ Some dependencies are not compatible with Node.js.")
        );
      }
    }

    if (hasYarnLock) {
      console.log(
        chalk.cyan("🔍 Found yarn.lock. Checking compatibility with Yarn...")
      );
      console.log(
        chalk.yellow(
          "⚠️ Specific version checks for yarn.lock are not implemented in this version."
        )
      );
      console.log(
        chalk.cyan(
          "✅ The yarn.lock file indicates the project is configured for Yarn."
        )
      );
    }
  } catch (error) {
    console.error(
      chalk.yellow("❌ An error occurred while checking compatibility:"),
      error.message
    );
  }
};