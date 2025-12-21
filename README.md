# PromptContext for VS Code

[![Version](https://vsmarketplacebadge.apphb.com/version/mukea.prompt-context.svg)](https://marketplace.visualstudio.com/items?itemName=mukea.prompt-context)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/mukea.prompt-context.svg)](https://marketplace.visualstudio.com/items?itemName=mukea.prompt-context)
[![License](https://img.shields.io/github/license/mukea-org/prompt-context)](LICENSE)

**The essential tool for Coding with AI.**

PromptContext helps you prepare code context for LLMs (ChatGPT, Claude, DeepSeek, Gemini) in seconds. It formats your code with **relative paths**, **file tree structures**, and **line numbers**, ensuring the AI understands your project structure instantly.

---

## 🚀 Why PromptContext?

When pasting code to AI, you often face these problems:
*   ❌ "Which file is this code from?" (AI loses context of file paths).
*   ❌ "I need to see the folder structure to understand how modules interact."
*   ❌ Copying a folder manually is tedious.
*   ❌ Accidentally pasting 10MB of `node_modules` or binary files.

**PromptContext solves all of this.**

---

## ✨ Key Features

### 1. 📂 Smart File & Folder Copying
Right-click on any file **or folder** in the Explorer and select `Copy to Prompt`.
*   **Recursive Processing**: Automatically scans folders (skipping `node_modules`, `.git`, etc.).
*   **Project Tree**: Generates an ASCII directory tree at the beginning of the prompt so the AI understands the architecture.
*   **Markdown Format**: Wraps content in code blocks with language identifiers.

### 2. ✂️ Intelligent Selection Mode
Select a block of code in the editor and run the command.
*   **Auto Line Numbers**: Automatically adds line numbers (e.g., `12 | import ...`) to the selected text. Great for asking "Explain the logic on line 15".
*   **Multi-Cursor Support**: Handles multiple selections gracefully with gap indicators.

### 3. 🛡️ Safety & Optimization
*   **Binary Filtering**: Automatically skips images, PDFs, and compiled binaries.
*   **Size Limits**: Prevents copying massive files that would exceed token limits (default 100KB, configurable).
*   **Token Estimation**: Shows an estimated token count in the notification after copying.

### 4. 📝 Path Headers
Insert the relative file path as a comment at the top of your current file with one command (`PromptContext: Add File Path Header`).

---

## 📖 How to Use

### Scene A: Copying a Whole Module (Folder)
1. Right-click a folder (e.g., `src/utils`) in the Explorer.
2. Select **Prompt Context: Copy to Prompt**.
3. Paste into ChatGPT/Claude. You get:
   *   A file tree of the folder.
   *   The content of all valid text files inside.

### Scene B: Code Review (Selection)
1. Select a function in your code.
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P`) -> **Prompt Context: Copy to Prompt**.
3. Paste. The output includes **Line Numbers** for precise referencing.

### Scene C: Multi-File Context
1. Hold `Ctrl` (or `Cmd`) and select multiple specific files in Explorer.
2. Right-click -> **Prompt Context: Copy to Prompt**.

---

## ⚙️ Configuration

Customize the behavior in VS Code Settings (`Ctrl+,` -> search `prompt-context`):

| Setting | Default | Description |
| :--- | :--- | :--- |
| `prompt-context.maxFileSize` | `100` | Max file size (KB) to process. Files larger than this are skipped. |
| `prompt-context.excludedExtensions` | `[.png, .exe, ...]` | List of file extensions to always ignore. |

---

## 📦 Output Example

When you copy files, the clipboard content looks like this:

> Project Tree Context:
> 
> Directory: 
>
> src/
>
> ├── extension.ts (*)
> 
> └── utils/
> 
> Directory: 
> src/utils/
>
> ├── helper.ts (*)
> 
> └── logger.ts
> 
> ---
> 
> File: src/extension.ts
> ```typescript
> import * as vscode from "vscode";
> // ... code content ...
> ```
> 
> ---
> 
> File: src/utils/helper.ts
> ```typescript
> export function help() { ... }
> ```

---

## ⌨️ Commands

*   `prompt-context.copyContext`: Copy files/selection to clipboard formatted for AI.
*   `prompt-context.addHeader`: Insert relative path comment at the top of the current file.

---

## 🤝 Contributing

Found a bug or have a feature request? Please open an issue on our [GitHub Repository](https://github.com/mukea-org/prompt-context).

**Happy Coding with AI!** 🤖 code