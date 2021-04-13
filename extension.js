// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");

let panel = null;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)

  // The command has been defined in the package.json file
  // The commandId parameter must match the command field in package.json
  //   let disposable = vscode.commands.registerCommand(
  //     "abcjs-editor.helloWorld",
  //     function () {
  //       // The code you place here will be executed every time your command is executed

  //       // Display a message box to the user
  //       vscode.window.showInformationMessage("Hello World from abcjs editor!");
  //     }
  //   );
  //   context.subscriptions.push(disposable);

  // abcjs preview

  const outputChannel = vscode.window.createOutputChannel(
    "abcjs-vscode errors"
  );
  // Register the command to Show the Viewer.
  let viewer = vscode.commands.registerCommand("abcjs-vscode.showPreview", () =>
    showPreview(context, outputChannel)
  );
  context.subscriptions.push(viewer);

  // Update the Preview when code changes.
  vscode.workspace.onDidChangeTextDocument((eventArgs) => {
    console.log('changed', eventArgs);
    updatePreview(eventArgs)
  });
}

function updatePreview(eventArgs) {
  const language = eventArgs.document.languageId;
  //console.log(language)
  // plaintext is for unsaved files.

  if (language !== "abc" && language !== "plaintext") {
    console.log('language is', language)
    return
  }

  //   let html = getWebviewContent(getNormalizedEditorContent(vscode.window.activeTextEditor),
  //     context.extensionPath
  //   );
  const editorContent = getNormalizedEditorContent(
    vscode.window.activeTextEditor
  );
  const html = getHtml(editorContent);

  if (panel != null) {
    panel.webview.html = html;
  }
}

function registerWebViewProvider() {
  // Web View preview
  // https://github.com/microsoft/vscode-extension-samples/blob/master/webview-view-sample/src/extension.ts
  //   const provider = new AbcjsPreviewProvider(context.extensionUri);
  //   context.subscriptions.push(
  //     vscode.window.registerWebviewViewProvider(
  //       AbcjsPreviewProvider.viewType,
  //       provider
  //     )
  //   );
  //   context.subscriptions.push(
  //     vscode.commands.registerCommand(
  //       "abcjs-vscode.showPreview",
  //       provider.renderAbc
  //     )
  //   );
}

/**
 * Generate the Preview HTML.
 * @param {String} editorContent
 */
function getHtml(editorContent) {
  const html = `<!DOCTYPE html><html>
	  <head>
		  <meta charset="UTF-8">
		  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  </head>
		<body>
		  <h1>Preview</h1>
		  <div id="paper"></div>
		  <script src="https://cdn.jsdelivr.net/npm/abcjs@6.0.0-beta.32/dist/abcjs-basic-min.js"></script>
		  <script>
		  	const vscode = acquireVsCodeApi();
        console.log('api:', vscode)
		  
		    document.addEventListener("DOMContentLoaded", function (event) {
			    //console.log('document loaded. abc:', ABCJS);
  
          var paper = document.getElementById('paper');
          ABCJS.renderAbc('paper', \`${editorContent}\`,  {
            responsive: "resize",
            clickListener: function(abcElem, tuneNumber, classes) {
              console.log('clicked:', abcElem, tuneNumber, classes);

              vscode.postMessage({
                //abcElem: abcElem,
                startChar: abcElem.startChar,
                endChar: abcElem.endChar,
                tuneNumber: tuneNumber,
                classes: classes
              });
            }
          });
		  });
		  </script>
		  </body>
      </html>`;

  return html;
}

/**
 * open the preview window to the side.
 */
function showPreview(context, outputChannel) {
  console.log("registering the viewer");

  //vscode.window.showInformationMessage('Opening the preview in abcjs editor!');
  panel = vscode.window.createWebviewPanel(
    "abcjsPreview",
    "abcjs preview",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
    }
  );

  const editorContent = getNormalizedEditorContent(
    vscode.window.activeTextEditor
  );

  const html = getHtml(editorContent);

  panel.webview.html = html;

  // handle messages from the webview
  // panel.webview.onDidReceiveMessage(message => {
  // 	switch (message.command) {
  // 		case 'selection':
  // 			jumpToPosition(message.start, message.stop);
  // 			return;
  // 	}
  // }, undefined, context.subscriptions);
  panel.webview.onDidReceiveMessage((message) => {
    console.log(message);
    // Receiving only the element-selection messages at the moment.
    // Select the character in the editor.

    try {
      select(message.startChar, message.endChar);
    } catch (error) {
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
    return "";
  }

  //let content = editor?.document.getText();
  let content = editor.document.getText();

  // escape the \
  content = content.replaceAll('\\', '\\\\')

  if (editor.document.eol == vscode.EndOfLine.CRLF) {
    content = content.replace(/\r\n/g, "\n");
  }

  return content;
}

// this method is called when your extension is deactivated
function deactivate() {}

class AbcjsPreviewProvider {
  // static viewType = "abcjs-vscode.abcView";

  constructor(extensionUri) {
    this._view = null;
    this._extensionUri = extensionUri;

    console.log("extension uri:", extensionUri);
  }

  resolveWebviewView(webviewView, context, _token) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "colorSelected": {
          vscode.window.activeTextEditor.insertSnippet(
            new vscode.SnippetString(`#${data.value}`)
          );
          break;
        }
      }
    });
  }

  renderAbc() {
    console.log("rendering output");
  }

  _getHtmlForWebview(webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.css")
    );

    // Use a nonce to only allow a specific script to be run.
    //const nonce = getNonce();
    const nonce = "once?";

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				
				<title>Cat Colors</title>
			</head>
			<body>
				<ul class="color-list">
				</ul>
				<button class="add-color-button">Add Color</button>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

module.exports = {
  activate,
  deactivate,
};
