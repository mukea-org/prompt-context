import * as vscode from "vscode";
import * as path from "path";
import * as util from "util";

// 使用 TextDecoder 处理文件读取后的字节流转换
const textDecoder = new util.TextDecoder("utf-8");

/**
 * 插件激活入口
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "prompt-context" is now active!');

	// --- 命令注册：在首行插入相对路径注释 ---
	const addHeaderDisposable = vscode.commands.registerCommand(
		"prompt-context.addHeader",
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}
			await addPathHeader(editor);
		},
	);

	// --- 命令注册：复制内容供 AI 使用 (支持多选) ---
	const copyContextDisposable = vscode.commands.registerCommand(
		"prompt-context.copyContext",
		async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
			// 1. 确定待处理文件列表
			let filesToProcess: vscode.Uri[] = [];

			if (uris && uris.length > 0) {
				filesToProcess = uris; // 资源管理器多选
			} else if (uri) {
				filesToProcess = [uri]; // 资源管理器单选
			} else if (vscode.window.activeTextEditor) {
				filesToProcess = [vscode.window.activeTextEditor.document.uri]; // 编辑器内触发
			}

			if (filesToProcess.length === 0) {
				return;
			}

			// 2. 开启进度条提示
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Building Prompt Context...",
				cancellable: true,
			}, async (progress, token) => {
				try {
					const resultParts: string[] = [];
					// 获取用户配置
					const config = vscode.workspace.getConfiguration(
						"prompt-context",
					);

					// 修复点：显式指定泛型 <number>，并使用 get 的第二个参数设置默认值
					const maxFileSizeKB = config.get<number>(
						"maxFileSize",
						100,
					);

					const excludedExts =
						config.get<string[]>("excludedExtensions") || [];

					let processedCount = 0;
					let skippedCount = 0;

					for (const fileUri of filesToProcess) {
						// 如果用户点击了进度条上的取消，停止处理
						if (token.isCancellationRequested) {
							return;
						}

						const fileName = path.basename(fileUri.fsPath);
						progress.report({
							message: `Processing ${fileName}...`,
						});

						// 获取文件基本信息
						const stat = await vscode.workspace.fs.stat(fileUri);
						if (stat.type !== vscode.FileType.File) {
							continue;
						}

						const relativePath = vscode.workspace.asRelativePath(
							fileUri,
							false,
						);
						// 统一路径分隔符为 POSIX 风格，AI 更容易理解
						const normalizedPath = relativePath.split(path.sep)
							.join("/");
						const ext = path.extname(fileUri.fsPath).toLowerCase();

						// 策略 A: 检查黑名单后缀 (图片/音频/二进制等)
						if (excludedExts.includes(ext)) {
							resultParts.push(
								`File: ${normalizedPath}\n[Skipped: Binary/Asset file (${ext})]`,
							);
							skippedCount++;
							continue;
						}

						// 策略 B: 检查文件大小限制
						const fileSizeKB = stat.size / 1024;
						// 此时 maxFileSizeKB 确认为 number 类型，比较操作符 > 可以正常使用
						if (fileSizeKB > maxFileSizeKB) {
							resultParts.push(
								`File: ${normalizedPath}\n[Skipped: Size ${
									fileSizeKB.toFixed(1)
								}KB > ${maxFileSizeKB}KB limit]`,
							);
							skippedCount++;
							continue;
						}

						// 读取内容
						const contentUint8 = await vscode.workspace.fs.readFile(
							fileUri,
						);

						// 策略 C: 动态嗅探内容是否包含二进制字符
						if (isBinaryContent(contentUint8)) {
							resultParts.push(
								`File: ${normalizedPath}\n[Skipped: Binary content detected]`,
							);
							skippedCount++;
							continue;
						}

						const content = textDecoder.decode(contentUint8);
						const langId = ext.replace(".", "") || "text";

						// 组装 Markdown 格式
						resultParts.push(
							`File: ${normalizedPath}\n\`\`\`${langId}\n${content}\n\`\`\``,
						);

						processedCount++;
					}

					// 3. 写入剪贴板并给出最终反馈
					if (resultParts.length > 0) {
						const finalOutput = resultParts.join("\n\n---\n\n");
						await vscode.env.clipboard.writeText(finalOutput);

						const total = processedCount + skippedCount;
						// 简短有力的反馈
						if (skippedCount > 0) {
							vscode.window.showInformationMessage(
								`Copied ${processedCount} files to clipboard (${skippedCount} skipped).`,
							);
						} else {
							vscode.window.showInformationMessage(
								`Copied ${processedCount} files to clipboard!`,
							);
						}
					}
				} catch (error: any) {
					vscode.window.showErrorMessage(
						`Context build failed: ${error.message}`,
					);
				}
			});
		},
	);

	context.subscriptions.push(addHeaderDisposable, copyContextDisposable);
}

/**
 * 逻辑：在文件第一行插入注释路径
 */
async function addPathHeader(editor: vscode.TextEditor) {
	const document = editor.document;
	const relativePath = vscode.workspace.asRelativePath(document.uri, false);
	const normalizedPath = relativePath.split(path.sep).join("/");

	const firstLine = document.lineAt(0);

	// 幂等性检查
	if (firstLine.text.includes(normalizedPath)) {
		vscode.window.setStatusBarMessage("Path header already present.", 2000);
		return;
	}

	const originalSelection = editor.selection;

	try {
		await editor.edit((editBuilder) => {
			// 在第 0 行第 0 字符处插入路径文本和换行
			editBuilder.insert(
				new vscode.Position(0, 0),
				normalizedPath + "\n",
			);
		});

		// 选中插入的那一行文本
		const insertedLine = document.lineAt(0);
		editor.selection = new vscode.Selection(
			insertedLine.range.start,
			insertedLine.range.end,
		);

		// 调用 VS Code 内置命令，自动根据当前语言加上注释符号
		await vscode.commands.executeCommand("editor.action.addCommentLine");

		// 恢复光标位置
		const newPos = new vscode.Position(
			originalSelection.active.line + 1,
			originalSelection.active.character,
		);
		editor.selection = new vscode.Selection(newPos, newPos);
		editor.revealRange(new vscode.Range(newPos, newPos));

		vscode.window.setStatusBarMessage("Path header added.", 2000);
	} catch (err) {
		console.error("Add Path Header Error:", err);
	}
}

/**
 * 简单的二进制探测函数
 * 逻辑：读取缓冲区前 512 字节，如果发现 Null Byte (0x00)，通常判定为二进制文件
 */
function isBinaryContent(buffer: Uint8Array): boolean {
	const checkLength = Math.min(buffer.length, 512);
	for (let i = 0; i < checkLength; i++) {
		if (buffer[i] === 0) {
			return true;
		}
	}
	return false;
}

/**
 * 插件停用时的清理工作
 */
export function deactivate() {}
