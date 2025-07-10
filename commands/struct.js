import chalk from "chalk";
import path from "path";
import yaml from "js-yaml";
import fs from "fs";

function convertToTreeObject(dirPath) {
  const treeObject = {};
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    if (file === "node_modules") return;
    if (file === ".git") return;
    if (file === ".github") return;
    if (file === ".idea") return;
    if (file === ".fleet") return;
    if (file === ".settings") return;

    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      treeObject[file] = convertToTreeObject(fullPath);
    } else {
      treeObject[file] = "📄";
    }
  });

  return treeObject;
}

export const handleStructCommand = async () => {
  const rootDir = path.join(process.cwd());
  console.log(chalk.cyan("Structure of the Program:"));

  const ymlPath = path.join(process.cwd(), "meow-structure.yml");
  const treeObject = convertToTreeObject(rootDir);

  if (fs.existsSync(ymlPath)) {
    fs.unlinkSync(ymlPath);
  }

  fs.writeFileSync(ymlPath, yaml.dump(treeObject));
  console.log(chalk.cyan("✔️ Structure saved to meow-structure.yml"));
};