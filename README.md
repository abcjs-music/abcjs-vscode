# abcjs-vscode

This is an editor for the ABC music notation, powered by the [abcjs](https://abcjs.net/) library.

It is an extension for Visual Studio Code and is available at [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=alensiljak.abcjs-vscode) or through the Extensions panel in VS Code.

ABC notation - 🔤 - is known as the "Markdown for music". Learn more at the ABC Notation [homepage](https://abcnotation.com/).

## Features

The extension displays the music sheet based on the Abc notation in the current editor.
Clicking the note on the displayed sheet will select it in the editor.

Minimalistic tune

![Screenshot 1](https://imgur.com/v5y0qVB.png)

And a bit more elaborate:

![Screenshot 2](https://imgur.com/HMILUbe.png)

### Print Preview

This command will display a print-ready sheet in a browser. There you can print it to PDF or paper.

![Print Preview](https://imgur.com/4enTxxd.png)

### Export

The Export command will export an HTML page with the rendered score sheet.

The Export SVG command will export the score sheet as SVG.

## Usage

Press Ctrl+Shift+P and type "abcjs" to access the available commands.

Available commands: 
- `abcjs-vscode: Show Preview`
- `abcjs-vscode: Print Preview`
- `abcjs-vscode: Export Sheet to HTML`
- `abcjs-vscode: Export Sheet as SVG`

The Viewer works both with new text files in the editor and existing `.abc` files.

## Requirements

The abcjs library is currently loaded from CDN and not packaged with the extension.

## Extension Settings

In VSCode Settings, look for `abcjs vscode` configuration section. Editing the settings will apply them immediately to the Viewer. For convenience, you can arrange the window layout and keep the Settings window open in order to apply the settings to the current sheet preview.

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

`npm run deploy`

- [Bundling](https://code.visualstudio.com/api/working-with-extensions/bundling-extension)

Note that the vscode engine version must start with a cared (^), otherwise it gets rejected by vscode on installation most of the time.

# License

See [license](LICENSE).

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
