import chalk from "chalk";
import archiver from "archiver";
import path from "path"
import fs from "fs";
import readline from "readline";
import fsExtra from "fs-extra";
const { existsSync, readdirSync } = fsExtra;

export const handleBackupCommand = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (query) => {
    return new Promise((resolve) => rl.question(query, resolve));
  };

  try {
    const projectDir = process.cwd();

    const outputPath = path.join(projectDir, "meow-project-backup.zip");
    const ignoredFolders = ["node_modules", ".git", "temp", "build"];

    if (existsSync(outputPath)) {
      const overwrite = await askQuestion(
        chalk.cyan(
          `⚠️ A backup already exists at ${outputPath}. Overwrite? (y/n) > `
        )
      );

      if (overwrite.toLowerCase() !== "y") {
        console.log(chalk.cyan("❌ Backup process aborted."));
        rl.close();
        return;
      }
    }

    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    archive.on("error", (err) => {
      console.error(chalk.yellow("❌ Error during backup: "), err);
      rl.close();
    });

    output.on("close", () => {
      console.log(
        chalk.cyan(`✅ Backup completed! ${archive.pointer()} total bytes.`)
      );
      rl.close();
    });

    archive.pipe(output);

    console.log(chalk.cyan("📦 Starting the backup process..."));

    const files = readdirSync(projectDir);

    files.forEach((file) => {
      const filePath = path.join(projectDir, file);
      const isDirectory = fs.statSync(filePath).isDirectory();
      if (!ignoredFolders.includes(file) && !isDirectory) {
        archive.file(filePath, { name: file });
      } else if (!ignoredFolders.includes(file)) {
        archive.directory(filePath, file);
      }
    });

    await archive.finalize();
  } catch (error) {
    console.error(chalk.yellow("❌ Error during the backup process:"), error);
  } finally {
    rl.close();
  }
};