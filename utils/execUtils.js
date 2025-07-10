import { exec } from "child_process";
import { promisify } from "util";

export const execAsync = promisify(exec);

export const checkIfPackageIsInstalled = async (packageName, isGlobal) => {
  try {
    const command = isGlobal ? `npm list -g ${packageName}` : `npm list ${packageName}`;
    const { stdout } = await execAsync(command, { silent: true });
    return stdout.includes(packageName);
  } catch (error) {
    return false;
  }
};