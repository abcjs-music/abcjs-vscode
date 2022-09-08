# abcjs-vscode

This is an editor for the ABC music notation, utilizing [abcjs](https://abcjs.net/) library.

ABC notation is the "Markdown for music". Learn more at https://abcnotation.com/.

Available at [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=alensiljak.abcjs-vscode) or through the Extensions panel in VS Code.

## Features

The extension displays the music sheet based on the Abc notation in the current editor.
Clicking the note on the displayed sheet will select it in the editor.

Minimalistic tune

![Screenshot 1](https://imgur.com/v5y0qVB.png)

And a bit more elaborate:

![Screenshot 2](https://imgur.com/HMILUbe.png)

## Usage

The only action available currently is "abcjs-vscode: Show Preview".
Press Ctrl+Shift+P and type "abcjs" to access it.

## Requirements

The abcjs library is currently loaded from CDN and not packaged with the extension.

## Extension Settings

There are currently no settings for the extension. It works on blank new files and existing .abc files.

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

See [CHANGELOG.org](CHANGELOG.org).

--------------------------------------------------------------------------------------------------

# Development

The package manager is npm.

## Publishing

`npm run publish`

- [Bundling](https://code.visualstudio.com/api/working-with-extensions/bundling-extension)

# References

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

vsce publish
Use a local version with
npm run publish
~yarn vsce publish~.
-->
