// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const abcjs = require('abcjs');
//import abcjs from 'abcjs'

let panel = null

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "abcjs-editor" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('abcjs-editor.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from abcjs editor!');
	});

	context.subscriptions.push(disposable);

	const outputChannel = vscode.window.createOutputChannel('abcjs-editor errors');
	
	// Show the viewer
	let viewer = vscode.commands.registerCommand('abcjs-editor.showPreview', 
		() => showPreview(context, outputChannel));
	context.subscriptions.push(viewer);
}

/**
 * open the preview window to the side.
 */
function showPreview(context, outputChannel) {
	//vscode.window.showInformationMessage('Opening the preview in abcjs editor!');
	panel = vscode.window.createWebviewPanel('musicSheet', 'Music Sheet', vscode.ViewColumn.Beside, {
		enableScripts: true
	});

	// panel.webview.html = getWebviewContent(
	// 	getNormalizedEditorContent(vscode.window.activeTextEditor), context.extensionPath);
	panel.webview.html = "<html><body>Hello</body></html>"
	//console.log(abcjs)

	// handle messages from the webview
	// panel.webview.onDidReceiveMessage(message => {
	// 	switch (message.command) {
	// 		case 'selection':
	// 			jumpToPosition(message.start, message.stop);
	// 			return;
	// 	}
	// }, undefined, context.subscriptions);	
	panel.webview.onDidReceiveMessage(message => {
		console.log(message)
	})
}

// function getNormalizedEditorContent(editor) {
// 	if (editor == null) {
// 		return "";
// 	}

// 	let content = editor?.document.getText();

// 	if (editor?.document.eol == vscode.EndOfLine.CRLF) {
// 		content = content.replace(/\r\n/g, "\n");
// 	}

// 	return content;
// }

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
