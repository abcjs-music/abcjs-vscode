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
  // Show the viewer
  let viewer = vscode.commands.registerCommand("abcjs-vscode.showPreview", () =>
    showPreview(context, outputChannel)
  );
  context.subscriptions.push(viewer);

  // Update preview on code change.
  vscode.workspace.onDidChangeTextDocument((eventArgs) => {
    if (eventArgs.document.languageId == "abc") {
      //   let html = getWebviewContent(getNormalizedEditorContent(vscode.window.activeTextEditor),
      //     context.extensionPath
      //   );
	  const editorContent = getNormalizedEditorContent(vscode.window.activeTextEditor)
      const html = getHtml(editorContent);

      if (panel != null) {
        panel.webview.html = html;
      }
    }
  });

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
		  <script src="https://gitcdn.link/repo/paulrosen/abcjs/main/bin/abcjs_basic_6.0.0-beta.27-min.js"></script>
		  <script>
		  	  const vscode = acquireVsCodeApi();
		  
		      document.addEventListener("DOMContentLoaded", function (event) {
			  console.log('document loaded. abc:', ABCJS);
  
			  var paper = document.getElementById('paper');
			  ABCJS.renderAbc('paper', \`${editorContent}\`,  {
				  responsive: "resize"
			  });
		  });
		  </script>
		  </body></html>`;

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

  const html = getHtml()

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

function getNormalizedEditorContent(editor) {
	if (editor == null) {
		return "";
	}

	let content = editor?.document.getText();

	if (editor?.document.eol == vscode.EndOfLine.CRLF) {
		content = content.replace(/\r\n/g, "\n");
	}

	return content;
}

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
