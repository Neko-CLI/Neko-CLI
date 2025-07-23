import chalk from "chalk";
import { spawn } from "child_process";
import ora from "ora";
import chokidar from "chokidar";
import path from "path";
import fs from "fs";

function formatTimestamp() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${chalk.cyan("[")}${chalk.cyan.bold("⏰")}${chalk.cyan(
        ` ${hours}:${minutes}:${seconds}`
    )}${chalk.cyan("]")}`;
}

let childProcess = null;
let watcher = null;
let spinnerInstance = null;
let restartDebounceTimeout = null;

const runScriptWithCatsFramework = async (scriptName) => {
    if (!scriptName || typeof scriptName !== 'string' || scriptName.trim() === '') {
        console.error(chalk.yellow("❌ Invalid or missing script name. Please provide a valid script to run."));
        return;
    }

    const projectRoot = process.cwd();
    const packageJsonPath = path.join(projectRoot, 'package.json');
    let watchPaths = [path.join(projectRoot, '**/*.js'), path.join(projectRoot, '**/*.mjs')];
    let ignoredPaths = [
        path.join(projectRoot, 'node_modules'),
        path.join(projectRoot, '.git'),
        path.join(projectRoot, 'dist'),
        path.join(projectRoot, 'build')
    ];

    spinnerInstance = ora({
        text: chalk.cyan("Initializing Neko-CLI for 'dev' mode..."),
        spinner: "dots",
        color: "cyan",
    }).start();

    if (fs.existsSync(packageJsonPath)) {
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            if (packageJson.nekoCLI && packageJson.nekoCLI.flush) {
                const flushConfig = packageJson.nekoCLI.flush;
                if (flushConfig.watch && Array.isArray(flushConfig.watch)) {
                    watchPaths = flushConfig.watch.map(p => path.join(projectRoot, p));
                    spinnerInstance.text = chalk.cyan(`📦 Loading custom watch paths...`);
                }
                if (flushConfig.ignore && Array.isArray(flushConfig.ignore)) {
                    ignoredPaths = flushConfig.ignore.map(p => path.join(projectRoot, p));
                    spinnerInstance.text = chalk.cyan(`🚫 Loading custom ignore paths...`);
                }
            }
        } catch (error) {
            spinnerInstance.warn(chalk.yellow(`⚠️ Warning: Could not parse 'nekoCLI.flush' config in package.json: ${error.message}`));
        }
    }

    const stopPreviousScript = async () => {
        if (childProcess) {
            spinnerInstance.info(`${formatTimestamp()} ${chalk.cyan("Stopping previous process...")}`);
            childProcess.kill("SIGTERM");
            return new Promise(resolve => {
                const timeout = setTimeout(() => {
                    spinnerInstance.warn(chalk.red(`⚠️ Previous process did not close in time. Forcing termination.`));
                    if (childProcess) childProcess.kill("SIGKILL");
                    resolve();
                }, 5000);
                childProcess.on("close", (code) => {
                    clearTimeout(timeout);
                    resolve();
                });
                childProcess.on("error", (error) => {
                    clearTimeout(timeout);
                    spinnerInstance.error(chalk.red(`Error stopping process: ${error.message}`));
                    resolve();
                });
            }).finally(() => {
                childProcess = null;
            });
        }
        return Promise.resolve();
    };

    const startScript = async () => {
        await stopPreviousScript();
        spinnerInstance.text = chalk.hex('#FFD700')(`▶️ Starting script "${chalk.hex('#FFD700').bold(scriptName)}"...`);
        spinnerInstance.color = "yellow";

        childProcess = spawn("npm", ["run", scriptName], {
            stdio: "inherit",
            shell: true,
            cwd: projectRoot,
        });

        childProcess.on("close", (code) => {
            if (!restartDebounceTimeout) {
                if (code === 0) {
                    spinnerInstance.succeed(chalk.green(`✅ Script "${chalk.green.bold(scriptName)}" exited successfully (code ${code}).`));
                } else {
                    spinnerInstance.fail(chalk.red(`❌ Script "${chalk.red.bold(scriptName)}" exited with error (code ${code}).`));
                }
                spinnerInstance.start(chalk.cyan("Waiting for changes..."));
                spinnerInstance.color = "cyan";
            } else {
                 spinnerInstance.info(chalk.cyan("Script exited. Preparing for next restart..."));
            }
            childProcess = null;
        });

        childProcess.on("error", (error) => {
            spinnerInstance.fail(chalk.red(`💥 Failed to start script "${scriptName}": ${error.message}`));
            childProcess = null;
            if (!restartDebounceTimeout) {
                spinnerInstance.start(chalk.cyan("Waiting for changes..."));
                spinnerInstance.color = "cyan";
            }
        });
    };

    const scheduleRestart = (event, filePath) => {
        if (restartDebounceTimeout) {
            clearTimeout(restartDebounceTimeout);
        }

        spinnerInstance.stopAndPersist({
            symbol: chalk.hex('#FFA500')("🚀"),
            text: chalk.hex('#FFA500')(`File modified: ${chalk.hex('#FFA500').bold(path.relative(projectRoot, filePath))} (${event}) - Scheduling restart...`)
        });

        restartDebounceTimeout = setTimeout(async () => {
            restartDebounceTimeout = null;
            await startScript();
        }, 500);
    };

    spinnerInstance.text = chalk.cyan("Setting up file watcher...");
    spinnerInstance.color = "cyan";

    watcher = chokidar.watch(watchPaths, {
        ignored: ignoredPaths,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 100,
            pollInterval: 50
        }
    });

    watcher
        .on('add', (path) => scheduleRestart('added', path))
        .on('change', (path) => scheduleRestart('changed', path))
        .on('unlink', (path) => scheduleRestart('deleted', path))
        .on('error', (error) => spinnerInstance.fail(chalk.red(`Watcher error: ${error}`)))
        .on('ready', () => {
            spinnerInstance.succeed(chalk.green(`√ Watcher ready! Monitoring: ${chalk.bold(watchPaths.map(p => path.relative(projectRoot, p)).join(', '))}`));
            console.log(chalk.gray(`(Ignoring: ${ignoredPaths.map(p => path.relative(projectRoot, p)).join(', ')})`));
            startScript();
        });

    const handleExit = async (signal) => {
        spinnerInstance.info(`\n${formatTimestamp()} ${chalk.yellow(`👋 Detected ${signal}. Shutting down Neko-CLI 'dev'...\n`)}`);
        if (restartDebounceTimeout) {
            clearTimeout(restartDebounceTimeout);
        }
        await stopPreviousScript();
        if (watcher) {
            await watcher.close();
        }
        if (spinnerInstance) {
            spinnerInstance.stop();
        }
        process.exit(0);
    };

    process.on('SIGINT', () => handleExit('Ctrl+C'));
    process.on('SIGTERM', () => handleExit('SIGTERM'));
};

export const handleFlushCommand = async (args) => {
    const scriptName = args[1];
    if (!scriptName) {
        console.error(chalk.yellow("❌ Error: Missing script name for 'dev' command."));
        console.log(chalk.cyan("Usage: meow dev <script_name>"));
        return;
    }
    await runScriptWithCatsFramework(scriptName);
};