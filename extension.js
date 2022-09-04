// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");

let panel = null;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
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
    //console.log('changed', eventArgs);
    updatePreview(eventArgs)
  });
}

function getFileName() {
  const path = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.fileName : "ABC File Not Selected"
  const arr = path.split("/")
  return arr[arr.length - 1]
}

function updatePreview(eventArgs) {
  const language = eventArgs.document.languageId;
  //console.log(language)
  // plaintext is for unsaved files.

  if (language !== "abc" && language !== "plaintext") {
    console.log('language is', language)
    return
  }

  const editorContent = getNormalizedEditorContent(
    vscode.window.activeTextEditor
  );
  if (panel != null) {
    panel.webview.postMessage({ command: 'contentChange', content: editorContent });
  }
}

/**
 * Generate the Preview HTML.
 * @param {String} editorContent
 */
function getHtml(editorContent, fileName) {
  const html = `<!DOCTYPE html><html>
	  <head>
		  <meta charset="UTF-8">
		  <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
      @import url(https://fonts.googleapis.com/css?family=Itim);

      @font-face {
        font-family: 'itim-music';
        src:  	url('https://paulrosen.github.io/abcjs/fonts/itim-music.ttf') format('truetype'),
                url('https://paulrosen.github.io/abcjs/fonts/itim-music.woff') format('woff'),
                url('https://paulrosen.github.io/abcjs/fonts/itim-music.svg#icomoon') format('svg');
        font-weight: normal;
        font-style: normal;
      }
      h1 {
        margin: 0;
        padding: 0;
        flex-grow: 2;
      }
      .top {
        display:flex;
        align-items: flex-top;
        column-gap: 10px;
        justify-content: space-between;
      }
      .options {
        display: flex;
        flex-direction: column;
        margin-bottom: .5em;
        flex-shrink: 2;
        row-gap: 5px;
        border: 1px dotted #888;
      }
      .options > * {
        display: block;
      }
      .width-label {
        width: 80px;
        display: inline-block;
      }
      #source {
        display: none;
      }
      #source.show {
        display: block;
        border: 1px dotted #888;
        padding: 10px;
        margin-top: 10px;
      }
    </style>
	  </head>
		<body>
    <div class="top">
		  <h1 class="title">${fileName}</h1>
      <fieldset class="options">
        <legend>Options</legend>
        <label><input id="jazz-chords" class="option" type="checkbox" checked>Use Jazz Chord Format</label>
        <div>
          <label><span class="width-label">Transpose:</span><input id="transpose" class="option" type="number" min="-12" max="12" value="0"> (half-steps)</label>
          <label><input id="output-transposition" class="option" type="checkbox" checked>Show ABC</label>
        </div>
        <label style="display:none;"><span class="width-label">Tablature:</span><select id="tablature" class="option"><option>None</option><option>Violin</option><option>Guitar</option></select></label>
      <label id="tune-selector"><span class="width-label">Tune:</span><select></select>
      </label>
      </fieldset>
      </div>
      <div id="source"></div>
      <div id="paper"></div>
		  <script src="https://cdn.jsdelivr.net/npm/abcjs@6.1.2/dist/abcjs-basic-min.js"></script>
		  <script>
		  	const vscode = acquireVsCodeApi();
        //console.log('api:', vscode)

        function clickListener(abcElem, tuneNumber, classes) {
          vscode.postMessage({
            //abcElem: abcElem,
            startChar: abcElem.startChar,
            endChar: abcElem.endChar,
            tuneNumber: tuneNumber,
            classes: classes
          })
        }

        var options = {
          startingTune: 0,
          responsive: "resize", 
          clickListener: clickListener,
          format: {
            gchordfont: '"itim-music,Itim" 20'
          },
          jazzchords: document.getElementById("jazz-chords").checked,
          visualTranspose: 0,
        }
        var abc = "";

        function optionChanged() {
          options.jazzchords = document.getElementById("jazz-chords").checked
          options.visualTranspose = document.getElementById("transpose").value
          var tablature = document.getElementById("tablature").value
          switch(tablature) {
            case "none":
              delete options.tablature
              break;
            case "violin":
              options.tablature = [ { instrument: "violin" }]
              break;
            case "guitar":
              options.tablature = [ { instrument: "guitar" }]
              break;
          }
          drawTune()
        }

        function drawTune() {
          ABCJS.renderAbc("paper", abc, options);
          var showSource = document.getElementById("output-transposition").checked
          var source = document.getElementById("source")
          if (showSource && parseInt(options.visualTranspose,10)) {
            var tuneBook = new ABCJS.TuneBook(abc)
            var tune = tuneBook.tunes[options.startingTune]
            if (tune) {
              var visualObj = ABCJS.renderAbc("*", tune.pure);
              source.classList.add("show")
              var output = ABCJS.strTranspose(tune.pure, visualObj, parseInt(options.visualTranspose,10))
              source.innerText = output
            }
          } else {
            source.classList.remove("show")
          }
        }

        var setTune = function() {
          options.startingTune = this.value
          drawTune()
        }

        var optionEls = document.querySelectorAll(".option")
        for (var i = 0; i < optionEls.length; i++) {
          document.addEventListener("change", optionChanged)
        }

        var select = document.querySelector("#tune-selector select")
        select.addEventListener("change", setTune) 

        function analyzeContent() {
          var tuneBook = new ABCJS.TuneBook(abc)
          if (tuneBook.tunes.length >= 2) {
            select.innerHTML = ""
            var option = document.createElement("option");
            var optionContent = document.createTextNode("-- select tune --");
            option.appendChild(optionContent);
            option.setAttribute('value', -1)
            select.appendChild(option)
            for (var i = 0; i < tuneBook.tunes.length; i++) {
              option = document.createElement("option");
              optionContent = document.createTextNode(tuneBook.tunes[i].title);
              option.appendChild(optionContent);
              option.setAttribute('value', i)
              select.appendChild(option)
            }
            select.value = options.startingTune;
            document.getElementById("tune-selector").style.display = "block"
          } else {
            document.getElementById("tune-selector").style.display = "none"
            options.startingTune = 0
          }
        }

        window.addEventListener('message', event => {

          const message = event.data; // The JSON data our extension sent

          switch (message.command) {
              case 'contentChange':
                if (abc !== message.content) {
                  abc = message.content;
                  analyzeContent()
                  drawTune()
                }
                break;
          }
        });

		    document.addEventListener("DOMContentLoaded", function (event) {
          abc = \`${editorContent}\`
          analyzeContent()
          drawTune()
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

  const html = getHtml(editorContent, getFileName());

  panel.webview.html = html;

  panel.webview.onDidReceiveMessage((message) => {
    //console.log(message);
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

  let content = editor.document.getText();

  // escape the \
  content = content.replaceAll('\\', '\\\\')

  if (editor.document.eol == vscode.EndOfLine.CRLF) {
    content = content.replace(/\r\n/g, "\n");
  }

  return content;
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
  activate,
  deactivate,
};
