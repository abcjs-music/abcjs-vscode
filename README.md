# abcjs-vscode

This is the Abc music notation extension using abcjs library.

Available at [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=alensiljak.abcjs-vscode) or through the Extensions panel in VS Code.

Currently ALPHA state but functional, nonetheless. It will *NOT* destroy anything. Quite the contrary, it may already be useful enough.

## Features

The extension displays the music sheet based on the Abc notation in the current editor.
Clicking the note on the displayed sheet will select it in the editor.

TODO: Add images.

## Usage

The only action available currently is "abcjs-vscode.showPreview".
Press Ctrl+Shift+P and type "abcjs" to access it.

## Requirements

The abcjs library is currently loaded from CDN and not packaged with the extension.

## Extension Settings

There are currently no settings for the extension. It works on blank new files and .abc files.

<!--
Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something
-->

## Known Issues

The line-endings in the file need to be set to LF instead of CRLF (on Windows). Then the offsets will match between the sheet and the abc code.

## Release Notes

Significant changes

### 0.0.x

Prototyping!
Initial release of abcjs-vscode.
Code coloring and sheet rendering from the text in the editor.
It is possible to select the notes by clicking the sheet.

-----------------------------------------------------------------------------------------------------------



## References

- https://github.com/softawaregmbh/vscode-abc/

<!--
Documentation:

- [vscode API](https://code.visualstudio.com/api)
- [Samples](https://github.com/Microsoft/vscode-extension-samples)
- Editor
  - [Custom Editor](https://code.visualstudio.com/api/extension-guides/custom-editors)
  - [Editing sample](https://github.com/microsoft/vscode-extension-samples/blob/master/document-editing-sample/src/extension.ts#L8-L20)
  - [Show Offset extension](https://github.com/ramya-rao-a/show-offset/blob/master/src/extension.ts)
- [Text Document Show Options](https://code.visualstudio.com/api/references/vscode-api#TextDocumentShowOptions)
- [Syntax](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)
- [Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

-->
