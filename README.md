# PromptContext for VS Code

**Prepare your code for AI prompts instantly.**

PromptContext is the essential productivity tool for developers working with LLMs (ChatGPT, Claude, GitHub Copilot, etc.). It helps you build the perfect "context window" by copying code files into a clean, LLM-friendly Markdown format with smart safeguards against token waste.

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Version](https://img.shields.io/badge/version-0.0.1-green.svg)

## 🚀 Key Features

*   **📄 Smart Context Copying**: Copy one or multiple files to your clipboard formatted specifically for AI prompts.
    *   Includes relative file paths.
    *   Wraps content in language-specific Markdown code blocks.
    *   **Multi-select support**: Select multiple files in the Explorer to bundle them into one prompt.
*   **🛡️ Token Safeguards**:
    *   **Binary Detection**: Automatically skips images, PDFs, and binary files to prevent garbage text in your prompt.
    *   **Size Limits**: Skips files larger than the configured limit (default 100KB) to save your context window.
*   **📍 Path Headers**: Instantly insert the relative file path as a comment at the top of your current file (useful for single-file copy-pasting).

## 📝 Example Output

When you use **"Copy to Prompt"**, your clipboard will contain:

> File: src/services/auth.ts
> ```typescript
> import * as vscode from "vscode";
> // ... actual code content ...
> ```
> 
> ---
> 
> File: src/utils/helper.ts
> ```typescript
> export function formatDate(date: Date) {
>   // ... actual code content ...
> }
> ```

*This format allows LLMs to understand your project structure and reference specific files accurately.*

## 💻 How to Use

### 1. Copy Context for AI (The Main Feature)
Right-click on any file (or multiple files) in the **Explorer** or right-click inside an open **Editor**.
*   Select **`Copy to Prompt (Markdown)`**.
*   Paste directly into ChatGPT/Claude.

### 2. Add Path Header
Open a file and run the command (or right-click):
*   Select **`Add File Path Header`**.
*   Result: `// src/components/Button.tsx` is inserted at line 1.

## ⚙️ Extension Settings

This extension is configurable to fit your workflow:

| Setting | Default | Description |
| :--- | :--- | :--- |
| `prompt-context.maxFileSize` | `100` | Max file size (in KB) to copy. Files larger than this are summarized as "Content Omitted" to save tokens. |
| `prompt-context.excludedExtensions` | `[.png, .exe, ...]` | List of file extensions to automatically ignore (images, binaries, locks). |

## 📦 Installation

1. Open **VS Code**.
2. Go to the **Extensions** view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3. Search for **PromptContext**.
4. Click **Install**.

## ❓ FAQ

**Q: Why does it skip some files?**
A: The extension includes a safety mechanism to prevent copying binary files (which look like gibberish text) or massive files that would exceed AI token limits. You can adjust the `maxFileSize` in settings.

**Q: Does it support multi-root workspaces?**
A: Yes, it calculates paths relative to the workspace folder the file belongs to.

## 📄 License

MIT License

---

**Happy Prompting!** 🤖✨