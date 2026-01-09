# PromptContext (VS Code Extension)

[中文](#中文) | [English](#english)

---

## 中文

PromptContext 用于把代码上下文快速整理成适合粘贴给大模型的 Markdown：包含相对路径、目录树（可选）与文件内容，并自动跳过常见二进制/超大文件。

### 安装（VSIX）

1. 打开仓库的 GitHub Release 页面，下载最新的 `.vsix`（例如 `prompt-context-v1.0.0.vsix`）。
2. VS Code → 扩展（Extensions）→ 右上角 `...` → **从 VSIX 安装...**（Install from VSIX...）。
3. 选择下载的 `.vsix` 文件并安装，按提示重载窗口。

（可选）命令行安装：

```bash
code --install-extension ./prompt-context-v1.0.0.vsix
```

### 如何使用

#### 场景 A：复制选区（带行号）

1. 在编辑器中选中一段代码。
2. 执行命令 **Prompt Context: 复制为提示词 (Markdown)**。
3. 直接粘贴到 ChatGPT/Claude/DeepSeek/Gemini 等。

#### 场景 B：复制当前文件

你可以用任意一种方式触发：

- 命令面板：`Ctrl+Shift+P`（macOS：`Cmd+Shift+P`）→ 运行 **Prompt Context: 复制为提示词 (Markdown)**
- 编辑器右键菜单（编辑区）：选择 **复制为提示词 (Markdown)**
- 编辑器标签页：在文件选项卡区域点击/右键找到 **复制为提示词 (Markdown)**

#### 场景 C：复制文件夹（递归）

1. 在资源管理器中右键一个文件夹。
2. 选择 **复制为提示词 (Markdown)**。
3. 会递归收集文本文件（自动跳过二进制/超大文件），并在开头附带目录树（如可生成）。

#### 场景 D：多选复制（拼上下文）

1. 在资源管理器按住 `Ctrl`/`Cmd` 多选多个文件/文件夹。
2. 右键选择 **复制为提示词 (Markdown)**。

#### 场景 E：插入文件路径头注释

1. 打开一个文件。
2. 运行 **Prompt Context: 插入文件路径头注释**。
3. 扩展会在文件顶部插入相对路径，并触发 VS Code 的“添加行注释”。

### 功能

- 复制选区：在编辑器内选中代码后执行命令，会复制带行号的选区内容（更适合问“第 N 行为什么这样写”）。
- 复制文件/文件夹：在资源管理器选择文件或文件夹后执行命令，会递归读取文本文件并可生成目录树。
- 多选：在资源管理器多选多个文件/文件夹后执行命令，会按所选内容生成上下文。
- 插入路径头：把当前文件的相对路径插入到文件顶部，并触发 VS Code 的“添加行注释”。

### 入口（在哪里能找到）

- 命令面板：`Prompt Context: Copy to Prompt (Markdown)` / `Prompt Context: Add File Path Header`
- 编辑器右键菜单（编辑区）：可复制/插入路径头
- 资源管理器右键菜单：可对文件/文件夹复制
- 编辑器标签页：在文件选项卡（标签栏）上也可以触发“复制为提示词”

### 配置

在 VS Code 设置中搜索 `prompt-context`：

- `prompt-context.maxFileSize`：最大文件大小（KB），默认 `100`
- `prompt-context.excludedExtensions`：自动排除的扩展名列表（如图片/压缩包/二进制等）

### 开发与打包

```bash
pnpm install
pnpm run package
pnpm dlx @vscode/vsce package --no-dependencies
```

### CI / 发布（GitHub Actions）

- 手动打包（Artifact）：`.github/workflows/package.yml` 支持 `workflow_dispatch`，会产出 `.vsix` 并作为 artifact 上传
- 自动发 Release：`.github/workflows/release.yml` 在推送 `v*` tag（例如 `v1.0.0`）时自动创建 GitHub Release 并上传 `.vsix`
  - 版本校验：`tag` 必须等于 `v${package.json.version}`，否则 workflow 失败

### 本地化（i18n）

扩展文案支持中文/英文，会跟随 VS Code 的显示语言自动切换。

---

## English

PromptContext prepares code context for LLM prompting as Markdown: relative paths, optional directory tree, and file contents, while skipping common binary/oversized files.

### Install (VSIX)

1. Open the repository’s GitHub Releases page and download the latest `.vsix` (for example `prompt-context-v1.0.0.vsix`).
2. VS Code → Extensions → top-right `...` → **Install from VSIX...**
3. Select the downloaded `.vsix`, install it, then reload when prompted.

(Optional) Install via CLI:

```bash
code --install-extension ./prompt-context-v1.0.0.vsix
```

### How to use

#### Scenario A: Copy selection (with line numbers)

1. Select a code snippet in the editor.
2. Run **Prompt Context: Copy to Prompt (Markdown)**.
3. Paste into ChatGPT/Claude/DeepSeek/Gemini, etc.

#### Scenario B: Copy current file

Use any of the following:

- Command Palette: `Ctrl+Shift+P` (macOS: `Cmd+Shift+P`) → run **Prompt Context: Copy to Prompt (Markdown)**
- Editor context menu: choose **Copy to Prompt (Markdown)**
- Editor tab/title area: click/right-click the file tab area and run **Copy to Prompt (Markdown)**

#### Scenario C: Copy a folder (recursive)

1. In the Explorer, right-click a folder.
2. Choose **Copy to Prompt (Markdown)**.
3. It will recursively collect text files (skipping binaries/oversized files) and prepend a directory tree (when available).

#### Scenario D: Multi-select

1. In the Explorer, multi-select files/folders with `Ctrl`/`Cmd`.
2. Right-click and choose **Copy to Prompt (Markdown)**.

#### Scenario E: Insert file path header

1. Open a file.
2. Run **Prompt Context: Add File Path Header**.
3. The extension inserts the relative path at the top and triggers VS Code “add line comment”.

### Features

- Copy selection: with an editor selection, the command copies the selection with line numbers.
- Copy file/folder: from the Explorer, recursively collects text files and can include a directory tree.
- Multi-select: supports selecting multiple files/folders in the Explorer.
- Insert path header: inserts the workspace-relative path at the top of the current file and triggers VS Code “add line comment”.

### Entry points

- Command Palette: `Prompt Context: Copy to Prompt (Markdown)` / `Prompt Context: Add File Path Header`
- Editor context menu: copy / insert path header
- Explorer context menu: copy for files/folders
- Editor tab/title area: “Copy to Prompt (Markdown)” is also available from the file tab UI

### Settings

Search `prompt-context` in VS Code Settings:

- `prompt-context.maxFileSize` (KB), default `100`
- `prompt-context.excludedExtensions` list

### Dev & Packaging

```bash
pnpm install
pnpm run package
pnpm dlx @vscode/vsce package --no-dependencies
```

### CI / Release (GitHub Actions)

- Manual packaging (Artifact): `.github/workflows/package.yml` supports `workflow_dispatch` and uploads a `.vsix` artifact
- Automatic Release: `.github/workflows/release.yml` runs on `v*` tags (e.g. `v1.0.0`), creates a GitHub Release, and uploads the `.vsix`
  - Version check: the tag must equal `v${package.json.version}`
