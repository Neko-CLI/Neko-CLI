import chalk from "chalk";
import path from "path";
import fs from "fs";
import mime from "mime";

export const handleLanguagesCommand = async () => {
  const foundTechnologies = new Set();
  const directory = process.cwd();

  const hasPackageJson = fs.existsSync(path.join(directory, "package.json"));
  const hasYarnLock = fs.existsSync(path.join(directory, "yarn.lock"));

  if (!hasPackageJson && !hasYarnLock) {
    console.log(chalk.yellow("⚠️ No initialized project found."));
    return;
  }

  const exploreDirectory = async (dir) => {
    const files = await fs.promises.readdir(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);

      if (fullPath.includes("node_modules")) {
        continue;
      }

      const stat = await fs.promises.stat(fullPath);

      if (stat.isDirectory()) {
        await exploreDirectory(fullPath);
      } else if (stat.isFile()) {
        await analyzeFile(fullPath);
      }
    }
  };

  const analyzeFile = async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const content = await fs.promises.readFile(filePath, "utf-8");

    if (filePath === "package.json") {
      try {
        const pkgContent = JSON.parse(content);
        if (fs.existsSync(path.join(directory, "package-lock.json"))) {
          foundTechnologies.add(chalk.cyan("Package Manager: npm"));
        } else if (fs.existsSync(path.join(directory, "yarn.lock"))) {
          foundTechnologies.add(chalk.cyan("Package Manager: yarn"));
        }

        if (pkgContent.dependencies) {
          if (pkgContent.dependencies.react)
            foundTechnologies.add(chalk.cyan("React : JavaScript Framework"));
          if (pkgContent.dependencies.vue)
            foundTechnologies.add(chalk.cyan("Vue : JavaScript Framework"));
          if (pkgContent.dependencies.angular)
            foundTechnologies.add(chalk.cyan("Angular : JavaScript Framework"));
          if (pkgContent.dependencies.express)
            foundTechnologies.add(chalk.cyan("Express : Node.js Framework"));
        }
      } catch (error) {
        console.error("Error reading package.json", error);
      }
    }

    if (ext === ".js" || ext === ".jsx") {
      foundTechnologies.add(chalk.cyan("JavaScript : Programming Language"));
    }
    if (ext === ".ts" || ext === ".tsx") {
      foundTechnologies.add(chalk.cyan("TypeScript : Programming Language"));
    }
    if (ext === ".py") {
      foundTechnologies.add(chalk.cyan("Python : Programming Language"));
    }
    if (ext === ".rb") {
      foundTechnologies.add(chalk.cyan("Ruby : Programming Language"));
    }
    if (ext === ".java") {
      foundTechnologies.add(chalk.cyan("Java : Programming Language"));
    }
    if (ext === ".go") {
      foundTechnologies.add(chalk.cyan("Go : Programming Language"));
    }
    if (ext === ".php") {
      foundTechnologies.add(chalk.cyan("PHP : Programming Language"));
    }
    if (ext === ".c") {
      foundTechnologies.add(chalk.cyan("C : Programming Language"));
    }
    if (ext === ".cpp") {
      foundTechnologies.add(chalk.cyan("C++ : Programming Language"));
    }
    if (ext === ".h") {
      foundTechnologies.add(chalk.cyan("C Header : Programming Language"));
    }
    if (ext === ".cs") {
      foundTechnologies.add(chalk.cyan("C# : Programming Language"));
    }
    if (ext === ".swift") {
      foundTechnologies.add(chalk.cyan("Swift : Programming Language"));
    }
    if (ext === ".kt") {
      foundTechnologies.add(chalk.cyan("Kotlin : Programming Language"));
    }
    if (ext === ".dart") {
      foundTechnologies.add(chalk.cyan("Dart : Programming Language"));
    }
    if (ext === ".r") {
      foundTechnologies.add(chalk.cyan("R : Programming Language"));
    }
    if (ext === ".lua") {
      foundTechnologies.add(chalk.cyan("Lua : Programming Language"));
    }
    if (ext === ".el") {
      foundTechnologies.add(chalk.cyan("Emacs Lisp : Programming Language"));
    }
    if (ext === ".clj") {
      foundTechnologies.add(chalk.cyan("Clojure : Programming Language"));
    }
    if (ext === ".scss") {
      foundTechnologies.add(chalk.cyan("Sass : CSS Preprocessor"));
    }
    if (ext === ".less") {
      foundTechnologies.add(chalk.cyan("Less : CSS Preprocessor"));
    }
    if (ext === ".html") {
      foundTechnologies.add(chalk.cyan("HTML : Markup Language"));
    }
    if (ext === ".css") {
      foundTechnologies.add(chalk.cyan("CSS : Styling Language"));
    }
    if (ext === ".json") {
      foundTechnologies.add(chalk.cyan("JSON : Data Format"));
    }
    if (ext === ".yaml" || ext === ".yml") {
      foundTechnologies.add(chalk.cyan("YAML : Data Format"));
    }
    if (ext === ".toml") {
      foundTechnologies.add(chalk.cyan("TOML : Data Format"));
    }
    if (ext === ".md") {
      foundTechnologies.add(chalk.cyan("Markdown : Documentation Format"));
    }
    if (ext === ".tex") {
      foundTechnologies.add(chalk.cyan("LaTeX : Document Preparation"));
    }
    if (ext === ".sql") {
      foundTechnologies.add(chalk.cyan("SQL : Database Query Language"));
    }
    if (ext === ".xml") {
      foundTechnologies.add(chalk.cyan("XML : Markup Language"));
    }
    if (ext === ".bash" || ext === ".sh") {
      foundTechnologies.add(chalk.cyan("Bash : Scripting Language"));
    }
    if (ext === ".bat") {
      foundTechnologies.add(chalk.cyan("Batch : Scripting Language"));
    }
    if (ext === ".ps1") {
      foundTechnologies.add(chalk.cyan("PowerShell : Scripting Language"));
    }

    if (filePath === "webpack.config.js") {
      foundTechnologies.add(chalk.cyan("Webpack : Module Bundler"));
    }
    if (filePath === "vite.config.js" || content.includes("vite")) {
      foundTechnologies.add(chalk.cyan("Vite : Next-Generation Build Tool"));
    }
    if (filePath === "babel.config.js") {
      foundTechnologies.add(chalk.cyan("Babel : JavaScript Compiler"));
    }
    if (filePath === "rollup.config.js") {
      foundTechnologies.add(chalk.cyan("Rollup : Module Bundler"));
    }
    if (filePath === "gruntfile.js") {
      foundTechnologies.add(chalk.cyan("Grunt : JavaScript Task Runner"));
    }
    if (filePath === "gulpfile.js") {
      foundTechnologies.add(chalk.cyan("Gulp : Task Automation"));
    }
    if (filePath === "gulpfile.babel.js") {
      foundTechnologies.add(
        chalk.cyan("Gulp with Babel : Task Automation with Babel")
      );
    }

    const mimeType = mime.getType(filePath);
    if (mimeType) {
      foundTechnologies.add(chalk.cyan(`File Type: ${mimeType}`));
    }
  };

  await exploreDirectory(directory);

  const formattedTechnologies = Array.from(foundTechnologies)
    .map((tech) => `- ${tech}`)
    .join("\n");

  console.log(chalk.cyan("📜 This project uses:"));
  console.log(formattedTechnologies);
};