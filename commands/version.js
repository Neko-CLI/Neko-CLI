import chalk from "chalk";

async function getPackageVersion() {
  try {
    const response = await fetch("https://registry.npmjs.org/neko-cli");
    const data = await response.json();
    return data["dist-tags"].latest;
  } catch (err) {
    console.error(
      chalk.yellow("Error fetching version from meow registry:", err)
    );
    return "unknown";
  }
}

export const handleVersionCommand = async () => {
  try {
    const version = await getPackageVersion();
    console.log(chalk.cyan("Current CLI version: " + version));
    console.log(chalk.cyan("Author: Thomas Garau"));
    console.log(chalk.cyan("Official website: https://neko-cli.com"));
    console.log(chalk.cyan("My GitHub: https://github.com/StrayVibes"));
  } catch (error) {
    console.error(
      chalk.red(`❌ Could not determine NekoCLI version: ${error.message}`)
    );
    console.log(
      chalk.yellow("Ensure 'package.json' exists in the CLI's root directory.")
    );
  }
};
