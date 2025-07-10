import chalk from "chalk";
import os from "os";
import util from "util";
const execPromise = util.promisify(exec);
import { exec } from "child_process";

export const handleBinCommand = async () => {
  try {
    const binaries = ["node", "npm", "yarn"];
    const platform = os.platform();
    const command = platform === "win32" ? "where" : "which";

    console.log(chalk.cyan(`Platform: ${platform}`));

    for (const binaryName of binaries) {
      try {
        const { stdout, stderr } = await execPromise(
          `${command} ${binaryName}`
        );

        if (stderr) {
          continue;
        }

        if (stdout) {
          console.log(
            chalk.cyan(`✔️ Found binary: ${binaryName} at ${stdout.trim()}`)
          );
          return stdout.trim();
        }
      } catch (error) {
        console.warn(
          chalk.yellow(`⚠️ Error checking ${binaryName}: ${error.message}`)
        );
        continue;
      }
    }

    console.error(chalk.yellow("❌ None of the binaries were found."));
    return null;
  } catch (error) {
    console.error(
      chalk.yellow(`❌ Error during binary check: ${error.message}`)
    );
    return null;
  }
};