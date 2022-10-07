/*
  Extension code
 */
import { WebviewPanel } from 'vscode';

//import * as VScode from 'vscode';
import * as vscode from 'vscode';
import path = require('path');
// The module 'vscode' contains the VS Code extensibility API
//import vscode = require('vscode');
import * as os from 'os';
import { pathToFileURL } from 'url';

let panel: WebviewPanel;
let outputChannel: vscode.OutputChannel;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('abcjs-vscode');
  outputChannel.appendLine('starting abcjs extension...');
  //outputChannel.show();

  // Commands
  registerCommands(context);

  // Behaviour
  registerEvents(context);
}

function registerCommands(context: vscode.ExtensionContext) {
  // Show Viewer
  let viewer = vscode.commands.registerCommand('abcjs-vscode.showPreview', () =>
    showPreview(context)
  );
  context.subscriptions.push(viewer);

  // Export
  let exportCommand = vscode.commands.registerCommand(
    'abcjs-vscode.export',
    () => exportSheet(context)
  );
  context.subscriptions.push(exportCommand);

  // Print Preview
  let printCommand = vscode.commands.registerCommand(
    'abcjs-vscode.printPreview',
    () => printPreview(context)
  );
  context.subscriptions.push(printCommand);
}

function registerEvents(context: vscode.ExtensionContext) {
  // Update the Preview when code changes.
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((eventArgs) => {
      updatePreview(eventArgs);
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async (eventArgs) => {
      if (eventArgs) {
        if (!panel || !vscode.window.activeTextEditor) {
          return;
        }

        updatePreview(eventArgs);
      }
    })
  );

  // Handle configuration changes.
  // todo: pass the configuration options to the viewer panel.
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      outputChannel.appendLine('configuration changed');

      //if (e.affectsConfiguration('abcjs-vscode.pageFormatting.print'))

      // read configuration options and send all to the Viewer
      const options = readConfiguration();

      panel.webview.postMessage({
        command: 'configurationChange',
        content: options,
      });
    })
  );
}

function initializePanel(context: vscode.ExtensionContext) {
  panel = createPanel(context);

  // Receiving messages from the Viewer.
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

/**
 * open the preview window to the side.
 */
async function showPreview(context: vscode.ExtensionContext) {
  initializePanel(context);

  panel.webview.html = await getHtml(context, getFileName());
}

function getCurrentEditorContent(): string {
  const editorContent = getNormalizedEditorContent(
    vscode.window.activeTextEditor
  );
  return editorContent;
}

function getFileName() {
  const filePath = vscode.window.activeTextEditor
    ? vscode.window.activeTextEditor.document.fileName
    : 'ABC File Not Selected';

  const arr = filePath.split(path.sep);

  return arr[arr.length - 1];
}

/**
 * Get a filename for saving HTML.
 */
function getHtmlFilenameForExport(): string {
  let filePath: string;

  // if document is untitled, use tmp file.
  if (vscode.window.activeTextEditor?.document.isUntitled) {
    filePath = getTempFileForExport();
  } else {
    // existing file?
    filePath = vscode.window.activeTextEditor?.document.fileName as string;
    filePath += '.html';

    // Depending on the window from which the command was executed, this might be
    // just a title, an invalid path.
    if (!path.isAbsolute) {
      filePath = getTempFileForExport();
    }
  }

  return filePath;
}

function getTempFileForExport() {
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, 'abcjs-vscode-printPreview.html');
  return filePath;
}

/**
 * Read the configuration settings and prepare abcjs Options object.
 */
function readConfiguration(): object {
  const currentDocument = vscode.window.activeTextEditor?.document;
  const configuration = vscode.workspace.getConfiguration(
    'abcjs-vscode',
    currentDocument?.uri
  );

  const options = {
    responsive: configuration.get('pageFormatting.responsive'),
    print: configuration.get('pageFormatting.print'),
    jazzchords: configuration.get('sheet.jazzchords')
  };
  return options;
}

function updatePreview(
  eventArgs: vscode.TextEditor | vscode.TextDocumentChangeEvent
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
    //outputChannel.appendLine(`language is ${language}`);
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
async function getHtml(context: vscode.ExtensionContext, fileName: string) {
  const editorContent = getCurrentEditorContent();

  const filePath = path.join(context.extensionPath, 'res', 'viewer.html');
  //const filePath = panel.webview.asWebviewUri(onDiskPath);
  let html = await loadFileContent(filePath);

  // replace variables
  html = html.replace('${editorContent}', editorContent);
  html = html.replace('${fileName}', fileName);
  html = html.replace('${title}', fileName);

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

function getNormalizedEditorContent(editor?: vscode.TextEditor) {
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

function createPanel(context: vscode.ExtensionContext): WebviewPanel {
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

/**
 * Export command. Render the sheet in HTML and open in a browser.
 * @param context vs code context
 */
async function exportSheet(context: vscode.ExtensionContext) {
  if (vscode.window.activeTextEditor?.document.isUntitled) {
    vscode.window.showInformationMessage(
      'Please save document before exporting.'
    );
  }

  const html = await getHtml(context, context.extensionPath);

  let fs = require('fs');
  let url = vscode.window.activeTextEditor?.document.fileName + '.html';
  fs.writeFileSync(url, html);

  url = url.replaceAll('\\', '/');
  url = 'file:///' + url;
  await vscode.env.openExternal(vscode.Uri.parse(url));
}

/**
 * Print command. Prepare the sheet for printing and open in a browser.
 */
async function printPreview(context: vscode.ExtensionContext) {
  // load print template
  const filePath = path.join(context.extensionPath, 'res', 'print.html');
  let html = await loadFileContent(filePath);

  // add content
  const editorContent = getCurrentEditorContent();
  html = html.replace('${abc}', editorContent);

  // save
  let savePath = getHtmlFilenameForExport();
  const url = pathToFileURL(savePath).toString();
  const uri = vscode.Uri.parse(url);
  var content = Uint8Array.from(html.split('').map((x) => x.charCodeAt(0)));
  await vscode.workspace.fs.writeFile(uri, content);

  // open browser
  await vscode.env.openExternal(uri);
}

async function loadFileContent(filePath: string): Promise<string> {
  const onDiskPath = vscode.Uri.file(filePath);

  const fileContent = await vscode.workspace.fs.readFile(onDiskPath);

  let readableContent = fileContent.toString();
  return readableContent;
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
