import chalk from "chalk";
import fsExtra from "fs-extra";
import { exec } from "child_process";

const { readJson } = fsExtra;


function detectPackageManager() {
  return fsExtra.existsSync("./yarn.lock") ? "yarn" : "npm";
}

export const handleListCommand = async () => {
  const packagePath = "./package.json";

  if (!fsExtra.existsSync(packagePath)) {
    console.error(
      chalk.yellow("❌ Error: package.json not found in the current directory.")
    );
    process.exit(1);
  }

  try {
    const packageData = await readJson(packagePath);
    const projectName = packageData.name || "Unknown Project";
    const version = packageData.version || "Unknown Version";
    const author = packageData.author || "Unknown Author";

    console.log(
      chalk.cyan(`
    ===========================
    📦 ${chalk.cyan("Installed Dependencies")} 📦
    ===========================

    🚀 ${chalk.white("Project Name:")} ${chalk.cyan(projectName)}
    📦 ${chalk.white("Project Version:")} ${chalk.cyan(version)}
    👤 ${chalk.white("Author:")} ${chalk.cyan(author)}

    🔍 ${chalk.white("Listing Installed Dependencies:")} 🧩
    ===========================
        `)
    );

    const packageManager = detectPackageManager();
    const command =
      packageManager === "yarn"
        ? "yarn list --depth=0 --silent"
        : "npm list --depth=0 --silent";

    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(
          chalk.yellow(`❌ Error while listing dependencies: ${stderr}`)
        );
        process.exit(1);
      }
      if (stdout) {
        console.log(chalk.cyan(stdout));
      } else {
        console.log(chalk.yellow("No dependencies installed."));
      }
    });
  } catch (error) {
    console.error(chalk.yellow(`❌ Error: ${error.message}`));
  }
};