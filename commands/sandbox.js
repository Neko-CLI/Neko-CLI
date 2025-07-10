import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import os from "os";
import fsExtra from "fs-extra";
import { promisify } from "util";
import { exec, spawn } from "child_process";
import readline from "readline";
import open from "open";

const execAsync = promisify(exec);
const SANDBOX_STATE_FILE = path.join(os.tmpdir(), 'neko-sandbox-active.json');

function createTempDir() {
    const tempDir = path.join(os.tmpdir(), `neko-sandbox-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
    fsExtra.mkdirSync(tempDir);
    return tempDir;
}

function detectPackageManager(projectDir) {
    if (fs.existsSync(path.join(projectDir, 'yarn.lock'))) {
        return 'yarn';
    }
    return 'npm';
}

async function destroySandbox(spinner, tempDir, isForceDestroy = false) {
    if (tempDir && fs.existsSync(tempDir)) {
        spinner.text = chalk.cyan("🧹 Cleaning up sandbox environment...");
        try {
            await fsExtra.remove(tempDir);
            spinner.succeed(chalk.cyan("🧹 Sandbox cleaned up successfully."));
            if (fs.existsSync(SANDBOX_STATE_FILE)) {
                fs.unlinkSync(SANDBOX_STATE_FILE);
            }
        } catch (cleanupError) {
            spinner.fail(chalk.cyan(`❌ Failed to clean up sandbox: ${cleanupError.message}`));
        }
    } else if (isForceDestroy) {
        if (fs.existsSync(SANDBOX_STATE_FILE)) {
            fs.unlinkSync(SANDBOX_STATE_FILE);
            spinner.succeed(chalk.cyan("🧹 Old sandbox state file removed."));
        } else {
            spinner.info(chalk.cyan("No active sandbox directory or state file found to destroy."));
        }
    }
}

function getSandboxPrompt(baseDir, currentCwd) {
    const relativePath = path.relative(baseDir, currentCwd) || '.';
    return chalk.bgCyan(chalk.white(`[Sandbox:${relativePath}] $ `));
}

export const handleSandboxCommand = async (args) => {
    let keepTempDir = false;
    let installDevDependencies = false;
    let forcePackageManager = null;
    let initialCommand = [];

    const cliArgs = args.filter(arg => arg.startsWith('--'));
    const commandArgs = args.filter(arg => !arg.startsWith('--'));

    for (const arg of cliArgs) {
        if (arg === '--dev') {
            installDevDependencies = true;
        } else if (arg === '--keep') {
            keepTempDir = true;
        } else if (arg === '--yarn') {
            forcePackageManager = 'yarn';
        } else if (arg === '--npm') {
            forcePackageManager = 'npm';
        }
    }

    if (commandArgs.length > 0) {
        const subCommand = commandArgs[0];
        let tempDirFromState = null;

        if (fs.existsSync(SANDBOX_STATE_FILE)) {
            try {
                const activeSandbox = JSON.parse(fs.readFileSync(SANDBOX_STATE_FILE, 'utf-8'));
                tempDirFromState = activeSandbox.tempDir;
            } catch (e) {
                console.log(chalk.red(`\n⚠️ Corrupted sandbox state file, attempting to remove it.`));
                fs.unlinkSync(SANDBOX_STATE_FILE);
            }
        }

        const spinner = ora(chalk.cyan("Processing sandbox command...")).start();
        if (subCommand === 'destroy') {
            await destroySandbox(spinner, tempDirFromState, true);
            return;
        } else if (subCommand === 'open') {
            if (tempDirFromState && fs.existsSync(tempDirFromState)) {
                try {
                    await open(tempDirFromState);
                    spinner.succeed(chalk.cyan(`📂 Opened sandbox directory: ${tempDirFromState}`));
                } catch (openError) {
                    spinner.fail(chalk.red(`❌ Failed to open sandbox directory: ${openError.message}`));
                }
            } else {
                spinner.fail(chalk.yellow("⚠️ No active sandbox found to open."));
            }
            return;
        }
        spinner.stop();
    }

    if (fs.existsSync(SANDBOX_STATE_FILE)) {
        try {
            const activeSandbox = JSON.parse(fs.readFileSync(SANDBOX_STATE_FILE, 'utf-8'));
            if (fs.existsSync(activeSandbox.tempDir)) {
                console.log(chalk.yellow(`\n⚠️ An active sandbox is already running at: ${activeSandbox.tempDir}`));
                console.log(chalk.yellow("Use 'sandbox destroy' to exit and clean it up."));
                console.log(chalk.yellow("Use 'sandbox open' to open the sandbox directory."));
                return;
            } else {
                console.log(chalk.yellow(`\n⚠️ Found stale sandbox state file, cleaning it up.`));
                fs.unlinkSync(SANDBOX_STATE_FILE);
            }
        } catch (e) {
            console.log(chalk.red(`\n⚠️ Corrupted sandbox state file, attempting to remove it.`));
            fs.unlinkSync(SANDBOX_STATE_FILE);
        }
    }

    if (commandArgs.length > 0) {
        initialCommand = commandArgs;
    }

    let tempDir = null;
    const spinner = ora(chalk.cyan("📦 Preparing Neko's sandbox environment...")).start();

    try {
        const projectRoot = process.cwd();
        const packageJsonPath = path.join(projectRoot, 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
            spinner.fail(chalk.red("❌ 'package.json' not found in the current directory. Cannot create sandbox without a project."));
            return;
        }

        tempDir = createTempDir();
        spinner.text = chalk.cyan(`Copying project files to temporary sandbox: ${tempDir}`);
        await fsExtra.copy(projectRoot, tempDir, {
            filter: (src) => {
                const basename = path.basename(src);
                return basename !== 'node_modules' && basename !== '.git' && basename !== '.vscode' && basename !== 'temp' && basename !== 'build' && basename !== '.DS_Store';
            }
        });

        const packageManager = forcePackageManager || detectPackageManager(tempDir);
        let installCommand = `${packageManager} install`;
        if (!installDevDependencies) {
            installCommand += ' --production';
        }
        installCommand += ' --silent';

        spinner.text = chalk.cyan(`Installing dependencies in sandbox using ${packageManager}...`);
        try {
            await execAsync(installCommand, { cwd: tempDir, maxBuffer: 50 * 1024 * 1024 });
        } catch (installError) {
            spinner.fail(chalk.red(`❌ Failed to install dependencies in sandbox: ${installError.message}`));
            if (installError.stdout) console.error(chalk.red(installError.stdout));
            if (installError.stderr) console.error(chalk.red(installError.stderr));
            throw new Error("Dependency installation failed.");
        }

        spinner.succeed(chalk.cyan(`✅ Neko's sandbox environment is ready at: ${tempDir}`));

        fs.writeFileSync(SANDBOX_STATE_FILE, JSON.stringify({
            tempDir,
            projectRoot,
            packageManager,
            keepTempDir
        }));

        if (initialCommand.length > 0) {
            spinner.info(chalk.cyan(`Running initial command in sandbox: "${initialCommand.join(' ')}"`));
            try {
                await executeArbitraryCommandInSandbox(initialCommand.join(' '), tempDir, false);
                spinner.succeed(chalk.cyan("Initial command completed."));
            } catch (cmdError) {
                spinner.fail(chalk.red(`❌ Initial command failed: ${cmdError.message}`));
            } finally {
                if (!keepTempDir) {
                    await destroySandbox(ora(), tempDir);
                } else {
                    console.log(chalk.cyan(`Sandbox directory kept for inspection: ${tempDir}`));
                }
                if (fs.existsSync(SANDBOX_STATE_FILE)) {
                    fs.unlinkSync(SANDBOX_STATE_FILE);
                }
            }
            return;
        }

        await enterInteractiveSandboxMode(tempDir, packageManager, keepTempDir);

    } catch (error) {
        spinner.fail(chalk.red(`\n💥 Neko's sandbox encountered an error: ${error.message}`));
        if (error.stdout) process.stdout.write(chalk.red(error.stdout));
        if (error.stderr) process.stderr.write(chalk.red(error.stderr));
        if (tempDir && fs.existsSync(tempDir) && !keepTempDir) {
            await fsExtra.remove(tempDir).catch(e => console.error(chalk.red(`Failed to clean up temp directory: ${e.message}`)));
        }
        if (fs.existsSync(SANDBOX_STATE_FILE)) {
            fs.unlinkSync(SANDBOX_STATE_FILE);
        }
        process.exit(1);
    }
};

async function executeArbitraryCommandInSandbox(command, cwd, maintainInteractive = true) {
    return new Promise((resolve, reject) => {
        const shell = os.platform() === 'win32' ? 'cmd.exe' : '/bin/sh';
        const shellArgs = os.platform() === 'win32' ? ['/c', command] : ['-c', command];

        const child = spawn(shell, shellArgs, { cwd: cwd, stdio: 'pipe' });

        let stdoutBuffer = '';
        let stderrBuffer = '';

        child.stdout.on('data', (data) => {
            process.stdout.write(data);
            stdoutBuffer += data.toString();
        });

        child.stderr.on('data', (data) => {
            process.stderr.write(chalk.red(data));
            stderrBuffer += data.toString();
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                const errorMessage = stderrBuffer || stdoutBuffer || `Command exited with code ${code}.`;
                if (maintainInteractive) {
                    console.log(chalk.red(`\n❌ Command failed: ${errorMessage.trim()}`));
                    resolve();
                } else {
                    reject(new Error(errorMessage.trim()));
                }
            }
        });

        child.on('error', (err) => {
            const errorMessage = `Failed to execute command. Is it installed and in PATH? ${err.message}`;
            process.stderr.write(chalk.red(`\n❌ ${errorMessage}\n`));
            if (maintainInteractive) {
                resolve();
            } else {
                reject(new Error(errorMessage));
            }
        });
    });
}

async function enterInteractiveSandboxMode(tempDir, packageManager, initialKeepTempDir) {
    let currentSandboxCwd = tempDir;
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: getSandboxPrompt(tempDir, currentSandboxCwd)
    });

    const showPrompt = () => {
        rl.pause();
        rl.resume();
        rl.prompt();
    };

    const sigIntHandler = () => {
        console.log(chalk.cyan("\n\nType 'sandbox destroy' to exit and remove the sandbox."));
        console.log(chalk.cyan("Type 'sandbox open' to open the sandbox directory."));
        showPrompt();
    };

    process.on('SIGINT', sigIntHandler);

    console.log(chalk.bgCyan(chalk.white("\n --- Entering Neko Sandbox Interactive Mode --- ")));
    console.log(chalk.cyan(" 📦 Welcome to your isolated environment."));
    console.log(chalk.cyan(" 🧹 Use 'sandbox destroy' to exit and clean up the sandbox."));
    console.log(chalk.cyan(" 📂 Use 'sandbox open' to view the sandbox directory."));
    console.log(chalk.cyan(` 🎯 Sandbox base path: ${tempDir}`));
    if (os.platform() === 'win32') {
        console.log(chalk.cyan(" 💡 Tip: On Windows, use 'dir' instead of 'ls', and 'type' instead of 'cat'."));
    }
    console.log(chalk.bgCyan(chalk.white(" ---------------------------------------------- ")));
    console.log("");
    showPrompt();

    let isDestroying = false;
    rl.on('line', async (line) => {
        const fullCommand = line.trim();
        const [command, ...args] = fullCommand.split(' ');

        if (fullCommand.length === 0) {
            showPrompt();
            return;
        }

        if (command === 'sandbox') {
            const subCommand = args[0];
            if (subCommand === 'destroy') {
                isDestroying = true;
                const spinner = ora(chalk.cyan("Destroying sandbox...")).start();
                await destroySandbox(spinner, tempDir);
                spinner.succeed(chalk.cyan("Sandbox destroyed. Exiting."));
                rl.close();
                return;
            } else if (subCommand === 'open') {
                const spinner = ora(chalk.cyan("Opening sandbox directory...")).start();
                try {
                    await open(tempDir);
                    spinner.succeed(chalk.cyan(`📂 Opened sandbox directory: ${tempDir}`));
                } catch (openError) {
                    spinner.fail(chalk.red(`❌ Failed to open sandbox directory: ${openError.message}`));
                }
                showPrompt();
                return;
            } else {
                console.log(chalk.yellow(`⚠️ Unknown 'sandbox' subcommand: ${subCommand}`));
                console.log(chalk.cyan("Available 'sandbox' subcommands: destroy, open"));
                showPrompt();
                return;
            }
        }

        if (command === 'cd') {
            const targetPath = args[0] || '~';
            let newCwd;
            if (targetPath === '~' || targetPath === '/') {
                newCwd = tempDir;
            } else {
                newCwd = path.resolve(currentSandboxCwd, targetPath);
            }

            if (!newCwd.startsWith(tempDir)) {
                console.log(chalk.red(`❌ Cannot 'cd' outside of the sandbox environment.`));
            } else if (!fs.existsSync(newCwd) || !fs.lstatSync(newCwd).isDirectory()) {
                console.log(chalk.red(`❌ Directory not found: ${targetPath}`));
            } else {
                currentSandboxCwd = newCwd;
            }
            rl.setPrompt(getSandboxPrompt(tempDir, currentSandboxCwd));
            showPrompt();
            return;
        }

        try {
            await executeArbitraryCommandInSandbox(fullCommand, currentSandboxCwd, true);
        } catch (error) {
            console.log(chalk.red(`\n❌ Error executing command: ${error.message}`));
        } finally {
            showPrompt();
        }
    }).on('close', async () => {
        process.removeListener('SIGINT', sigIntHandler);
        console.log(chalk.bgCyan(chalk.white("\n --- Exited Neko Sandbox Interactive Mode --- ")));
        if (!isDestroying && !initialKeepTempDir) {
            const cleanupSpinner = ora();
            await destroySandbox(cleanupSpinner, tempDir);
        } else if (!isDestroying && initialKeepTempDir) {
            console.log(chalk.cyan(`Sandbox directory kept for inspection: ${tempDir}`));
        }
        process.exit(0);
    });
}