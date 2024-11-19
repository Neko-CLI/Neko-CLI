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
import sharp from 'sharp'; // Importato sharp per il ridimensionamento delle immagini
const args = process.argv.slice(2);
const command = args[0];
const packageName = args.slice(1).join(' ');
import { promisify } from 'util';

const execAsync = promisify(exec);

const formatTimestamp = () => {
    const now = new Date();
    return `[${chalk.gray(now.toISOString())}]`;
};

async function runScript(scriptName) {
    try {
        console.log(`${formatTimestamp()} ${chalk.cyan(`Starting script: "${scriptName}"`)}`);

        const spinner = ora({
            text: chalk.blue(`Preparing to execute "${scriptName}"...`),
            spinner: 'dots',
            color: 'cyan',
        }).start();
        
        const command = `node -e "require('child_process').execSync('npm run ${scriptName} --silent', { stdio: 'inherit' })"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                spinner.fail(`${chalk.red(`Script "${scriptName}" failed to execute.`)}`);
                console.error(`${formatTimestamp()} ${chalk.red('Error executing script:')}`);
                console.error(`${chalk.red('Error Code:')} ${error.code}`);
                console.error(`${chalk.red('Error Output:')} ${stderr}`);
                return;
            }

            spinner.succeed(`${chalk.green(`Script "${scriptName}" executed successfully!`)}`);
            console.log(`${formatTimestamp()} ${chalk.yellow('Output:')}\n${chalk.green(stdout)}`);

            if (stderr) {
                console.log(`${formatTimestamp()} ${chalk.red('Warnings or Errors:')}\n${chalk.red(stderr)}`);
            }
        });
    } catch (error) {
        console.error(`${formatTimestamp()} ${chalk.red(`Error executing script "${scriptName}":`)}`);
        console.error(`${chalk.red('Error Code:')} ${error.code}`);
        console.error(`${chalk.red('Error Output:')} ${error.stderr}`);
        console.error(`${chalk.red('Full Stack Trace:')} ${error.stack}`);
    }
}

function readMeowRockJson() {
    if (fs.existsSync('package.json')) {
        return JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    } else {
        console.log(chalk.red('Error: package.json file does not exist.'));
        process.exit(1);
    }
}

function writeMeowRockJson(data) {
    fs.writeFileSync('package.json', JSON.stringify(data, null, 2));
}

function showProjectTree() {
    const tree = directoryTree('./', {
        depth: 2,
        attributes: ['type'],
    });

    const formatTree = (node) => {
        let output = '';
        if (node.type === 'directory') {
            output += `${figures.arrowRight} ${chalk.green(node.name)}\n`;
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
                console.error(chalk.red('Error during meow installation:', stderr));
            } else {
                displayImage('https://i.imgur.com/iE1Y9mT.png');
                console.log(chalk.green('Packages installed successfully.'));
            }
        });
    } else if (fs.existsSync('yarn.lock')) {
        console.log(chalk.cyan('Found yarn.lock, running yarn install...'));
        const spinner = ora('Installing packages...').start();
        exec('yarn install --silent', (err, stdout, stderr) => {
            spinner.stop();
            if (err) {
                console.error(chalk.red('Error during yarn installation:', stderr));
            } else {
                displayImage('https://i.imgur.com/iE1Y9mT.png');
                console.log(chalk.green('Packages installed successfully.'));
            }
        });
    } else {
        console.log(chalk.red('Error: No package.json or yarn.lock found.'));
    }
}

async function installAllPackages() {
    if (fs.existsSync('package.json')) {
        console.log(chalk.cyan('Found package.json, running meow install for all dependencies...'));
        const spinner = ora('Installing all dependencies...').start();
        exec('npm install --silent', (err, stdout, stderr) => {
            spinner.stop();
            if (err) {
                console.error(chalk.red('Error during meow installation:', stderr));
            } else {
                displayImage('https://i.imgur.com/iE1Y9mT.png');
                console.log(chalk.green('All dependencies installed successfully using meow.'));
            }
        });
    } else if (fs.existsSync('yarn.lock')) {
        console.log(chalk.cyan('Found yarn.lock, running yarn install for all dependencies...'));
        const spinner = ora('Installing all dependencies using yarn...').start();
        exec('yarn install --silent', (err, stdout, stderr) => {
            spinner.stop();
            if (err) {
                console.error(chalk.red('Error during yarn installation:', stderr));
            } else {
                displayImage('https://i.imgur.com/iE1Y9mT.png');
                console.log(chalk.green('All dependencies installed successfully using yarn.'));
            }
        });
    } else {
        console.log(chalk.red('Error: No package.json or yarn.lock found.'));
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
        console.error(chalk.red('Error fetching version from meow registry:', err));
        return 'unknown';
    }
}

async function showVersion() {
    const version = await getPackageVersion();
    console.log(chalk.cyan('Current CLI version: ' + version));
}

async function initProject() {
    const projectName = readlineSync.question('Enter the project name: ');  // Chiede il nome del progetto
    const projectVersion = readlineSync.question('Enter the project version (default: 1.0.0): ', { defaultInput: '1.0.0' });  // Chiede la versione del progetto, con valore predefinito
    const author = readlineSync.question('Enter the author name: ');  // Chiede il nome dell'autore
    const useNodemon = readlineSync.keyInYNStrict('Would you like to use nodemon for development?');  // Chiede se usare nodemon

    // Costruisce il contenuto del file package.json
    const packageJson = {
        name: projectName,
        version: projectVersion,
        description: '',  // Descrizione vuota
        main: 'index.js',
        scripts: {
            start: 'node index.js',  // Script per avviare il progetto
            test: 'echo "Error: no test specified" && exit 1',  // Placeholder per test
            dev: useNodemon ? 'nodemon index.js' : 'node index.js',  // Usa nodemon se scelto
            build: 'echo "Building project..."',  // Placeholder per build
        },
        author: author,
        license: 'ISC',
        dependencies: {},
        devDependencies: useNodemon ? { nodemon: '^2.0.7' } : {},  // Installa nodemon se scelto
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

    // Scrive il file package.json
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log(chalk.green(`Project ${projectName} initialized successfully.`));

    // Installa le dipendenze necessarie (incluso nodemon se scelto)
    manualinstall(useNodemon);
}

function manualinstall(useNodemon) {
    // Avvia l'animazione di installazione
    const animation = chalkAnimation.rainbow('🚀 Installing packages... Please wait!');

    // Imposta il comando per l'installazione
    const installCommand = useNodemon ? 'npm install --silent' : 'npm install --silent';

    // Mostra una barra di caricamento con ora
    const spinner = ora('Running meow install...').start();

    exec(installCommand, (err, stdout, stderr) => {
        // Ferma l'animazione
        animation.stop();

        // Ferma la barra di caricamento
        spinner.stop();

        if (err) {
            // Mostra errore in rosso se si verifica un problema durante l'installazione
            console.error(chalk.red('😞 Error during installation: '), chalk.yellow(stderr));
        } else {
            // Mostra il successo in verde con emoji
            console.log(chalk.green('🎉 Installation completed successfully! All packages are now installed.'));
        }
    });
}

async function main() {
    const scriptName = args[1];
    if (command === 'meow') {
        await installPackages();
    } else {
        switch (command) {
            case 'init':
                await initProject();
                break;

            case 'add':
                if (!packageName) {
                    console.log(chalk.red('Error: You must specify the package name to add.'));
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
                        console.error(chalk.red('Error during package installation:', stderr));
                        return;
                    }

                    const endTime = Date.now();
                    const installTime = ((endTime - startTime) / 1000).toFixed(2);
                    console.log(chalk.green(`🎉 Package added successfully! Time taken: ${installTime}s`));

                    showProjectTree();

                    console.log(chalk.green('Installation complete! 🎉'));
                });

                break;

            case 'remove':
                if (!packageName) {
                    console.log(chalk.red('Error: You must specify the package name to remove.'));
                    break;
                }

                const animationRemove = chalkAnimation.rainbow('=^._.^= Meow is removing the packages...');
                const spinnerRemove = ora('Removing package...').start();

                exec(`npm uninstall ${packageName} --save --silent`, (err, stdout, stderr) => {
                    displayImage('https://i.imgur.com/iE1Y9mT.png');
                    spinnerRemove.stop();
                    animationRemove.stop();

                    if (err) {
                        console.error(chalk.red('Error during package removal:', stderr));
                        return;
                    }

                    console.log(chalk.green(`Package ${packageName} removed successfully.`));
                    showProjectTree();
                });

                break;

            case 'all':
                await installAllPackages();
                break;

            case 'flush':
                if (!scriptName) {
                    console.log(`${formatTimestamp()} ${chalk.red('Error: You must specify the script name to run.')}`);
                    return;
                }
                await runScript(scriptName);
                break;

            case 'help':
                showHelp();
                break;

            case 'version':
                showVersion();
                break;

            default:
                console.log(chalk.red('Invalid command. Use "help" for a list of commands.'));
                break;
        }
    }
}

main().catch((error) => {
    console.error(chalk.red('An unexpected error occurred:', error));
});
