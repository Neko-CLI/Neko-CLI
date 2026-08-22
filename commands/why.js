import chalk from "chalk";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

export const handleWhyCommand = async (pkgName) => {
  if (!pkgName) {
    console.log(chalk.yellow("⚠️ Usage: meow why <package>"));
    return;
  }

  console.log(chalk.cyan(`🔎 Checking why "${pkgName}" is installed...\n`));

  try {
    const { stdout } = await execAsync(`npm why ${pkgName}`);
    console.log(chalk.white(stdout));
  } catch (error) {
    if (error.stdout) {
      console.log(chalk.white(error.stdout));
    } else {
      console.log(chalk.yellow(`❌ Could not determine why "${pkgName}" is installed.`));
      console.log(chalk.gray(`   (${error.message})`));
    }
  }
};
