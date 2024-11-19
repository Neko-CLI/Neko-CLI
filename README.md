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

**Neko CLI** is a whimsical command-line utility that lets you manage your npm and yarn packages with ease and fun, embodying the charming essence of a cat ('neko' in Japanese). With Neko CLI, you can add or remove packages, initialize projects, and more, all through a delightful user interface.

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

- **init**: Initialize a new project.
- **add `<pkg>`**: Add a specified package to the project.
- **remove `<pkg>`**: Remove a specified package from the project.
- **meow**: Install dependencies listed in `package.json` or `yarn.lock`.
- **all**: Install all packages listed in `package.json` or `yarn.lock`.
- **flush `<script>`**: Run a specified script from your project.
- **publish `<pkg>`**: Publish a package to the cloud (coming soon!).
- **help**: Display a detailed help message.
- **version**: Show the current version of the CLI.

## Example Commands 📋

### Initializing a New Project

To start a new project:

```bash
meow init
```

### Adding a Package

To add a package:

```bash
meow add <package-name>
```

### Removing a Package

To remove a package:

```bash
meow remove <package-name>
```

### Installing Dependencies

To install your project's dependencies:

```bash
meow
```

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