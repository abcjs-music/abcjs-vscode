/*
  Extension code
 */
import { WebviewPanel } from 'vscode';

import * as vscode from 'vscode';
import path = require('path');
// The module 'vscode' contains the VS Code extensibility API
import * as os from 'os';
import { pathToFileURL } from 'url';

let panel: WebviewPanel;
let outputChannel: vscode.OutputChannel;
let svgHandler: Function; // the function that receives the SVG
let _context: vscode.ExtensionContext;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('abcjs-vscode');
  outputChannel.appendLine('starting abcjs extension...');
  //outputChannel.show();

  _context = context;

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
    'abcjs-vscode.exportHtml',
    () => requestHtmlExport()
  );
  context.subscriptions.push(exportCommand);

  // Export SVG
  let exportSvgCommand = vscode.commands.registerCommand(
    'abcjs-vscode.exportSvg',
    () => requestSvgExport()
  );
  context.subscriptions.push(exportSvgCommand);

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
    vscode.workspace.onDidChangeConfiguration(async () => {
      // receives an event (e)
      //if (e.affectsConfiguration('abcjs-vscode.pageFormatting.print'))
      outputChannel.appendLine('configuration changed');

      // read configuration options and send all to the Viewer
      const options = readConfiguration();

      await panel.webview.postMessage({
        command: 'configurationChange',
        content: options,
      });
    })
  );
}

async function requestHtmlExport() {
  if (!panel) {
    vscode.window.showWarningMessage(
      'The HTML Export requires the preview panel to be open, to render content.'
    );
    return;
  }

  // set the receiving handler
  svgHandler = exportHtml;

  // Send a message to the Viewer, requesting the current SVG.
  await panel.webview.postMessage({ command: 'requestSvg' });
}

async function requestSvgExport() {
  if (!panel) {
    vscode.window.showWarningMessage(
      'The SVG Export requires the preview panel to be open, to render content.'
    );
    return;
  }

  // set the receiving handler
  svgHandler = exportSvg;

  // Send a message to the Viewer, requesting the current SVG.
  await panel.webview.postMessage({ command: 'requestSvg' });
}

function initializePanel(context: vscode.ExtensionContext) {
  panel = createPanel(context);

  // Receiving messages from the Viewer.
  panel.webview.onDidReceiveMessage((message) => {
    switch (message.name) {
      case 'click':
        // Select the character in the editor.
        select(message.startChar, message.endChar);
        break;

      case 'svgExport':
        const svg = message.content;
        svgHandler(svg);
        break;
    }

    // try {
    // } catch (error: any) {
    //   outputChannel.appendLine(error);
    //   outputChannel.show();
    //   vscode.window.showErrorMessage(error);
    // }
  });
}

/**
 * open the preview window to the side.
 */
async function showPreview(context: vscode.ExtensionContext) {
  initializePanel(context);

  panel.webview.html = await getHtml(context, getFileNameFromEditor());
}

/**
 * Export command. Render the sheet in HTML and open in a browser.
 * @param context vs code context
 */
async function exportHtml(svg: string) {
  // if (editor?.document.isUntitled) {
  //   vscode.window.showInformationMessage(
  //     'Please save document before exporting.'
  //   );
  // }

  // generate HTML with the SVG inside.
  
  // load HTML template
  const templatePath = path.join(_context.extensionPath, 'res', 'export.html');
  let html = await loadFileContent(templatePath);
  html = html.replace('{{body}}', svg);
  
  const editorFilePath = getEditorFilePath();
  const filePath = editorFilePath + '.html';
  saveToFile(filePath, html);

  vscode.window.showInformationMessage('HTML exported to', filePath);

  // Open browser.
  let url = filePath.replaceAll('\\', '/');
  url = 'file:///' + url;
  await vscode.env.openExternal(vscode.Uri.parse(url));
}

function exportSvg(svg: string) {
  const editorFilePath = getEditorFilePath();
  // getEditorFilename()
  //let filePath = getTempFilePath(editorFilename + '.svg');
  const filePath = editorFilePath + '.svg';

  saveToFile(filePath, svg);

  vscode.window.showInformationMessage('SVG exported to', filePath);
}

function getCurrentEditorContent(): string {
  const editor = getEditor();

  const editorContent = getNormalizedEditorContent(editor);
  return editorContent;
}

function getEditorFilePath(): string {
  const editor = getEditor();
  if (!editor) {
    return '';
  }

  const filePath = editor?.document.fileName;
  return filePath;
}

function getFileNameFromEditor() {
  const filePath = getEditorFilePath();
  const arr = filePath.split(path.sep);

  return arr[arr.length - 1];
}

/**
 * Get a filename for saving HTML.
 */
function getHtmlFilenameForExport(): string {
  let filePath: string;
  const editor = getEditor();

  // if document is untitled, use tmp file.
  if (editor?.document.isUntitled) {
    filePath = getTempFilenameForExport();
  } else {
    // existing file?
    filePath = editor?.document.fileName as string;
    filePath += '.html';

    // Depending on the window from which the command was executed, this might be
    // just a title, an invalid path.
    if (!path.isAbsolute) {
      filePath = getTempFilenameForExport();
    }
  }

  return filePath;
}

function getTempFilenameForExport() {
  const filePath = getTempFilePath('abcjs-vscode-printPreview.html');
  return filePath;
}

function getTempFilePath(filename: string) {
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, filename);
  return filePath;
}

/**
 * Read the configuration settings and prepare abcjs Options object.
 */
function readConfiguration(): object {
  const editor = getEditor();
  const currentDocument = editor?.document;
  const configuration = vscode.workspace.getConfiguration(
    'abcjs-vscode',
    currentDocument?.uri
  );

  // specific settings
  const tablatureValue: string | undefined = configuration.get('sheet.tablature');
  const tablature = tablatureValue 
    ? [{ instrument: tablatureValue.toLowerCase() }] : undefined;

  const options = {
    // Page Formatting
    oneSvgPerLine: configuration.get('pageFormatting.oneSvgPerLine'),
    responsive: configuration.get('pageFormatting.responsive'),
    print: configuration.get('pageFormatting.print'),
    // Sheet
    showDebug: configuration.get('sheet.showDebug') ? ['grid', 'box'] : [],
    jazzchords: configuration.get('sheet.jazzchords'),
    tablature: tablature,
    // Transposition
    visualTranspose: configuration.get('transposition.visualTranspose'),
    showTransposedSource: configuration.get('transposition.showTransposedSource')
  };
  return options;
}

async function updatePreview(
  eventArgs: vscode.TextEditor | vscode.TextDocumentChangeEvent
) {
  const editor = getEditor();

  if (!editor) {
    //throw new Error('No text editors available!');
    return;
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

  const editorContent = getNormalizedEditorContent(editor);

  await panel.webview.postMessage({
    command: 'contentChange',
    content: editorContent,
  });

  panel.title = 'abc: ' + getFileNameFromEditor();
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
  html = html.replace('{editorContent}', editorContent);
  html = html.replace('${fileName}', fileName);
  html = html.replace('${title}', fileName);

  return html;
}

function getEditor() {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    // Take the first visible one?!
    editor = vscode.window.visibleTextEditors[0];
  }
  return editor;
}

/**
 * Select the code in the editor between the given locations. Used on sheet click.
 * @param {Number} start
 * @param {Number} end
 */
function select(start: number, end: number) {
  const editor = getEditor();

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

function saveToFile(filePath: string, content: string) {
  let fs = require('fs');
  fs.writeFileSync(filePath, content);
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
  html = html.replace('{{body}}', editorContent);

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
