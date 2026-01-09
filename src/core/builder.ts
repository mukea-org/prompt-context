import * as vscode from "vscode";
import * as path from "path";
import { isBinary, decodeText, normalizePath } from "./utils";

export interface BuildResult {
    content: string;
    processedCount: number;
    skippedCount: number;
}

export class ContextBuilder {
    private config = vscode.workspace.getConfiguration("prompt-context");
    private maxFileSizeKB = this.config.get<number>("maxFileSize", 100);
    private excludedExts = this.config.get<string[]>("excludedExtensions") || [];
    // 增加默认忽略的文件夹，防止扫描 node_modules
    private excludedDirs = [".git", "node_modules", "dist", "out", "build", ".idea", ".vscode"];

    /**
     * 处理编辑器内的选区 (Selection Mode)
     */
    public async processSelection(editor: vscode.TextEditor): Promise<string | null> {
        const t = vscode.l10n.t;
        if (editor.selection.isEmpty) return null;

        const relativePath = vscode.workspace.asRelativePath(editor.document.uri, false);
        const normalizedPath = normalizePath(relativePath);
        const ext = path.extname(editor.document.fileName).toLowerCase();
        const langId = ext.replace(".", "") || "text";

        // 处理多光标选区 + 增加行号
        const selections = editor.selections
            .slice()
            .sort((a, b) => a.start.compareTo(b.start));

        const selectedContent = selections.map(s => {
            const text = editor.document.getText(s);
            const startLine = s.start.line + 1;
            const lines = text.split(/\r?\n/);
            return lines.map((line, i) => {
                const lineNum = (startLine + i).toString().padEnd(4, " ");
                return `${lineNum} | ${line}`;
            }).join("\n");
        }).join("\n\n... (Gap) ...\n\n");

        const header = t("File: {0} (Selection)", normalizedPath);
        return `${header}\n\`\`\`${langId}\n${selectedContent}\n\`\`\``;
    }

    /**
     * 处理文件/文件夹列表 (File Mode)
     * 修复：增加 recursiveExpand 逻辑
     */
    public async processFiles(uris: vscode.Uri[], token: vscode.CancellationToken, progress: vscode.Progress<{ message?: string }>): Promise<BuildResult> {
        const t = vscode.l10n.t;
        const resultParts: string[] = [];
        let processedCount = 0;
        let skippedCount = 0;

        // 1. 递归展开所有文件
        const allFiles = await this.expandFolders(uris, token, progress);

        // 2. 逐个处理文件
        for (const fileUri of allFiles) {
            if (token.isCancellationRequested) break;

            const fileName = path.basename(fileUri.fsPath);
            progress.report({ message: t("Reading {0}...", fileName) });

            // 获取相对路径
            const relativePath = vscode.workspace.asRelativePath(fileUri, false);
            const normalizedPath = normalizePath(relativePath);
            const ext = path.extname(fileUri.fsPath).toLowerCase();
            const fileHeader = t("File: {0}", normalizedPath);

            // 检查后缀黑名单
            if (this.excludedExts.includes(ext)) {
                resultParts.push(`${fileHeader}\n${t("[Skipped: Binary/Asset file ({0})]", ext)}`);
                skippedCount++;
                continue;
            }

            // 检查大小
            try {
                const stat = await vscode.workspace.fs.stat(fileUri);
                const fileSizeKB = stat.size / 1024;
                if (fileSizeKB > this.maxFileSizeKB) {
                    resultParts.push(
                        `${fileHeader}\n${t(
                            "[Skipped: Size {0}KB > {1}KB limit]",
                            fileSizeKB.toFixed(1),
                            this.maxFileSizeKB,
                        )}`,
                    );
                    skippedCount++;
                    continue;
                }

                // 读取内容
                const contentUint8 = await vscode.workspace.fs.readFile(fileUri);
                
                // 检查二进制内容
                if (isBinary(contentUint8)) {
                    resultParts.push(`${fileHeader}\n${t("[Skipped: Binary content detected]")}`);
                    skippedCount++;
                    continue;
                }

                const content = decodeText(contentUint8);
                const langId = ext.replace(".", "") || "text";

                resultParts.push(`${fileHeader}\n\`\`\`${langId}\n${content}\n\`\`\``);
                processedCount++;

            } catch (err) {
                console.error(`Error reading ${fileName}:`, err);
                skippedCount++;
            }
        }

        return {
            content: resultParts.join("\n\n---\n\n"),
            processedCount,
            skippedCount
        };
    }

    /**
     * 递归展开文件夹，获取所有文件 Uri
     */
    private async expandFolders(uris: vscode.Uri[], token: vscode.CancellationToken, progress: vscode.Progress<{ message?: string }>): Promise<vscode.Uri[]> {
        const t = vscode.l10n.t;
        let results: vscode.Uri[] = [];
        
        // 辅助队列
        const queue = [...uris];
        const visited = new Set<string>();

        while (queue.length > 0) {
            if (token.isCancellationRequested) break;

            const current = queue.shift()!;
            if (visited.has(current.fsPath)) continue;
            visited.add(current.fsPath);

            try {
                const stat = await vscode.workspace.fs.stat(current);

                if (stat.type === vscode.FileType.File) {
                    results.push(current);
                } else if (stat.type === vscode.FileType.Directory) {
                    // 检查是否在忽略目录中 (比如 node_modules)
                    const dirName = path.basename(current.fsPath);
                    if (this.excludedDirs.includes(dirName)) {
                        continue;
                    }

                    progress.report({ message: t("Scanning dir {0}...", dirName) });
                    
                    const entries = await vscode.workspace.fs.readDirectory(current);
                    for (const [name, type] of entries) {
                        const childPath = path.join(current.fsPath, name);
                        queue.push(vscode.Uri.file(childPath));
                    }
                }
            } catch (e) {
                console.warn(`Failed to access ${current.fsPath}`, e);
            }
        }

        return results;
    }
}
