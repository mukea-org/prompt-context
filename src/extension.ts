import * as vscode from "vscode";
import { addHeaderCommand, copyContextCommand } from "./commands";

export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "prompt-context" is now active!');

	const addHeaderDisposable = vscode.commands.registerCommand(
		"prompt-context.addHeader",
		addHeaderCommand,
	);

	const copyContextDisposable = vscode.commands.registerCommand(
		"prompt-context.copyContext",
		copyContextCommand,
	);

	context.subscriptions.push(addHeaderDisposable, copyContextDisposable);
}

export function deactivate() {}
