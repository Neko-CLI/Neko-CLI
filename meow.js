#!/usr/bin/env node

import chalk from 'chalk';
import fetch from 'node-fetch';
import chalkAnimation from 'chalk-animation';
import fs from 'fs';
import ora from 'ora';
import readlineSync from 'readline-sync';
import directoryTree from 'directory-tree';
import figures from 'figures';
import { exec } from 'child_process';
import axios from 'axios';
import pkg from 'terminal-art';
const { toAnsii } = pkg;
import path from 'path';
import sharp from 'sharp';
import yaml from 'js-yaml';

const args = process.argv.slice(2);
const command = args[0];
const packageName = args.slice(1).join(' ');

import { spawn } from 'child_process';

import { promisify } from 'util';

const execAsync = promisify(exec);

export async function publishCommand(platform) {
    if (!platform) {
        console.log(chalk.yellow('❌ Please specify a platform: npm, yarn, or meow.'));
        return;
    }

    switch (platform.toLowerCase()) {
        case 'npm':
            try {
                console.log(chalk.cyan('🚀 Publishing to Npmjs...'));
                const { stdout, stderr } = await execAsync('npm publish');
                console.log(chalk.cyan('✔️ Successfully published to Npmjs!'));
                if (stdout) console.log(chalk.cyan(stdout));
                if (stderr) console.error(chalk.yellow(stderr));
            } catch (error) {
                console.error(chalk.yellow('❌ Failed to publish to Npmjs:'), chalk.yellow(error.message));
            }
            break;

        case 'yarn':
            try {
                console.log(chalk.cyan('🚀 Publishing to YarnPkg...'));
                await execAsync('yarn publish');
                console.log(chalk.green('✔️ Successfully published to YarnPkg!'));
            } catch (error) {
                console.error(chalk.red('❌ Failed to publish to YarnPkg:'), chalk.yellow(error.message));

                if (error.message.includes("'yarn' is not recognized")) {
                    const installYarn = readlineSync.keyInYNStrict(chalk.cyan('Yarn is not installed. Would you like to install it globally?'));

                    if (installYarn) {
                        console.log(chalk.cyan('Installing Yarn globally...'));
                        try {
                            await execAsync('npm install -g yarn');
                            console.log(chalk.green('✔️ Yarn installed successfully. Please run the command again.'));
                        } catch (installError) {
                            console.error(chalk.red('❌ Failed to install Yarn globally:'), chalk.yellow(installError.message));
                        }
                    } else {
                        console.log(chalk.yellow('❌ Yarn was not installed as per your choice.'));
                    }
                }
            }
            break;

        case 'meow':
            console.log(chalk.yellow('⚠️ Meow platform is currently under development. Stay tuned!'));
            break;

        default:
            console.log(chalk.yellow(`❌ Unknown platform: ${platform}. Please use npm, yarn, or meow.`));
    }
}

export function structCommand() {
    const rootDir = path.join(process.cwd());
    console.log(chalk.cyan("Structure of the Program:"));

    const ymlPath = path.join(process.cwd(), 'structure.yml');
    const treeObject = convertToTreeObject(rootDir);

    if (fs.existsSync(ymlPath)) {
        fs.unlinkSync(ymlPath);
    }

    fs.writeFileSync(ymlPath, yaml.dump(treeObject));
    console.log(chalk.cyan('✔️ Structure saved to structure.yml'));
}

function convertToTreeObject(dirPath) {
    const treeObject = {};
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        if (file === 'node_modules') return;
        if (file === '.git') return;
        if (file === '.github') return;
        if (file === '.idea') return;
        if (file === '.fleet') return;
        if (file === '.settings') return;

        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            treeObject[file] = convertToTreeObject(fullPath);
        } else {
            treeObject[file] = '📄';
        }
    });

    return treeObject;
}


function formatTimestamp() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    return `${chalk.cyan('[')}${chalk.cyan.bold('⏰')}${chalk.cyan(' ')}${chalk.cyan(hours)}:${chalk.cyan(minutes)}:${chalk.cyan(seconds)}${chalk.cyan(']')}`;
}

async function runScript(scriptName) {
    console.log(`${formatTimestamp()} ${chalk.cyan(`Starting script: "${scriptName}"`)}`);

    const spinner = ora({
        text: chalk.cyan(`Preparing to execute "${scriptName}"...`),
        spinner: 'dots',
        color: 'cyan',
    }).start();

    try {
        const child = spawn('npm', ['run', scriptName, '--silent'], { stdio: 'pipe', shell: true });

        spinner.text = chalk.cyan(`Executing "${scriptName}"...`);

        child.stdout.on('data', (data) => {
            spinner.stop();
            process.stdout.write(data);
        });

        child.stderr.on('data', (data) => {
            spinner.stop();
            process.stderr.write(chalk.yellow(data));
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log(chalk.cyan(`Script "${scriptName}" executed successfully!`));
            } else {
                console.error(chalk.yellow(`Script "${scriptName}" exited with code ${code}.`));
            }
        });

        child.on('error', (error) => {
            spinner.fail(`${chalk.yellow(`Unexpected error occurred while running "${scriptName}":`)}`);
            console.error(`${formatTimestamp()} ${chalk.yellow(error.stack)}`);
        });
    } catch (error) {
        spinner.fail(`${chalk.yellow(`Unexpected error occurred while running "${scriptName}":`)}`);
        console.error(`${formatTimestamp()} ${chalk.yellow(error.stack)}`);
    }
}

function showProjectTree() {
    const tree = directoryTree('./', {
        depth: 2,
        attributes: ['type'],
    });

    const formatTree = (node) => {
        let output = '';
        if (node.type === 'directory') {
            output += `${figures.arrowRight} ${chalk.cyan(node.name)}\n`;
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                    output += '  ' + formatTree(child);
                });
            }
        } else {
            output += `${figures.file} ${chalk.yellow(node.name)}\n`;
        }
        return output;
    };

    console.log(chalk.cyan('\nProject Directory Tree:'));
    console.log(formatTree(tree));
}

async function downloadImage(url) {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return response.data;
}

async function displayImage(imageUrl) {
    try {
        const imageBuffer = await downloadImage(imageUrl);

        const resizedBuffer = await sharp(imageBuffer)
            .resize(64, 64)
            .toBuffer();

        const extname = path.extname(imageUrl).toLowerCase();
        let mimeType = 'image/png';

        if (extname === '.jpg' || extname === '.jpeg') {
            mimeType = 'image/jpeg';
        } else if (extname === '.gif') {
            mimeType = 'image/gif';
        }

        toAnsii(resizedBuffer, { mimeType, width: 64 }).then((asciiArt) => {
            console.log(asciiArt);
        }).catch(err => {
            console.error("Error converting image:", err);
        });
    } catch (error) {
        console.error("Error downloading or resizing image:", error);
    }
}

async function installPackages() {
    if (fs.existsSync('package.json')) {
        console.log(chalk.cyan('Found package.json, running meow install...'));
        const spinner = ora('Installing packages...').start();
        exec('npm install --silent', (err, stdout, stderr) => {
            spinner.stop();
            if (err) {
                console.error(chalk.yellow('Error during meow installation:', stderr));
            } else {
                displayImage('https://i.imgur.com/iE1Y9mT.png');
                console.log(chalk.cyan('Packages installed successfully.'));
            }
        });
    } else if (fs.existsSync('yarn.lock')) {
        console.log(chalk.cyan('Found yarn.lock, running yarn install...'));
        const spinner = ora('Installing packages...').start();
        exec('yarn install --silent', (err, stdout, stderr) => {
            spinner.stop();
            if (err) {
                console.error(chalk.yellow('Error during yarn installation:', stderr));
            } else {
                displayImage('https://i.imgur.com/iE1Y9mT.png');
                console.log(chalk.cyan('Packages installed successfully.'));
            }
        });
    } else {
        console.log(chalk.yellow('Error: No package.json or yarn.lock found.'));
    }
}

async function installAllPackages() {
    if (fs.existsSync('package.json')) {
        console.log(chalk.cyan('Found package.json, running meow install for all dependencies...'));
        const spinner = ora('Installing all dependencies...').start();
        exec('npm install --silent', (err, stdout, stderr) => {
            spinner.stop();
            if (err) {
                console.error(chalk.yellow('Error during meow installation:', stderr));
            } else {
                displayImage('https://i.imgur.com/iE1Y9mT.png');
                console.log(chalk.cyan('All dependencies installed successfully using meow.'));
            }
        });
    } else if (fs.existsSync('yarn.lock')) {
        console.log(chalk.cyan('Found yarn.lock, running yarn install for all dependencies...'));
        const spinner = ora('Installing all dependencies using yarn...').start();
        exec('yarn install --silent', (err, stdout, stderr) => {
            spinner.stop();
            if (err) {
                console.error(chalk.yellow('Error during yarn installation:', stderr));
            } else {
                displayImage('https://i.imgur.com/iE1Y9mT.png');
                console.log(chalk.cyan('All dependencies installed successfully using yarn.'));
            }
        });
    } else {
        console.log(chalk.yellow('Error: No package.json or yarn.lock found.'));
    }
}

function showHelp() {
    console.log(chalk.cyan(`
    Available commands:
    - init       : Initialize a new project.
    - add <pkg>  : Add a package to the project.
    - remove <pkg>: Remove a package from the project.
    - meow       : Install dependencies from package.json or yarn.lock.
    - all        : Install all packages from package.json 2 or yarn.lock 2.
    - flush      : Run scripts using cats framework.
    - dev        : Flush the dev script if exists.
    - struct     : Predict the structure of the code and save it in a structure.yml.
    - publish <pkg>: Publish the package to cloud.
    - help       : Show this help message.
    - version    : Show the current version of the CLI.
    `));
}

async function getPackageVersion() {
    try {
        const response = await fetch('https://registry.npmjs.org/neko-cli');
        const data = await response.json();
        return data['dist-tags'].latest;
    } catch (err) {
        console.error(chalk.yellow('Error fetching version from meow registry:', err));
        return 'unknown';
    }
}

async function showVersion() {
    const version = await getPackageVersion();
    console.log(chalk.cyan('Current CLI version: ' + version));
}

async function initProject() {
    const projectName = readlineSync.question(chalk.cyan('Enter the project name: '));
    const normalizedProjectName = projectName.toLowerCase();
    const projectVersion = readlineSync.question(chalk.cyan('Enter the project version (default: 1.0.0): '), { defaultInput: '1.0.0' });
    const author = readlineSync.question(chalk.cyan('Enter the author name: '));
    const useNodemon = readlineSync.keyInYNStrict(chalk.cyan('Would you like to use nodemon for development?'));
    const projectFolders = readlineSync.keyInYNStrict(chalk.cyan('Would you like create project folders?'));

    if (fs.existsSync('yarn.lock') && !isYarnInstalled()) {
        console.log(chalk.yellow('Yarn.lock file found, but Yarn is not installed.'));
        const installYarn = readlineSync.keyInYNStrict(chalk.cyan('Would you like to install Yarn globally to continue?'));
        if (!installYarn) {
            console.log(chalk.yellow('Exiting the project initialization process.'));
            process.exit(1);
        }
        console.log(chalk.cyan('Installing Yarn globally...'));
        exec('npm install -g yarn', { stdio: 'ignore' });
    }

    const packageJson = {
        name: normalizedProjectName,
        version: projectVersion,
        description: '',
        main: 'index.js',
        scripts: {
            start: 'node index.js',
            test: 'echo "Error: no test specified" && exit 1',
            dev: useNodemon ? 'nodemon index.js' : 'node index.js',
            build: 'echo "Building project..."',
        },
        author: author,
        license: 'ISC',
        dependencies: {},
        devDependencies: useNodemon ? { nodemon: '^2.0.7' } : {},
        engines: {
            node: '>=14.0.0',
        },
        repository: {
            type: 'git',
            url: 'https://github.com/user/repository.git',
        },
        bugs: {
            url: 'https://github.com/user/repository/issues',
        },
        homepage: 'https://github.com/user/repository#readme',
        keywords: ['node', 'project', 'starter'],
        private: false,
        files: [
            'index.js',
            'README.md',
            'LICENSE',
        ],
    };

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log(chalk.cyan(`🎉 Project ${normalizedProjectName} initialized successfully!`));

    createIndexJs();
    createGitIgnore();

    if (projectFolders) {
        createProjectFolders();
    } else {
        console.log(chalk.yellow('❌ Project folders not created as per your choice.'));
    }

    if (useNodemon) {
        const animationAdd = chalkAnimation.rainbow('=^._.^= Meow is adding the nodemon...');
        const spinner = ora('Fetching nodemon info...').start();

        const startTime = Date.now();
        exec('npm install nodemon --save --silent');
        spinner.stop();
        animationAdd.stop();

        const endTime = Date.now();
        const installTime = ((endTime - startTime) / 1000).toFixed(2);
        console.log(chalk.cyan(`🎉 Nodemon added successfully! Time taken: ${installTime}s`));
    } else {
        console.log(chalk.yellow('❌ Nodemon not installed as per your choice.'));
    }
}

function isYarnInstalled() {
    try {
        exec('yarn --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function createIndexJs() {
    const indexJsContent = `
console.log('Welcome to your new project!');

console.log('Neko-CLI is the best to make a complete project');

console.log('Add your code below:');
`;

    fs.writeFileSync('index.js', indexJsContent);
    console.log(chalk.cyan('📝 Created index.js!'));
}

function createGitIgnore() {
    const gitIgnoreContent = `
# Ignore node_modules folder
node_modules/

# Ignore npm debug logs
npm-debug.log*

# Ignore Yarn debug logs
yarn-debug.log*
yarn-error.log*

# Ignore environment variables file
.env

# Ignore build output
dist/
build/

# Ignore temporary files
*.tmp
*.log
`;

    fs.writeFileSync('.gitignore', gitIgnoreContent.trim());

    console.log(chalk.cyan('📝 Created .gitignore file successfully!'));
}

function createProjectFolders() {
    const folders = ['api', 'backend', 'frontend', 'struct'];

    folders.forEach(folder => {
        const folderPath = path.join(process.cwd(), folder);

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
            console.log(chalk.cyan(`📁 Created folder: ${folder}`));
        } else {
            console.log(chalk.yellow(`⚠️ Folder already exists: ${folder}`));
        }
    });
}


async function main() {
    const scriptName = args[1];
    const platform = args[1];
    if (command === 'meow') {
        await installPackages();
    } else {
        switch (command) {
            case 'init':
                await initProject();
                break;

            case 'add':
                if (!packageName) {
                    console.log(chalk.yellow('Error: You must specify the package name to add.'));
                    break;
                }

                const animationAdd = chalkAnimation.rainbow('=^._.^= Meow is adding the packages...');
                const spinner = ora('Fetching package info...').start();

                const startTime = Date.now();
                exec(`npm install ${packageName} --save --silent`, (err, stdout, stderr) => {
                    displayImage('https://i.imgur.com/iE1Y9mT.png');
                    spinner.stop();
                    animationAdd.stop();

                    if (err) {
                        console.error(chalk.yellow('Error during package installation:', stderr));
                        return;
                    }

                    const endTime = Date.now();
                    const installTime = ((endTime - startTime) / 1000).toFixed(2);
                    console.log(chalk.cyan(`🎉 Package added successfully! Time taken: ${installTime}s`));

                    showProjectTree();

                    console.log(chalk.cyan('Installation complete! 🎉'));
                });

                break;

            case 'remove':
                if (!packageName) {
                    console.log(chalk.yellow('Error: You must specify the package name to remove.'));
                    break;
                }

                const animationRemove = chalkAnimation.rainbow('=^._.^= Meow is removing the packages...');
                const spinnerRemove = ora('Removing package...').start();

                exec(`npm uninstall ${packageName} --save --silent`, (err, stdout, stderr) => {
                    displayImage('https://i.imgur.com/iE1Y9mT.png');
                    spinnerRemove.stop();
                    animationRemove.stop();

                    if (err) {
                        console.error(chalk.yellow('Error during package removal:', stderr));
                        return;
                    }

                    console.log(chalk.cyan(`Package ${packageName} removed successfully.`));
                    showProjectTree();
                });

                break;

            case 'all':
                await installAllPackages();
                break;

            case 'flush':
                if (!scriptName) {
                    console.log(`${formatTimestamp()} ${chalk.yellow('Error: You must specify the script name to run.')}`);
                    return;
                }
                await runScript(scriptName);
                break;

            case 'dev':
                await runScript('dev');
                break;

            case 'struct':
                structCommand();
                break;

            case 'publish':
                publishCommand(platform);
                break;

            case 'help':
                showHelp();
                break;

            case 'version':
                showVersion();
                break;

            default:
                console.log(chalk.yellow('Invalid command. Use "help" for a list of commands.'));
                break;
        }
    }
}

main().catch((error) => {
    console.error(chalk.yellow('An unexpected error occurred:', error));
});