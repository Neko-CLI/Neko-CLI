import chalk from "chalk";
import readline from "readline";
import fsExtra from "fs-extra";
import path from "path";
import ora from "ora";
import chalkAnimation from "chalk-animation";
import { execAsync } from "../utils/execUtils.js";

const { existsSync, writeJson } = fsExtra;

async function isYarnInstalled() {
    try {
        await execAsync("yarn --version", { stdio: "ignore" });
        return true;
    } catch (error) {
        return false;
    }
}

async function createIndexJs(projectPath, fileName) {
    const spinner = ora(chalk.cyan(`Creating ${fileName} file...`)).start();
    try {
        const content = fileName.endsWith('.mjs') ? 'console.log("Hello from your ES Module Neko CLI project!");\n' : 'console.log("Hello from your Neko CLI project!");\n';
        await fsExtra.writeFile(path.join(projectPath, fileName), content, 'utf-8');
        spinner.succeed(chalk.cyan(`${fileName} created!`));
    } catch (error) {
        spinner.fail(chalk.red(`❌ Failed to create ${fileName}: ${error.message}`));
    }
}

async function createGitIgnore(projectPath) {
    const spinner = ora(chalk.cyan("Creating .gitignore file...")).start();
    try {
        const gitIgnoreContent = `node_modules/\n.env\ndeps.neko\n`;
        await fsExtra.writeFile(path.join(projectPath, '.gitignore'), gitIgnoreContent, 'utf-8');
        spinner.succeed(chalk.cyan(".gitignore created!"));
    } catch (error) {
        spinner.fail(chalk.red(`❌ Failed to create .gitignore: ${error.message}`));
    }
}

async function createProjectFolders(projectPath) {
    const folders = ['src', 'dist', 'config', 'tests'];
    const spinner = ora(chalk.cyan("Creating project folders...")).start();
    try {
        for (const folder of folders) {
            await fsExtra.ensureDir(path.join(projectPath, folder));
        }
        spinner.succeed(chalk.cyan(`Created folders: ${folders.join(', ')}`));
    } catch (error) {
        spinner.fail(chalk.red(`❌ Failed to create project folders: ${error.message}`));
    }
}

const initializeProject = async (cliProjectName, skipPrompts) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const askQuestion = (query, defaultValue = '') =>
        new Promise((resolve) => rl.question(query, (answer) => resolve(answer || defaultValue)));

    try {
        let projectName;
        const baseProjectPath = process.cwd();
        let projectPath;

        if (skipPrompts) {
            projectName = cliProjectName || "neko-cli-project";
            console.log(chalk.yellow(`⚡ Skipping prompts: Using project name: ${projectName}`));
        } else {
            projectName = await askQuestion(chalk.cyan(`Enter the project name (default: neko-cli-project): `), "neko-cli-project");
        }

        projectName = projectName.toLowerCase().replace(/\s+/g, '-');

        let counter = 0;
        let uniqueProjectName = projectName;
        let uniqueProjectPath = path.join(baseProjectPath, uniqueProjectName);

        while (existsSync(uniqueProjectPath)) {
            counter++;
            const newAttemptName = `${projectName}-${counter}`;
            uniqueProjectPath = path.join(baseProjectPath, newAttemptName);

            if (skipPrompts) {
                console.log(chalk.yellow(`⚠️ Directory '${uniqueProjectName}' already exists. Using '${newAttemptName}' instead.`));
                uniqueProjectName = newAttemptName;
            } else {
                console.log(chalk.yellow(`⚠️ A directory named '${path.basename(uniqueProjectPath.replace(`-${counter}`, ''))}' already exists.`));
                const useSuggested = await askQuestion(chalk.cyan(`Do you want to use '${newAttemptName}'? (y/n) > `), 'y');
                if (useSuggested.toLowerCase() === 'y') {
                    uniqueProjectName = newAttemptName;
                    break;
                } else {
                    const customName = await askQuestion(chalk.cyan("Please enter a different project name: "));
                    projectName = customName.toLowerCase().replace(/\s+/g, '-');
                    uniqueProjectName = projectName;
                    uniqueProjectPath = path.join(baseProjectPath, uniqueProjectName);
                    counter = 0;
                }
            }
        }
        projectPath = uniqueProjectPath;
        projectName = uniqueProjectName;

        await fsExtra.ensureDir(projectPath);
        console.log(chalk.cyan(`📦 Creating project directory: ${path.basename(projectPath)}`));

        const packageJsonPath = path.join(projectPath, "package.json");
        const yarnLockPath = path.join(projectPath, "yarn.lock");
        const nekoRockPath = path.join(projectPath, "deps.neko");

        let projectVersion, author, useNodemon, projectFolders, useModules;

        if (skipPrompts) {
            projectVersion = "1.0.0";
            author = "Neko CLI User";
            useNodemon = false;
            projectFolders = false;
            useModules = false;
        } else {
            console.log(chalk.cyan("\n🚀 Let's set up your new project details!"));

            projectVersion = await askQuestion(chalk.cyan("Enter the project version (default: 1.0.0): "), "1.0.0");
            author = await askQuestion(chalk.cyan("Enter the author name (default: Author Name): "), "Author Name");
            useNodemon = (await askQuestion(chalk.cyan("Would you like to use nodemon for development? (y/n) > "))) === 'y';
            projectFolders = (await askQuestion(chalk.cyan("Would you like to create common project folders (src, dist, etc.)? (y/n) > "))) === 'y';
            useModules = (await askQuestion(chalk.cyan("Would you like to use ES Modules ('type': 'module')? (y/n) > "))) === 'y';
        }

        if (existsSync(yarnLockPath) && !(await isYarnInstalled())) {
            console.log(chalk.yellow("⚠️ Yarn lock file found, but Yarn is not installed globally."));
            const installYarn = (await askQuestion(chalk.cyan("Would you like to install Yarn globally to continue? (y/n) > "))) === 'y';
            if (!installYarn) {
                console.log(chalk.yellow("🚫 Exiting the project initialization process."));
                return;
            }

            const installYarnSpinner = ora(chalk.cyan("Installing Yarn globally... This might take a moment.")).start();
            try {
                await execAsync("npm install -g yarn");
                installYarnSpinner.succeed(chalk.cyan("🎉 Yarn installed globally!"));
            } catch (error) {
                installYarnSpinner.fail(chalk.red(`❌ Failed to install Yarn globally: ${error.message}`));
                console.error(chalk.red(`   ${error.stderr || error.stdout}`));
                return;
            }
        }

        const packageJson = {
            name: projectName,
            version: projectVersion,
            description: "",
            main: useModules ? "index.mjs" : "index.js",
            scripts: {
                start: useModules ? "node index.mjs" : "node index.js",
                test: 'echo "Error: no test specified" && exit 1',
                dev: useNodemon ? (useModules ? "nodemon index.mjs" : "nodemon index.js") : (useModules ? "node index.mjs" : "node index.js"),
                build: 'echo "Building project..."',
            },
            author: author,
            license: "ISC",
            dependencies: {},
            devDependencies: useNodemon ? { nodemon: "^3.0.0" } : {},
            engines: {
                node: ">=18.0.0",
            },
            repository: {
                type: "git",
                url: `https://github.com/user/${projectName}.git`,
            },
            bugs: {
                url: `https://github.com/user/${projectName}/issues`,
            },
            homepage: `https://github.com/user/${projectName}#readme`,
            keywords: ["node", "project", "starter", "neko-cli"],
            private: false,
            files: [useModules ? "index.mjs" : "index.js", "README.md", "LICENSE.md"],
        };

        if (useModules) {
            packageJson.type = "module";
        }

        const createPackageJsonSpinner = ora(chalk.cyan("Creating package.json...🚀")).start();
        try {
            await writeJson(packageJsonPath, packageJson, { spaces: 2 });
            createPackageJsonSpinner.succeed(chalk.cyan(`🎉 Project '${projectName}' initialized successfully! package.json created.`));
        } catch (error) {
            createPackageJsonSpinner.fail(chalk.red(`❌ Failed to create package.json: ${error.message}`));
            return;
        }

        await createIndexJs(projectPath, useModules ? "index.mjs" : "index.js");
        await createGitIgnore(projectPath);

        if (projectFolders) {
            await createProjectFolders(projectPath);
        } else {
            console.log(chalk.yellow("❌ Project folders not created as per your choice."));
        }

        if (!existsSync(nekoRockPath)) {
            const createNekoRockSpinner = ora(chalk.cyan("Creating deps.neko file...")).start();
            try {
                const nekoRockContent = "# Neko-CLI package lock file\n# This file tracks installed package versions and integrity.\ndependencies: {}\ndevDependencies: {}\n";
                await fsExtra.writeFile(nekoRockPath, nekoRockContent, "utf-8");
                createNekoRockSpinner.succeed(chalk.cyan("🎉 Created deps.neko file successfully!"));
            } catch (error) {
                createNekoRockSpinner.fail(chalk.red(`❌ Failed to create deps.neko: ${error.message}`));
            }
        }

        if (useNodemon) {
            const nodemonInstallAnimation = chalkAnimation.rainbow(
                "=^._.^= Meow is adding nodemon for purr-fect development... =^._.^="
            );
            const nodemonSpinner = ora(chalk.cyan("Installing nodemon (this might take a moment)...")).start();
            const startTime = Date.now();
            try {
                await execAsync("npm install nodemon --save-dev --silent", { cwd: projectPath });
                nodemonSpinner.succeed(chalk.cyan("🎉 Nodemon added successfully!"));
            } catch (error) {
                nodemonSpinner.fail(chalk.red(`❌ Failed to install nodemon: ${error.message}`));
                console.error(chalk.red(`   ${error.stderr || error.stdout}`));
            } finally {
                nodemonInstallAnimation.stop();
            }
            const endTime = Date.now();
            const installTime = ((endTime - startTime) / 1000).toFixed(2);
            console.log(chalk.cyan(`Time taken to add Nodemon: ${installTime}s`));
        } else {
            console.log(chalk.yellow("❌ Nodemon not installed as per your choice."));
        }

        console.log(chalk.cyan(`\n✨ Project initialization complete! Your new project is ready at: ${projectPath} ✨`));

        console.log("\n");
        console.log("\n");
        console.log(chalk.cyan("--- Next Steps ---"));
        console.log(chalk.cyan(`To get started with your new project, follow these commands:`));
        console.log(chalk.cyan(`\n1. Navigate to your project directory:`));
        console.log(chalk.cyan(`   ${chalk.yellow(`cd ${path.basename(projectPath)}`)}`));
        console.log(chalk.cyan(`\n2. Install project dependencies:`));
        console.log(chalk.cyan(`   ${chalk.yellow(`meow all`)}`));
        console.log(chalk.cyan(`\n3. Start your project in development mode:`));
        console.log(chalk.cyan(`   ${chalk.yellow(`meow dev`)}`));
        console.log(chalk.cyan(`\nHappy coding with Neko-CLI! =^._.^=`));


    } catch (error) {
        console.error(chalk.red(`\n💥 An unexpected error occurred during initialization: ${error.message}`));
        if (error.stdout) console.error(chalk.red(`   Output: ${error.stdout}`));
        if (error.stderr) console.error(chalk.red(`   Error: ${error.stderr}`));
        console.error(chalk.yellow("Please review the error and try again."));
    } finally {
        rl.close();
    }
};

export const handleInitCommand = async (options) => {
    const skipPrompts = options.includes('--skip') || options.includes('-y');
    const projectNameIndex = options.findIndex(opt => !opt.startsWith('-'));
    let projectName = null;

    if (projectNameIndex !== -1) {
        projectName = options[projectNameIndex];
    }

    await initializeProject(projectName, skipPrompts);
};