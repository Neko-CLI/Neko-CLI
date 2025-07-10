import chalk from "chalk";
import path from "path";
import fs from "fs";

export const handleLicensesCommand = async () => {
  const yarnLockPath = "./yarn.lock";
  const packageLockPath = "./package.json";
  const nodeModulesPath = "./node_modules";

  let dependencies = [];
  let devDependencies = [];
  let optionalDependencies = [];

  if (fs.existsSync(yarnLockPath)) {
    console.log(chalk.cyan("🔍 Parsing yarn.lock for licenses..."));

    const yarnLockContent = await fs.promises.readFile(yarnLockPath, "utf8");
    const parsedLockfile = yarnLockfile.parse(yarnLockContent);

    for (const [depName, depData] of Object.entries(parsedLockfile.object)) {
      const depVersion = depData.version;
      const depPath = path.join(nodeModulesPath, depName, "package.json");

      if (fs.existsSync(depPath)) {
        try {
          const depPkg = await fs.promises.readFile(depPath, "utf8");
          const depPkgJson = JSON.parse(depPkg);
          let license = depPkgJson.license || "No license found";

          if (typeof license === "object" && license.type) {
            license = license.type;
          }

          dependencies.push({
            name: depName,
            version: depVersion,
            license: license,
          });
        } catch (error) {
          console.error(
            chalk.yellow(`⚠️ Failed to read ${depName}: ${error.message}`)
          );
        }
      }
    }
  }

  if (fs.existsSync(packageLockPath)) {
    console.log(chalk.cyan("🔍 Parsing package-lock.json for licenses..."));

    const packageLockContent = await fs.promises.readFile(
      packageLockPath,
      "utf8"
    );
    const packageLockJson = JSON.parse(packageLockContent);

    const addDependencies = async (deps, type) => {
      for (const depName in deps) {
        const depData = deps[depName];
        const depVersion = depData.version;
        const depPath = path.join(nodeModulesPath, depName, "package.json");

        if (fs.existsSync(depPath)) {
          try {
            const depPkg = await fs.promises.readFile(depPath, "utf8");
            const depPkgJson = JSON.parse(depPkg);
            let license = depPkgJson.license || "No license found";

            if (typeof license === "object" && license.type) {
              license = license.type;
            }

            if (type === "dependencies") {
              dependencies.push({
                name: depName,
                version: depVersion,
                license,
              });
            } else if (type === "devDependencies") {
              devDependencies.push({
                name: depName,
                version: depVersion,
                license,
              });
            } else if (type === "optionalDependencies") {
              optionalDependencies.push({
                name: depName,
                version: depVersion,
                license,
              });
            }
          } catch (error) {
            console.error(
              chalk.yellow(`⚠️ Failed to read ${depName}: ${error.message}`)
            );
          }
        }
      }
    };

    await addDependencies(packageLockJson.dependencies, "dependencies");
    await addDependencies(packageLockJson.devDependencies, "devDependencies");
    await addDependencies(
      packageLockJson.optionalDependencies,
      "optionalDependencies"
    );
  }

  if (dependencies.length > 0) {
    console.log(
      chalk.cyan("✔️ Found licenses for the following dependencies:")
    );
    dependencies.forEach((pkg) => {
      console.log(
        chalk.cyan(`- ${pkg.name}: ${pkg.license} (v${pkg.version})`)
      );
    });
  } else {
    console.log(chalk.yellow("⚠️ No licenses found for dependencies."));
  }

  if (devDependencies.length > 0) {
    console.log(
      chalk.cyan("✔️ Found licenses for the following devDependencies:")
    );
    devDependencies.forEach((pkg) => {
      console.log(
        chalk.cyan(`- ${pkg.name}: ${pkg.license} (v${pkg.version})`)
      );
    });
  } else {
    console.log(chalk.yellow("⚠️ No licenses found for devDependencies."));
  }

  if (optionalDependencies.length > 0) {
    console.log(
      chalk.cyan("✔️ Found licenses for the following optionalDependencies:")
    );
    optionalDependencies.forEach((pkg) => {
      console.log(
        chalk.cyan(`- ${pkg.name}: ${pkg.license} (v${pkg.version})`)
      );
    });
  } else {
    console.log(chalk.yellow("⚠️ No licenses found for optionalDependencies."));
  }
};