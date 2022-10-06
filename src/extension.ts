/*
  Extension code
 */
import { WebviewPanel } from 'vscode';

import * as VScode from 'vscode';
import path = require('path');
// The module 'vscode' contains the VS Code extensibility API
import vscode = require('vscode');

let panel: WebviewPanel | undefined = undefined;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context: VScode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('abcjs-vscode');
  outputChannel.appendLine('starting abcjs extension...');
  outputChannel.show();

  // Commands
  registerCommands(context, outputChannel);

  // Behaviour

  // Update the Preview when code changes.
  vscode.workspace.onDidChangeTextDocument((eventArgs) => {
    updatePreview(eventArgs, outputChannel);
  });
  vscode.window.onDidChangeActiveTextEditor(async (eventArgs) => {
    if (eventArgs) {
      if (!panel || !vscode.window.activeTextEditor) {
        return;
      }

      updatePreview(eventArgs, outputChannel);
    }
  });
}

function registerCommands(
  context: VScode.ExtensionContext,
  outputChannel: VScode.OutputChannel
) {
  // Register the command to Show the Viewer.
  let viewer = vscode.commands.registerCommand('abcjs-vscode.showPreview', () =>
    showPreview(context, outputChannel)
  );
  context.subscriptions.push(viewer);

  // Print command
  let exportCommand = vscode.commands.registerCommand(
    'abcjs-vscode.export',
    () => exportSheet(context)
  );
  context.subscriptions.push(exportCommand);
}

/**
 * open the preview window to the side.
 */
async function showPreview(
  context: VScode.ExtensionContext,
  outputChannel: VScode.OutputChannel
) {
  panel = createPanel(context);

  const editorContent = getNormalizedEditorContent(
    vscode.window.activeTextEditor
  );
  panel.webview.html = await getHtml(context, editorContent, getFileName());

  panel.webview.onDidReceiveMessage((message) => {
    // Receiving only the element-selection messages at the moment.
    // Select the character in the editor.
    try {
      select(message.startChar, message.endChar);
    } catch (error: any) {
      outputChannel.appendLine(error);
      outputChannel.show();

      vscode.window.showErrorMessage(error);
    }
  });
}

function getFileName() {
  const filePath = vscode.window.activeTextEditor
    ? vscode.window.activeTextEditor.document.fileName
    : 'ABC File Not Selected';

  const arr = filePath.split(path.sep);

  return arr[arr.length - 1];
}

function updatePreview(
  eventArgs: VScode.TextEditor | VScode.TextDocumentChangeEvent,
  outputChannel: VScode.OutputChannel
) {
  if (!vscode.window.activeTextEditor) {
    throw new Error('No active text editor!');
  }
  if (!panel) {
    throw new Error('No preview panel found!');
  }

  const language = eventArgs.document.languageId;

  // plaintext is for unsaved files.
  if (language !== 'abc' && language !== 'plaintext') {
    outputChannel.appendLine(`language is ${language}`);
    return;
  }

  const editorContent = getNormalizedEditorContent(
    vscode.window.activeTextEditor
  );

  panel.webview.postMessage({
    command: 'contentChange',
    content: editorContent,
  });

  panel.title = 'abc: ' + getFileName();
}

/**
 * Generate the Preview HTML.
 * @param {String} editorContent
 */
async function getHtml(
  context: VScode.ExtensionContext,
  editorContent: string,
  fileName: string
) {
  const onDiskPath = vscode.Uri.file(
    path.join(context.extensionPath, 'res', 'viewer.html')
  );
  //const filePath = path.join(context.extensionPath, 'src', 'viewer.html')
  //const filePath = panel.webview.asWebviewUri(onDiskPath);
  const fileContent = await VScode.workspace.fs.readFile(onDiskPath);

  let html = fileContent.toString();

  // replace variables? For editorContent, it seems to be automatic. Magic!
  // ${editorContent}
  html = html.replace('${fileName}', fileName);
  //html = html.replace('${title}', fileName);

  return html;
}

/**
 * Select the code in the editor between the given locations. Used on sheet click.
 * @param {Number} start
 * @param {Number} end
 */
function select(start: number, end: number) {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    // Take the first visible one?!
    editor = vscode.window.visibleTextEditors[0];
  }

  //editor.document.offsetAt()
  const startPos = editor.document.positionAt(start);
  const endPos = editor.document.positionAt(end);
  //outputChannel.appendLine(`positions: ${startPos}, ${endPos}`)

  // vscode.commands.executeCommand("cursorMove", {
  //   to: "down",
  //   by: "wrappedLine",
  //   select: true,
  //   value: 1
  // });

  editor.selection = new vscode.Selection(startPos, endPos);
  editor.revealRange(editor.selection);
}

function getNormalizedEditorContent(editor?: VScode.TextEditor) {
  if (!editor) {
    return '';
  }

  let content = editor.document.getText();

  // escape the \
  content = content.replaceAll('\\', '\\\\');

  if (editor.document.eol === vscode.EndOfLine.CRLF) {
    content = content.replace(/\r\n/g, '\n');
  }

  return content;
}

function createPanel(context: VScode.ExtensionContext): WebviewPanel {
  //vscode.window.showInformationMessage('Opening the preview in abcjs editor!');
  var result = vscode.window.createWebviewPanel(
    'abcjsPreview',
    'abcjs preview',
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      // Only allow the webview to access resources in our extension's media directory
      localResourceRoots: [
        vscode.Uri.file(path.join(context.extensionPath, 'src')),
      ],
    }
  );
  return result;
}

async function exportSheet(context: vscode.ExtensionContext) {
  if (vscode.window.activeTextEditor?.document.isUntitled) {
    vscode.window.showInformationMessage(
      'Please save document before printing.'
    );
  }

  // const html = getWebviewContent(
  //   getNormalizedEditorContent(vscode.window.activeTextEditor),
  //   context.extensionPath,
  //   true
  // );
  const html = await getHtml(context, '', context.extensionPath);

  let fs = require('fs');
  let url = vscode.window.activeTextEditor?.document.fileName + '_print.html';
  fs.writeFileSync(url, html);

  url = url.replace('\\', '/');
  url = 'file:///' + url;
  await vscode.env.openExternal(vscode.Uri.parse(url));
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
