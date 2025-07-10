import chalk from "chalk";
import fsExtra from "fs-extra";
import chalkAnimation from "chalk-animation";
import semver from "semver";

export const handleAuditCommand = async () => {
    const packagePath = "./package.json";
  const yarnLockPath = "./yarn.lock";

  if (!fsExtra.existsSync(packagePath) && !fsExtra.existsSync(yarnLockPath)) {
    console.error(
      chalk.yellow(
        "❌ Error: No package.json or yarn.lock file found in the current directory."
      )
    );
    process.exit(1);
  }

  const dependencies = {};
  const devDependencies = {};
  let source = "";

  if (fsExtra.existsSync(packagePath)) {
    source = "(package.json)";
    const packageData = await fsExtra.readJson(packagePath);
    Object.assign(dependencies, packageData.dependencies || {});
    Object.assign(devDependencies, packageData.devDependencies || {});
  } else if (fsExtra.existsSync(yarnLockPath)) {
    source = "(yarn.lock)";
    console.log(chalk.cyan("🔍 Analyzing dependencies from yarn.lock..."));
    const yarnLock = fsExtra.readFileSync(yarnLockPath, "utf-8");
    const matches = yarnLock.match(/^(.*?)@.*?:\s*version\s*"(.*?)"/gm);
    if (matches) {
      matches.forEach((line) => {
        const [name, version] = line
          .match(/^(.*?)@.*?: version "(.*?)"/)
          .slice(1);
        dependencies[name] = version;
      });
    }
  }

  const allDependencies = { ...dependencies, ...devDependencies };
  const results = [];

  const animation = chalkAnimation.rainbow(
    "🔍 Analyzing dependencies... Please wait..."
  );
  setTimeout(() => animation.stop(), 2000);

  console.log(`\n🔍 Analyzing dependencies from ${chalk.cyan(source)}...\n`);

  for (const [dep, installedVersion] of Object.entries(allDependencies)) {
    try {
      const response = await fetch(`https://registry.npmjs.org/${dep}`);
      const data = await response.json();
      const latestVersion = data["dist-tags"].latest;

      if (!semver.satisfies(installedVersion, latestVersion)) {
        results.push({
          name: dep,
          installed: installedVersion,
          latest: latestVersion,
          isOutdated: true,
        });
      }
    } catch (error) {
      console.error(
        chalk.yellow(`❌ Unable to check dependency ${dep}: ${error.message}`)
      );
    }
  }

  if (results.length > 0) {
    console.log(chalk.cyan("📋 Outdated Dependencies Report:"));
    results.forEach(({ name, installed, latest }) => {
      console.log(
        `- ${chalk.yellow(name)}: installed ${chalk.yellow(
          installed
        )}, latest ${chalk.cyan(latest)} (update recommended)`
      );
    });
  } else {
    console.log(chalk.cyan("🎉 All dependencies are up to date!"));
  }
};