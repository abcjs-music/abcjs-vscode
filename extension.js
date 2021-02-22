// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
let abcjs = require('abcjs');
//import abcjs from 'abcjs'
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

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
		async () => await showPreview(context, outputChannel));
	context.subscriptions.push(viewer);
}

/**
 * open the preview window to the side.
 */
async function showPreview(context, outputChannel) {
	//vscode.window.showInformationMessage('Opening the preview in abcjs editor!');
	panel = vscode.window.createWebviewPanel('musicSheet', 'Music Sheet', vscode.ViewColumn.Beside, {
		enableScripts: true
	});

	// panel.webview.html = getWebviewContent(
	// 	getNormalizedEditorContent(vscode.window.activeTextEditor), context.extensionPath);
	const dom = new JSDOM(`<!DOCTYPE html><html><body>
		<div id="paper"></div>
	</body></html>`);
	console.log(dom.window.document.querySelector("p").textContent); // "Hello world"

	var abc = `X: 1
	T: Cooley's
	M: 4/4
	L: 1/8
	K: Emin
	|:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|
	EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|
	|:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg|
	eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|`
	try {
	const abcObject = await abcjs.renderAbc("paper", abc)
	console.log(abcObject)
	} catch(error) {
		console.error(error)
	}

	panel.webview.html = ""

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
