<div align="center">
    <h1>Neko CLI 🐾</h1>
    <img src="https://i.imgur.com/iE1Y9mT.png" alt="Neko-CLI" style="width: 200px; height: auto;">
    <br>
    <a href="https://github.com/UnStackss/Neko-CLI/network/members" style="text-decoration: none;">
        <img src="https://img.shields.io/github/forks/UnStackss/Neko-CLI?style=for-the-badge" alt="Forks" style="margin: 5px;">
    </a>
    <a href="https://github.com/UnStackss/Neko-CLI/stargazers" style="text-decoration: none;">
        <img src="https://img.shields.io/github/stars/UnStackss/Neko-CLI?style=for-the-badge" alt="Stars" style="margin: 5px;">
    </a>
    <a href="https://github.com/UnStackss/Neko-CLI/issues" style="text-decoration: none;">
        <img src="https://img.shields.io/github/issues/UnStackss/Neko-CLI?style=for-the-badge" alt="Issues" style="margin: 5px;">
    </a>
    <a href="https://github.com/UnStackss/Neko-CLI/graphs/contributors" style="text-decoration: none;">
        <img src="https://img.shields.io/github/contributors/UnStackss/Neko-CLI?style=for-the-badge" alt="Contributors" style="margin: 5px;">
    </a>
</div>


## Codebreaker Challenge: Unleash the Secrets! 🕵️‍♂️

If you manage to deobfuscate this puzzle, send me the content by email to receive the source of the code for free. It’s your chance to unlock the secrets of the code and see how it works behind the scenes.

<div align="center">

  [![Neko-CLI Codebreaker: Unleash the Secrets!](https://img.shields.io/badge/Codebreaker%20Challenge-Start%20Puzzle-3a4a6b?style=for-the-badge&logo=github&logoColor=white)](https://neko.full-stack.dev/p/cli/j9g16foyfc)
  
  [![Visit Neko-CLI GitHub](https://img.shields.io/badge/Visit%20GitHub%20Repo-3a4a6b?style=for-the-badge&logo=github&logoColor=white)](https://github.com/UnStackss/Neko-CLI)
</div>



**Neko CLI** is a whimsical command-line utility that lets you manage your npm and yarn packages with ease and fun, embodying the charming essence of a cat ('neko' in Japanese). With Neko CLI, you can add or remove packages, initialize projects, and more, all through a delightful user interface.


🐾 **neko.rock** - The Native Package Manager of Neko CLI

`neko.rock` is the beating heart of **Neko CLI**, a lock file that tracks packages and their versions for each project managed. It functions as a dedicated dependency manager, much like `package.json` in npm, but with a fun feline twist. Every package added via Neko CLI is recorded in `neko.rock`, allowing you to easily manage your project's dependencies.

The `neko.rock` file contains detailed information about the packages, including version, integrity, and dependency type (runtime or dev), providing a more organized and enjoyable experience for managing packages. With `neko.rock`, you'll always have full control over your dependencies in a simple and intuitive way!

---

This addition should give your users a clear understanding of how `neko.rock` works within Neko CLI.

# **Performances of Neko-CLI**

Neko-CLI is an incredibly **fast** and **powerful** tool, built with efficiency at its core. Whether you're working on a small project or a large-scale application, Neko-CLI is designed to **maximize your productivity** by ensuring lightning-fast execution and seamless operation.

### 🚀 **Speed at Its Best**

- Neko-CLI executes commands **at blazing speeds**, ensuring that your tasks are completed in the shortest possible time.
- The tool utilizes optimized processes that leverage **advanced caching mechanisms** and **asynchronous operations**, ensuring that every action is as quick as possible.
- Every aspect of Neko-CLI is meticulously designed to minimize latency, from reading files to processing data. It operates like a finely tuned machine that gets things done **faster than ever**.

### ⚡ **Powerful Performance with Every Command**

- Neko-CLI doesn't just stop at speed – it packs an **immense amount of power** under the hood. Whether you're managing a complex directory structure, automating tasks, or executing custom scripts, it handles it all effortlessly.
- The tool is **lightweight** yet highly capable, providing a fast user experience without compromising on performance.

### 📦 **Automatic Package Installation for Ultimate Performance**

- Neko-CLI goes the extra mile to ensure that **every package is installed automatically**, optimizing your environment for **maximum performance**. You never have to worry about missing dependencies or outdated packages; Neko-CLI takes care of it all.
- **Smart package management** is built in – whenever you run a command, Neko-CLI will ensure the necessary packages are installed, updated, and configured for optimal efficiency. It ensures that you're always working with the latest versions of the tools you need.
- **Always up-to-date**, Neko-CLI automatically checks for updates to both its internal components and external packages, ensuring you're always working with the most efficient versions available.

### 💨 **Faster Than You Can Imagine**

- From initial setup to complex tasks, everything runs in **real-time** without any noticeable lag.
- The tool is built for developers who **demand speed**, and it **delivers** on every level – **no delays, no waiting**.
- Whether you're running scripts, managing projects, or organizing files, **Neko-CLI ensures that your workflow is as fast as possible**.

### 🚀 **Unmatched Performance, Unbeatable Speed**

In conclusion, **Neko-CLI** is not just a tool; it's a **performance powerhouse** that ensures your development process is faster, smoother, and more efficient than ever before. 
With Neko-CLI, you're not just getting a tool – you're getting a **performance-optimized experience** that delivers **speed, power, and productivity** like never before.

Start using Neko-CLI and experience the future of fast, efficient, and automated development!


## Features 🌟

- **Add Packages**: Quickly install npm or yarn packages in your project.
- **Remove Packages**: Effortlessly uninstall packages with a single command.
- **Initialize Project**: Create a structured `package.json` file for your project in one go.
- **Interactive CLI**: Enjoy an animated and user-friendly CLI experience.
- **Script Execution**: Run scripts in your project with ease.
- **Package Management**: Handles both dependencies and development dependencies smoothly.
- **Project Directory Tree**: Visual representation of your project structure.
- **Image Display**: Offers a cute cat image to brighten your day upon successful package installations.

## Installation 📦

### 1. Install the package globally

You can install `neko-cli` globally on your system using your preferred package manager:

```bash
npm install -g neko-cli
# OR
yarn global add neko-cli
```

## Usage Commands 🐈

Here are the commands you can use with Neko CLI:

- **meow init [--skip (skip questions)] [-y (skip questions)]**: Initialize a new project. 🌱
- **meow add `<pkg1..pkg2...>` [-g (global)] [--dev (development)]**: Add a specified package to the project. 📦
- **meow remove `<pkg1..pkg2...>` [-g (global)] [--dev (development)]**: Remove a specified package from the project. ❌
- **meow meow**: Install dependencies listed in `meow.rock` or `package.json` or `yarn.lock`. 🐱
- **meow all**: Install all packages listed in `meow.rock` or `package.json` or `yarn.lock`. ⚙️
- **meow flush `<script>`**: Run a specified script from your project. 🔄
- **meow dev**: Flush the dev script if it exists. 🔧
- **meow struct**: Predict the structure of the code and save it in a `meow-structure.yml`. 🗂️
- **meow publish `<npm, yarn, meow>`**: Publish a package to the cloud. ☁️
- **meow outdated**: Check and automatically update outdated packages. 🔄
- **meow backup**: Create a `meow-project-backup.zip` (ignores `.git`, `node_modules`, `temp`, and `build`). 💾
- **meow analyze**: Analyze dependencies and generate a bundle size report. 📊
- **meow audit**: Checks dependencies, identifies outdated versions, and suggests updates. 🔍
- **meow seccheck**: Scans project dependencies for known security vulnerabilities and reports any outdated or insecure versions. 🔒
- **meow prune**: Remove unnecessary dependencies and clean up unused packages. 🧹
- **meow list**: List all installed dependencies for the current project. 📜
- **meow doctor**: Check for common project issues. 🩺
- **meow bin**: Get the path to installed binaries (node). 🔍
- **meow info `<pkg>`**: Fetch detailed information about a package (e.g., name, version, etc..) 🔍
- **meow licenses**: List all licenses for installed packages in the current project. ⚖️
- **meow languages**: Lists detected programming languages and files in a project. 📜
- **meow checkerrors**: Detect and list errors into the code. 👾
- **meow clean**: Clean the project by removing logs, backups, and other unused files. 🧹
- **meow compatibility**: Check if dependencies are compatible with the current Node.js version. 🧑‍💻
- **meow update**: Checks and updates neko-cli if a newer version exists. 📈
- **meow help**: Display a detailed help message. ❓
- **meow version**: Show the current version of the CLI. 🧬


## Features in Detail 📖

### Project Initialization

When you run the init command, Neko CLI guides you through the process of creating a `package.json` file, asking for your project's name, version, author, and whether you want to use `nodemon` for development. It creates a friendly project structure ready for you to start coding.

### Package Management

Whether you want to add or remove packages, Neko CLI ensures that the correct commands are run under the hood. It keeps your project up to date and allows you to view your current project structure visually.

### Interactive Experience

With animations, colorful feedback, and vital information displayed at every step, the CLI is designed to be engaging and straightforward, making even mundane package management a delightful experience.

### Help System

If you ever find yourself lost, simply run:

```bash
meow help
```

This will display a comprehensive list of commands and options available.

## Conclusion 🐈‍⬛

Experience the joy of package management with **Neko CLI**! With its fun, intuitive approach, managing your npm and yarn packages has never been more enjoyable. Whether you're a beginner or a seasoned developer, Neko CLI makes the process simple and engaging. 

Feel free to dive into the code and contribute to making Neko CLI even purr-fect! 🐾