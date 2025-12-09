# OGP Preview CLI

<div align="center">
  <!-- <img src="assets/logo.png" alt="OGP Preview Logo" width="200"/> -->
  <br>
  <h3>Analyze and Preview Open Graph Protocol Metadata Locally</h3>
</div>

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Rust](https://img.shields.io/badge/rust-1.75%2B-orange)](https://www.rust-lang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

[English](README.md) | [日本語](README.ja.md)

</div>

<div align="center">
  <img src="assets/preview.png" alt="OGP Preview Demo" width="800">
</div>

## 📖 Overview

**ogp-preview** is a CLI tool designed for frontend developers and designers. It allows you to preview how your localhost environment or any URL will appear on social media platforms (like X/Twitter) without deploying or using tunneling services like ngrok.

It fetches the page, extracts OGP metadata (`og:title`, `og:image`, etc.), resolves relative URLs, and generates an HTML preview replicating the "Summary Card with Large Image" design.

## ✨ Features

- **🚀 Localhost Support**: Works seamlessly with local dev servers (e.g., `http://localhost:3000`).
- **🖼️ Authentic Preview**: Replicates Twitter/X card design (Light Theme) with proper layout handling.
- **🔍 Debug Mode**: Displays a raw table of all extracted meta tags for deep inspection.
- **🔗 Smart Resolution**: Automatically converts relative image paths to absolute URLs.
- **🛠️ Zero Config**: Just run it against a URL.

## 📦 Installation

Prerequisites: Node.js (version 18 or higher)

### Quick Start (No Install)

You can run directly using `npx`:

```bash
npx github:syuya2036/ogp-preview https://github.com
```

### Global Install

```bash
npm install -g github:syuya2036/ogp-preview
# or
yarn global add github:syuya2036/ogp-preview
```

After installation, you can run the tool using the `ogp-preview` command:

```bash
ogp-preview http://localhost:3000
```

## 🚀 Usage

### Basic Usage

Preview a specific URL:

```bash
ogp-preview http://localhost:3000/blog/my-new-post
```

### Quick Localhost Shortcut

You can skip typing the protocol and localhost by using the `-p` (port) flag:

```bash
# Equivalent to http://localhost:3000/blog/1
ogp-preview -p 3000 blog/1
```

### Remote URLs

It also works for public URLs:

```bash
ogp-preview https://github.com
```

### Workflow
1. Use the command above.
2. The default browser will open with the preview card.
3. Check the OGP appearance and raw debugging data.
4. Press **Enter** in the terminal to close the preview and clean up temporary files.

## 💻 Development

### Setup

```bash
git clone https://github.com/syuya2036/ogp-preview.git
cd ogp-preview
npm install
```

### Run in Development Mode

You can use `npm run dev` to run the TypeScript source directly:

```bash
npm run dev -- https://github.com
```

### Build

To compile TypeScript to JavaScript (dist/):

```bash
npm run build
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  Created by <a href="https://github.com/syuya2036">@syuya2036</a>
</div>
