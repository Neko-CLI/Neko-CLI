import chalk from "chalk";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
export const handleAnalyzeCommand = async () => {
  try {
    const projectDir = process.cwd();
    const distDir = path.join(projectDir, "dist");
    const filesToDelete = [
      "460.meow-analyzer.js",
      "bundle-report.html",
      "meow-analyzer.js",
      "meow-analyzer.js.LICENSE.txt",
    ];
    filesToDelete.forEach((file) => {
      const filePath = path.join(distDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(chalk.yellow(`🗑️ Deleted old file: ${filePath}`));
      }
    });
    const packageJsonPath = path.join(projectDir, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      console.log(
        chalk.yellow(
          "❌ package.json not found in the current directory. A 'package.json' file is required to analyze dependencies."
        )
      );
      return;
    }
    const entryFilePath = path.join(projectDir, "index.js");
    if (!fs.existsSync(entryFilePath)) {
      const placeholderContent = `
console.log("Neko-CLI analysis entry point placeholder.");
`;
      fs.writeFileSync(entryFilePath, placeholderContent.trim());
      console.log(
        chalk.cyan(`✨ Created missing entry file: ${chalk.cyan("index.js")}`)
      );
      console.log(
        chalk.gray(
          `  (Neko-CLI created a placeholder 'index.js' to proceed with analysis.)`
        )
      );
    } else {
      console.log(
        chalk.cyan(`✔️ Found entry file: ${chalk.cyan("index.js")}`)
      );
    }
    console.log(
      chalk.cyan(
        "📦 Running Meowpack to analyze dependencies and generate the report..."
      )
    );
    const webpackConfig = `
import path from 'path';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
export default {
  entry: './index.js',
  output: {
    path: path.resolve('dist'),
    filename: 'meow-analyzer.js',
    clean: true,
  },
  mode: 'production',
  target: 'node',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: true,
      theme: 'dark',
    }),
  ],
  resolve: {
    extensions: ['.js', '.mjs'],
  },
};
`;
    const babelConfig = `
export default {
  presets: ['@babel/preset-env'],
};
`;
    fs.writeFileSync(
      path.join(projectDir, "webpack.config.mjs"),
      webpackConfig
    );
    console.log(chalk.cyan("✔️ Created webpack.config.mjs"));
    fs.writeFileSync(path.join(projectDir, "babel.config.js"), babelConfig);
    console.log(chalk.cyan("✔️ Created babel.config.js"));
    console.log(chalk.cyan("📦 Installing dependencies..."));
    exec(
      "npm install --silent webpack webpack-cli babel-loader @babel/preset-env webpack-bundle-analyzer",
      (err, stdout, stderr) => {
        if (err) {
          console.error(chalk.yellow("❌ Dependency installation failed:"));
          if (stdout) console.error(chalk.gray("--- stdout ---\n" + stdout));
          if (stderr) console.error(chalk.red("--- stderr ---\n" + stderr));
          return;
        }
        console.log(chalk.cyan("✅ Dependencies installed successfully."));
        exec(
          "npx webpack --config webpack.config.mjs",
          (err, stdout, stderr) => {
            if (err) {
              console.error(
                chalk.red("❌ Meowpack compilation failed. See details below:")
              );
              if (stdout)
                console.error(chalk.gray("--- Webpack stdout ---\n" + stdout));
              if (stderr)
                console.error(chalk.red("--- Webpack stderr ---\n" + stderr));
              return;
            }
            console.log(
              chalk.cyan("✅ Meowpack compilation completed successfully.")
            );
            console.log(chalk.cyan("📊 Open the bundle report..."));
            console.log(
              chalk.cyan(
                `You can view the report in the file: file://${path.join(
                  distDir,
                  "bundle-report.html"
                )}`
              )
            );
          }
        );
      }
    );
  } catch (error) {
    console.error(
      chalk.yellow(
        "❌ An unexpected error occurred while analyzing dependencies:"
      ),
      error
    );
  }
};
