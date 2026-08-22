import chalk from "chalk";
import path from "path";
import fs from "fs";
import { globSync } from "glob";

export const handleCleanCommand = async () => {
  try {
    const projectDir = process.cwd();
    const directoriesToDelete = [path.join(projectDir, ".tmp")];

    const filesToDelete = [
      path.join(projectDir, "*.log"),
      path.join(projectDir, "*.bak"),
      path.join(projectDir, "*.swp"),
    ];

    directoriesToDelete.forEach((dir) => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(chalk.yellow(`🗑️ Deleted directory: ${dir}`));
      }
    });

    filesToDelete.forEach((filePattern) => {
      globSync(filePattern).forEach((file) => {
        fs.unlinkSync(file);
        console.log(chalk.yellow(`🗑️ Deleted file: ${file}`));
      });
    });

    console.log(chalk.cyan("✅ Project cleanup completed successfully."));
  } catch (error) {
    console.error(
      chalk.yellow("❌ An error occurred while cleaning the project:"),
      error
    );
  }
};