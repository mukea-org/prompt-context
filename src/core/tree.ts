import * as vscode from "vscode";
import * as path from "path";

/**
 * 生成上下文文件树
 * 逻辑：显示涉及的目录及其一级子文件结构
 */
export async function generateProjectTreeContext(filesAndFolders: vscode.Uri[]): Promise<string> {
    // 1. 收集所有需要展示的父级目录
    // 如果用户选中了文件夹，我们需要展示该文件夹的父级（看到它是一个文件夹）
    // 或者我们认为选中文件夹本身就是根。
    // 为了保持一致性，我们展示包含选中项的目录。
    
    const dirsToScan = new Set<string>();
    
    for (const uri of filesAndFolders) {
        // 展示选中项所在的目录结构
        const parentDir = path.dirname(uri.fsPath);
        dirsToScan.add(parentDir);
    }

    let treeOutput = "Project Tree Context:\n";
    const sortedDirs = Array.from(dirsToScan).sort();

    // 辅助集合：用于快速判断某个文件是否在用户选中的列表中（或是选中文件夹的子项）
    const selectedPaths = new Set(filesAndFolders.map(u => u.fsPath));

    for (const dirPath of sortedDirs) {
        const dirUri = vscode.Uri.file(dirPath);
        const relativeDirPath = vscode.workspace.asRelativePath(dirUri, false);
        const normalizedDirPath = relativeDirPath === relativeDirPath 
            ? (relativeDirPath === "" ? "." : relativeDirPath.split(path.sep).join("/"))
            : ".";

        treeOutput += `\nDirectory: ${normalizedDirPath}/\n`;

        try {
            const entries = await vscode.workspace.fs.readDirectory(dirUri);
            
            // 排序：文件夹在前
            entries.sort((a, b) => {
                if (a[1] === b[1]) return a[0].localeCompare(b[0]);
                return a[1] === vscode.FileType.Directory ? -1 : 1;
            });

            for (let i = 0; i < entries.length; i++) {
                const [name, type] = entries[i];
                const isLast = i === entries.length - 1;
                const prefix = isLast ? "└── " : "├── ";
                
                // 标记逻辑
                const entryFsPath = path.join(dirPath, name);
                
                // 如果当前项在用户的选中列表中，或者是选中文件夹，打个标记
                // 注意：这里仅做精确匹配标记，不做深层递归标记，保持清爽
                const isSelected = selectedPaths.has(entryFsPath);
                const mark = isSelected ? " (*)" : "";
                
                const displayName = type === vscode.FileType.Directory ? `${name}/` : name;
                treeOutput += `${prefix}${displayName}${mark}\n`;
            }
        } catch (e) {
            treeOutput += `(Error reading directory)\n`;
        }
    }
    return treeOutput + "\n";
}
