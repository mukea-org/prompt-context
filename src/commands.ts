import * as vscode from "vscode";
import * as path from "path";
import { ContextBuilder } from "./core/builder";
import { generateProjectTreeContext } from "./core/tree";
import { estimateTokens, normalizePath } from "./core/utils";

export async function copyContextCommand(uri?: vscode.Uri, uris?: vscode.Uri[]) {
    const editor = vscode.window.activeTextEditor;
    const builder = new ContextBuilder();

    // 1. 判断是否优先处理文本选区 (Selection Mode)
    const isExplorerMultiSelect = uris && uris.length > 1;
    const isTargetingDifferentFile = uri && editor && uri.toString() !== editor.document.uri.toString();

    if (editor && !editor.selection.isEmpty && !isExplorerMultiSelect && !isTargetingDifferentFile) {
        try {
            const result = await builder.processSelection(editor);
            if (result) {
                await vscode.env.clipboard.writeText(result);
                const tokens = estimateTokens(result);
                vscode.window.showInformationMessage(`Copied selection! (~${tokens} tokens)`);
                return;
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Copy selection failed: ${error.message}`);
            return;
        }
    }

    // 2. 处理文件/文件夹 (File/Folder Mode)
    let filesToProcess: vscode.Uri[] = [];
    if (uris && uris.length > 0) {
        filesToProcess = uris; // 资源管理器多选
    } else if (uri) {
        filesToProcess = [uri]; // 资源管理器单选或右键菜单
    } else if (vscode.window.activeTextEditor) {
        filesToProcess = [vscode.window.activeTextEditor.document.uri]; // 编辑器内触发
    }

    if (filesToProcess.length === 0) return;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Building Prompt Context...",
        cancellable: true,
    }, async (progress, token) => {
        try {
            // 生成树形结构 (针对用户最初选中的节点)
            let finalContent = "";
            
            // 如果是多文件或文件夹选择，先生成树
            if (filesToProcess.length > 0) {
                progress.report({ message: "Generating project tree..." });
                const tree = await generateProjectTreeContext(filesToProcess);
                if (tree) {
                    finalContent += tree + "\n\n---\n\n";
                }
            }

            // 处理文件内容 (包含文件夹递归)
            const result = await builder.processFiles(filesToProcess, token, progress);
            
            if (result.content) {
                finalContent += result.content;
                await vscode.env.clipboard.writeText(finalContent);
                
                const tokens = estimateTokens(finalContent);
                let msg = `Copied ${result.processedCount} files`;
                if (result.skippedCount > 0) {
                    msg += ` (${result.skippedCount} skipped)`;
                }
                msg += ` (~${tokens} tokens).`;
                
                vscode.window.showInformationMessage(msg);
            } else {
                if (!token.isCancellationRequested) {
                    vscode.window.showWarningMessage("No valid text files found to copy.");
                }
            }

        } catch (error: any) {
            vscode.window.showErrorMessage(`Context build failed: ${error.message}`);
        }
    });
}

/**
 * 插入头部注释命令
 */
export async function addHeaderCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const relativePath = vscode.workspace.asRelativePath(document.uri, false);
    const normalizedPath = normalizePath(relativePath);
    const firstLine = document.lineAt(0);

    if (firstLine.text.includes(normalizedPath)) {
        vscode.window.setStatusBarMessage("Path header already present.", 2000);
        return;
    }

    const originalSelection = editor.selection;
    try {
        await editor.edit((editBuilder) => {
            editBuilder.insert(new vscode.Position(0, 0), normalizedPath + "\n");
        });

        // 触发自动注释
        const insertedLine = document.lineAt(0);
        editor.selection = new vscode.Selection(insertedLine.range.start, insertedLine.range.end);
        await vscode.commands.executeCommand("editor.action.addCommentLine");

        // 恢复光标
        const newPos = new vscode.Position(originalSelection.active.line + 1, originalSelection.active.character);
        editor.selection = new vscode.Selection(newPos, newPos);
        editor.revealRange(new vscode.Range(newPos, newPos));
        vscode.window.setStatusBarMessage("Path header added.", 2000);
    } catch (err) {
        console.error("Add Path Header Error:", err);
    }
}
