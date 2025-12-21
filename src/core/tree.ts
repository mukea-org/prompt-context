import * as vscode from "vscode";
import * as path from "path";

/**
 * 生成上下文文件树
 * 改进版：隐藏绝对路径，更智能的层级展示
 */
export async function generateProjectTreeContext(filesAndFolders: vscode.Uri[]): Promise<string> {
    const dirsToScan = new Set<string>();
    
    // 逻辑优化：
    // 1. 如果选中了文件夹，我们想看这个文件夹里面的内容
    // 2. 如果只选中了文件，我们想看这些文件所在的目录
    
    for (const uri of filesAndFolders) {
        // 判断是文件还是文件夹（虽然 Uri 没法直接看，但我们可以根据是否有扩展名简单猜测，或者统一取 dirname）
        // 更稳妥的方式：直接取其父目录。但如果用户选的是 src 文件夹，父目录就是根目录，会显示 node_modules 等杂项。
        
        // 策略：始终以 workspace root 为基准来计算相对路径，展示相对路径的树
        const parentDir = path.dirname(uri.fsPath);
        dirsToScan.add(parentDir);
    }

    let treeOutput = "Project Tree Context:\n";
    const sortedDirs = Array.from(dirsToScan).sort();

    // 辅助集合：用于快速判断标记
    const selectedPaths = new Set(filesAndFolders.map(u => u.fsPath));

    for (const dirPath of sortedDirs) {
        const dirUri = vscode.Uri.file(dirPath);
        
        // --- 核心修改：强制使用相对路径 ---
        const relativeDirPath = vscode.workspace.asRelativePath(dirUri, false);
        
        // 如果 relativeDirPath 是空字符串，说明就是根目录，显示 "."
        // 统一把 Windows 的反斜杠 \ 换成 /
        const normalizedDisplayPath = (relativeDirPath === "" ? "." : relativeDirPath).split(path.sep).join("/");

        treeOutput += `\nDirectory: ${normalizedDisplayPath}/\n`;

        try {
            const entries = await vscode.workspace.fs.readDirectory(dirUri);
            
            // 排序：文件夹在前
            entries.sort((a, b) => {
                if (a[1] === b[1]) return a[0].localeCompare(b[0]);
                return a[1] === vscode.FileType.Directory ? -1 : 1;
            });

            // 过滤忽略的文件夹（如 node_modules）- 让树更干净
            const ignoreList = [".git", "node_modules", "dist", "out", ".vscode", ".idea"];
            const filteredEntries = entries.filter(([name]) => !ignoreList.includes(name));

            for (let i = 0; i < filteredEntries.length; i++) {
                const [name, type] = filteredEntries[i];
                const isLast = i === filteredEntries.length - 1;
                const prefix = isLast ? "└── " : "├── ";
                
                const entryFsPath = path.join(dirPath, name);
                
                // 标记逻辑
                const isSelected = selectedPaths.has(entryFsPath);
                // 或者是选中目录的父级/子级？这里简单点，只标记直接选中的
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
