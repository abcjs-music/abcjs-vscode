// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
let abcjs = require("abcjs");
//import abcjs from 'abcjs'
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

let panel = null;

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
  let disposable = vscode.commands.registerCommand(
    "abcjs-editor.helloWorld",
    function () {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from abcjs editor!");
    }
  );

  context.subscriptions.push(disposable);

  // abcjs preview

  const outputChannel = vscode.window.createOutputChannel(
    "abcjs-vscode errors"
  );
  // Show the viewer
  let viewer = vscode.commands.registerCommand("abcjs-vscode.showPreview", () =>
    showPreview(context, outputChannel)
  );
  context.subscriptions.push(viewer);

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
 * open the preview window to the side.
 */
function showPreview(context, outputChannel) {
  console.log("registering the viewer");

  //vscode.window.showInformationMessage('Opening the preview in abcjs editor!');
  panel = vscode.window.createWebviewPanel(
    "musicSheet",
    "Music Sheet",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
    }
  );

  var abc = `X: 1
  T: Cooley's
  M: 4/4
  L: 1/8
  K: Emin
  |:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|
  EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|
  |:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg|
  eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|`;

  // panel.webview.html = getWebviewContent(
  // 	getNormalizedEditorContent(vscode.window.activeTextEditor), context.extensionPath);
  //const dom = new JSDOM(`<!DOCTYPE html><html><body>
  const html = `<!DOCTYPE html><html><body>
		<h1>Preview</h1>
		<div id="paper"></div>
		<script src="https://gitcdn.link/repo/paulrosen/abcjs/main/bin/abcjs_basic_6.0.0-beta.27-min.js"></script>
		<script>
		document.addEventListener("DOMContentLoaded", function (event) {
			console.log('document loaded. abc:', ABCJS);

			var paper = document.getElementById('paper');
			ABCJS.renderAbc('paper', 'F2 c2');
		});
		</script>
		</body></html>`;

  const html1 = `<!DOCTYPE html><html><body>
		<div id="paper"></div>
		<script src="https://gitcdn.link/repo/paulrosen/abcjs/main/bin/abcjs_basic_6.0.0-beta.27-min.js"></script>
		<script>
		document.addEventListener("DOMContentLoaded", function (event) {
			//ABCJS.renderAbc("paper", tune);
	
			var paper = document.getElementById('paper');
			console.log('do we have a paper?', paper)
			if (!paper) {
				// Editor
	
				new ABCJS.Editor('abc', {
					canvas_id: 'paper',
					warnings_id: 'warnings',
					abcjsParams: {
						responsive: "resize"
					}
				});
			}
			if (paper) {
				abcjs.renderAbc("paper", '${abc}');
			}
		});
	</script>
		</body></html>`;
  //console.log(dom.window.document.querySelector("p").textContent); // "Hello world"

  //   try {
  //     const abcObject = await abcjs.renderAbc("paper", abc);
  //     console.log(abcObject);
  //   } catch (error) {
  //     console.error(error);
  //   }

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
  });
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

class AbcjsPreviewProvider {
  constructor(extensionUri) {
    this._view = null;
    this._extensionUri = extensionUri;

    console.log("extension uri:", extensionUri);
  }

  static viewType = "abcjs-vscode.abcView";

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
          vscode.window.activeTextEditor?.insertSnippet(
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
