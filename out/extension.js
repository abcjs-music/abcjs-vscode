"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VScode = require("vscode");
const path = require("path");
//import fs = require('fs');
// The module 'vscode' contains the VS Code extensibility API
const vscode = require("vscode");
let panel = undefined;
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // abcjs preview
    const outputChannel = vscode.window.createOutputChannel('abcjs-vscode errors');
    // Register the command to Show the Viewer.
    let viewer = vscode.commands.registerCommand('abcjs-vscode.showPreview', () => showPreview(context, outputChannel));
    context.subscriptions.push(viewer);
    // Update the Preview when code changes.
    vscode.workspace.onDidChangeTextDocument((eventArgs) => {
        //console.log('changed', eventArgs);
        updatePreview(eventArgs);
    });
    vscode.window.onDidChangeActiveTextEditor(async (eventArgs) => {
        if (eventArgs) {
            if (!panel || !vscode.window.activeTextEditor)
                return;
            //console.log('active', eventArgs);
            const editorContent = getNormalizedEditorContent(vscode.window.activeTextEditor);
            panel.webview.html = await getHtml(context, editorContent, getFileName());
            updatePreview(eventArgs);
        }
    });
}
function renderPreview() {
    // todo
}
function getFileName() {
    const path = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.document.fileName
        : 'ABC File Not Selected';
    const arr = path.split('/');
    return arr[arr.length - 1];
}
function updatePreview(eventArgs) {
    if (!vscode.window.activeTextEditor) {
        throw new Error('No active text editor!');
    }
    const language = eventArgs.document.languageId;
    // plaintext is for unsaved files.
    if (language !== 'abc' && language !== 'plaintext') {
        console.log('language is', language);
        return;
    }
    const editorContent = getNormalizedEditorContent(vscode.window.activeTextEditor);
    if (panel != null) {
        panel.webview.postMessage({
            command: 'contentChange',
            content: editorContent,
        });
    }
}
/**
 * Generate the Preview HTML.
 * @param {String} editorContent
 */
async function getHtml(context, editorContent, fileName) {
    const onDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'src', 'viewer.html'));
    //const filePath = path.join(context.extensionPath, 'src', 'viewer.html')
    //const filePath = panel.webview.asWebviewUri(onDiskPath);
    const fileContent = await VScode.workspace.fs.readFile(onDiskPath);
    let html = fileContent.toString();
    // todo: replace variables
    // ${editorContent}
    html = html.replace('${fileName}', fileName);
    html = html.replace('${title}', fileName);
    return html;
}
/**
 * open the preview window to the side.
 */
async function showPreview(context, outputChannel) {
    //console.log('registering the viewer');
    if (!vscode.window.activeTextEditor) {
        throw new Error('No active text editor!');
    }
    panel = createPanel(context);
    const editorContent = getNormalizedEditorContent(vscode.window.activeTextEditor);
    const html = await getHtml(context, editorContent, getFileName());
    panel.webview.html = html;
    panel.webview.onDidReceiveMessage((message) => {
        //console.log(message);
        // Receiving only the element-selection messages at the moment.
        // Select the character in the editor.
        try {
            select(message.startChar, message.endChar);
        }
        catch (error) {
            console.error(error);
            vscode.window.showErrorMessage(error);
        }
    });
}
/**
 * Select the code in the editor between the given locations. Used on sheet click.
 * @param {Number} start
 * @param {Number} end
 */
function select(start, end) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        // Take the first visible one?!
        editor = vscode.window.visibleTextEditors[0];
    }
    //editor.document.offsetAt()
    const startPos = editor.document.positionAt(start);
    const endPos = editor.document.positionAt(end);
    //console.log('positions:', startPos, endPos)
    // vscode.commands.executeCommand("cursorMove", {
    //   to: "down",
    //   by: "wrappedLine",
    //   select: true,
    //   value: 1
    // });
    editor.selection = new vscode.Selection(startPos, endPos);
    editor.revealRange(editor.selection);
}
function getNormalizedEditorContent(editor) {
    if (editor == null) {
        return '';
    }
    let content = editor.document.getText();
    // escape the \
    content = content.replaceAll('\\', '\\\\');
    if (editor.document.eol == vscode.EndOfLine.CRLF) {
        content = content.replace(/\r\n/g, '\n');
    }
    return content;
}
function createPanel(context) {
    //vscode.window.showInformationMessage('Opening the preview in abcjs editor!');
    var result = vscode.window.createWebviewPanel('abcjsPreview', 'abcjs preview', vscode.ViewColumn.Beside, {
        enableScripts: true,
        // Only allow the webview to access resources in our extension's media directory
        localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, 'src')),
        ],
    });
    return result;
}
// this method is called when your extension is deactivated
function deactivate() { }
module.exports = {
    activate,
    deactivate,
};
//# sourceMappingURL=extension.js.map