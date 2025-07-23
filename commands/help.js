import chalk from "chalk";
import moment from "moment-timezone";
async function getPackageVersion() {
  try {
    const response = await fetch("https://registry.npmjs.org/neko-cli");
    const data = await response.json();
    return data["dist-tags"].latest;
  } catch (err) {
    console.error(
      chalk.yellow("Error fetching version from meow registry:", err)
    );
    return "unknown";
  }
}
export const handleHelpCommand = async () => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const currentTime = moment().tz(userTimezone).format("HH:mm:ss");
  const version = await getPackageVersion();
  const newChip = chalk.bgCyan.white.bold(" NEW ");
  console.log(
    chalk.cyan(`
🐈 NEKO-CLI - Your Paw-some Project Companion! 🐾
==============================================
📅 Current Time: ${chalk.white(currentTime)} (${chalk.white(userTimezone)})
📦 CLI Version:  ${chalk.cyan(version)}
✨ Core Commands:
  - ${chalk.cyan("meow init [--skip] [-y]")}        : Initialize project. 🌱
  - ${chalk.cyan("meow add <pkg1..> [-g] [--dev]")} : Add packages. 📦
  - ${chalk.cyan("meow remove <pkg1..> [-g] [--dev]")}: Remove packages. ❌
  - ${chalk.cyan("meow meow")}                      : Install dependencies. 🐱
  - ${chalk.cyan("meow all")}                       : Install all packages. ⚙️
  - ${chalk.cyan("meow dev")}                       : Run the development script. 🔧
🚀 Script & Publishing:
  - ${chalk.cyan("meow flush <script-name>")}     : Run scripts with cats framework. 🐾
  - ${chalk.cyan("meow publish <npm|yarn|meow>")}: Publish to cloud. ☁️
📊 Project Health & Analysis:
  - ${chalk.cyan("meow outdated")}                : Check and update outdated packages. 🔄
  - ${chalk.cyan("meow analyze")}                 : Analyze dependencies & bundle size. 📊
  - ${chalk.cyan("meow audit")}                   : Check for outdated versions & suggest updates. 🔍
  - ${chalk.cyan("meow seccheck")}                : Scan for known vulnerabilities. 🔒
  - ${chalk.cyan("meow doctor")}                  : Check for common project issues. 🩺
  - ${chalk.cyan("meow compatibility")}           : Check dependency compatibility with Node.js. 🧑‍💻
  - ${chalk.cyan("meow stale")}                   : Check for unmaintained/inactive dependencies. ⏳
  - ${chalk.cyan("meow sandbox")}                 : Enter an isolated, temporary project environment. 📦
🗄️ Utilities & Maintenance:
  - ${chalk.cyan("meow struct")}                  : Save code structure to meow-structure.yml. 🗂️
  - ${chalk.cyan("meow backup")}                  : Create project backup. 💾
  - ${chalk.cyan("meow prune")}                   : Remove unnecessary dependencies. 🧹
  - ${chalk.cyan("meow clean")}                   : Remove logs, backups, and unused files. 🧹
📜 Info & Listings:
  - ${chalk.cyan("meow list")}                    : List all installed dependencies. 📜
  - ${chalk.cyan("meow licenses")}                : List all package licenses. ⚖️
  - ${chalk.cyan("meow bin")}                     : Get path to installed binaries. 🔍
  - ${chalk.cyan("meow info <pkg>")}              : Fetch detailed package info. 🔍
  - ${chalk.cyan("meow languages")}               : List detected languages & files. 📜
  - ${chalk.cyan("meow checkerrors")}             : Detect and list code errors. 👾
✨ CLI Management:
  - ${chalk.cyan("meow update")}                  : Update Meow CLI. 📈
  - ${chalk.cyan("meow help")}                    : Show this help guide. ❓
  - ${chalk.cyan("meow version")}                 : Show current CLI version. 🧬
For more information, visit our website: ${chalk.underline.cyan(
      "https://neko-cli.com/"
    )}
Developed by Thomas Garau: ${chalk.underline.cyan(
      "https://github.com/StrayVibes"
    )}
==============================================
    `)
  );
};