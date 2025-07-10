#!/usr/bin/env node
import chalk from "chalk";
import { exec } from "child_process";
const execAsync = promisify(exec);
import { promisify } from "util";
import readline from "readline";
import ora from "ora";

import { handleInitCommand } from "./commands/init.js";
import { handleAddCommand } from "./commands/add.js";
import { handleRemoveCommand } from "./commands/remove.js";
import { handleInstallCommand } from "./commands/install.js";
import { handleAllCommand } from "./commands/all.js";
import { handleFlushCommand } from "./commands/flush.js";
import { handlePublishCommand } from "./commands/publish.js";
import { handleOutdatedCommand } from "./commands/outdated.js";
import { handleAnalyzeCommand } from "./commands/analyze.js";
import { handleAuditCommand } from "./commands/audit.js";
import { handleSeccheckCommand } from "./commands/seccheck.js";
import { handleDoctorCommand } from "./commands/doctor.js";
import { handleCompatibilityCommand } from "./commands/compatibility.js";
import { handleStructCommand } from "./commands/struct.js";
import { handleBackupCommand } from "./commands/backup.js";
import { handlePruneCommand } from "./commands/prune.js";
import { handleCleanCommand } from "./commands/clean.js";
import { handleListCommand } from "./commands/list.js";
import { handleLicensesCommand } from "./commands/licenses.js";
import { handleBinCommand } from "./commands/bin.js";
import { handleInfoCommand } from "./commands/info.js";
import { handleLanguagesCommand } from "./commands/languages.js";
import { handleCheckerrorsCommand } from "./commands/checkerrors.js";
import { handleUpdateCommand } from "./commands/update.js";
import { handleHelpCommand } from "./commands/help.js";
import { handleVersionCommand } from "./commands/version.js";
import { handleStaleCommand } from './commands/stale.js';
import { handleSandboxCommand } from './commands/sandbox.js';

const args = process.argv.slice(2);
const command = args[0];
let subCommand = null;
const packageNames = [];
const options = [];
if (command) {
  let currentArgIndex = 1;
  if (
    (command === "publish" || command === "flush") &&
    args[currentArgIndex] &&
    !args[currentArgIndex].startsWith("-")
  ) {
    subCommand = args[currentArgIndex];
    currentArgIndex++;
  }
  for (let i = currentArgIndex; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("-")) {
      options.push(arg);
    } else {
      packageNames.push(arg);
    }
  }
}

const nekoCLIOutdatedVersion = async () => {
  try {
    const latestVersionPromise = execAsync("npm show neko-cli version");

    const installedVersionOutput = await execAsync(
      "npm list -g neko-cli --depth=0"
    );
    const installedVersion =
      installedVersionOutput.stdout.match(/neko-cli@([^\s]+)/)?.[1];

    if (!installedVersion) {
      console.log(chalk.yellow("❌ neko-cli is not installed globally."));
      return;
    }

    const latestVersion = await latestVersionPromise;
    const cleanLatestVersion = latestVersion.stdout.trim();

    if (installedVersion !== cleanLatestVersion) {
      console.log(chalk.cyan("A new version of `neko-cli` is available."));
      await updateNekoCLI();
    }
  } catch (error) {
    console.error(
      chalk.yellow("❌ Error while checking for outdated neko-cli version:"),
      error.message
    );
  }
};

async function getGitHubReleaseChangelog(owner, repo, version) {
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/v${version}`);
        if (!response.ok) {
            const latestResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
            const latestRelease = await latestResponse.json();
            return latestRelease.body || `No changelog provided for latest release v${latestRelease.tag_name}.`;
        }
        const release = await response.json();
        return release.body || `No changelog provided for version v${version}.`;
    } catch (error) {
        return `Failed to fetch changelog from GitHub: ${error.message}`;
    }
}

const updateNekoCLI = async () => {
    const owner = "Neko-CLI";
    const repo = "Neko-CLI";

    try {
        const spinnerCurrent = ora(chalk.cyan("Checking current neko-cli version...")).start();
        const { stdout: currentVersionOutput } = await execAsync("npm list -g neko-cli --depth=0");
        const installedVersionMatch = currentVersionOutput.match(/neko-cli@([^\s]+)/);
        const installedVersion = installedVersionMatch ? installedVersionMatch[1] : null;
        spinnerCurrent.stop();

        if (!installedVersion) {
            console.log(chalk.yellow("❌ neko-cli is not installed globally."));
            return;
        }

        console.log(chalk.cyan(`Current installed version: ${installedVersion}`));

        const spinnerLatest = ora(chalk.cyan("Checking for latest available version...")).start();
        const { stdout: latestVersionOutput } = await execAsync("npm show neko-cli version");
        const cleanLatestVersion = latestVersionOutput.trim();
        spinnerLatest.stop();

        console.log(chalk.cyan(`Latest available version: ${cleanLatestVersion}`));

        if (installedVersion === cleanLatestVersion) {
            console.log(chalk.cyan("✨ Your `neko-cli` is already up to date."));
            console.log(chalk.cyan("\n--- Version Information ---"));
            console.log(chalk.cyan("For details on changes and features in this version, visit:"));
            console.log(chalk.cyan(`🔗 https://github.com/${owner}/${repo}/releases`));
            console.log(chalk.cyan("---------------------------\n"));
            return;
        }

        console.log(chalk.cyan("\n--- Changelog and New Features ---"));
        const changelogSpinner = ora(chalk.cyan(`Fetching changelog for v${cleanLatestVersion}...`)).start();
        const changelog = await getGitHubReleaseChangelog(owner, repo, cleanLatestVersion);
        changelogSpinner.succeed(chalk.cyan("Changelog retrieved:"));
        console.log(chalk.white(changelog));
        console.log(chalk.cyan("----------------------------------\n"));


        const response = await new Promise((resolve) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });

            rl.question(
                chalk.cyan(
                    "A new version is available. Do you want to update neko-cli? (y/n) > "
                ),
                (answer) => {
                    rl.close();
                    resolve(answer.toLowerCase());
                }
            );
        });

        if (response === "y") {
            const updateSpinner = ora(chalk.cyan("⏳ Updating neko-cli...")).start();
            try {
                await execAsync("npm install -g neko-cli --silent");
                updateSpinner.succeed(chalk.cyan("✅ `neko-cli` has been successfully updated."));
            } catch (updateError) {
                updateSpinner.fail(chalk.red(`❌ Failed to update neko-cli: ${updateError.message}`));
                console.error(chalk.red(`   ${updateError.stderr || updateError.stdout}`));
            }
        } else {
            console.log(chalk.yellow("❌ Skipped updating `neko-cli`."));
        }
    } catch (error) {
        console.error(
            chalk.red("❌ An error occurred during neko-cli update process:"),
            error.message
        );
        if (error.stderr) console.error(chalk.red(`   Error details: ${error.stderr}`));
        else if (error.stdout) console.error(chalk.red(`   Output details: ${error.stdout}`));
    }
};

const runCommand = async () => {
  switch (command) {
    case "init":
      nekoCLIOutdatedVersion();
      await handleInitCommand(args);
        break;
    case "add":
      nekoCLIOutdatedVersion();
      await handleAddCommand(args);
      break;
    case "remove":
      nekoCLIOutdatedVersion();
      await handleRemoveCommand(args);
      break;
    case "meow":
      nekoCLIOutdatedVersion();
      await handleInstallCommand();
      break;
    case "all":
      nekoCLIOutdatedVersion();
      await handleAllCommand();
      break;
    case "dev":
      nekoCLIOutdatedVersion();
      await handleFlushCommand(['flush', 'dev']);
      break;
    case "flush":
      nekoCLIOutdatedVersion();
      await handleFlushCommand(args);
      break;
    case "publish":
      nekoCLIOutdatedVersion();
      await handlePublishCommand(subCommand, options);
      break;
    case "outdated":
      nekoCLIOutdatedVersion();
      await handleOutdatedCommand();
      break;
    case "analyze":
      nekoCLIOutdatedVersion();
      await handleAnalyzeCommand();
      break;
    case "audit":
      nekoCLIOutdatedVersion();
      await handleAuditCommand();
      break;
    case "seccheck":
      nekoCLIOutdatedVersion();
      await handleSeccheckCommand();
      break;
    case "doctor":
      nekoCLIOutdatedVersion();
      await handleDoctorCommand();
      break;
    case "compatibility":
      nekoCLIOutdatedVersion();
      await handleCompatibilityCommand();
      break;
    case "struct":
      nekoCLIOutdatedVersion();
      await handleStructCommand();
      break;
    case "backup":
      nekoCLIOutdatedVersion();
      await handleBackupCommand();
      break;
    case "prune":
      nekoCLIOutdatedVersion();
      await handlePruneCommand();
      break;
    case "clean":
      nekoCLIOutdatedVersion();
      await handleCleanCommand();
      break;
    case "list":
      nekoCLIOutdatedVersion();
      await handleListCommand();
      break;
    case "licenses":
      nekoCLIOutdatedVersion();
      await handleLicensesCommand();
      break;
    case "bin":
      nekoCLIOutdatedVersion();
      await handleBinCommand().then((binaryPath) => {
          if (binaryPath) {
          } else {
            console.log("❌ No binary found.");
          }
        });;
      break;
    case "info":
      nekoCLIOutdatedVersion();
      await handleInfoCommand(packageNames[0]);
      break;
    case "languages":
      nekoCLIOutdatedVersion();
      await handleLanguagesCommand();
      break;
    case "checkerrors":
      nekoCLIOutdatedVersion();
      await handleCheckerrorsCommand();
      break;
    case "update":
      nekoCLIOutdatedVersion();
      await handleUpdateCommand();
      break;
    case "help":
      nekoCLIOutdatedVersion();
      await handleHelpCommand();
      break;
    case "version":
      nekoCLIOutdatedVersion();
      await handleVersionCommand();
      break;
    case "stale":
      nekoCLIOutdatedVersion();
      await handleStaleCommand(args.slice(1));
      break;
    case "sandbox":
      nekoCLIOutdatedVersion();
      await handleSandboxCommand(args.slice(1));
      break;
    default:
      nekoCLIOutdatedVersion();
      console.log(
        chalk.yellow(
          `⚠️ Invalid command use "meow help" to see available commands.`
        )
      );
      break;
  }
};
runCommand();