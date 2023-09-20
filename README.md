# Welcome to the Streamlit Preview VSCode Extension

This VSCode extension is an adaptation of the [original stlite extension](https://marketplace.visualstudio.com/items?itemName=whitphx.vscode-stlite) in order to work on vscode web editor.

It provides a convenient way to preview Streamlit apps in an integrated VSCode panel. It is powered by a Wasm/Pyodide-ported version of Streamlit, "stlite", that runs on the browser without servers. This unique feature allows the extension to run on both VSCode desktop and VSCode Web, such as on the Github.dev, without the need for setup of Python or other dependencies. This makes serverless and full-remote development of Streamlit apps a reality.

## Usage

To use this extension, follow these steps:

1. Open the python entry file for your app
1. click on the stlite icon on the activity bar and click on the "Launch stlite preview" button
5. The preview of your Streamlit app will be shown in the integrated VSCode panel.

## Python Dependencies

The dependencies required to run your Streamlit app are read from the `requirements.txt` file. The package names must be written line by line in the file. When the preview panel is launched, the dependencies are installed. If the `requirements.txt` file is updated after the panel is launched, the installation will run again.

## stlite Restrictions and Differences

Please note that "stlite" is a customized version of Streamlit and may have some differences and restrictions compared to the original Streamlit. For more information, please see the GitHub repository for stlite: https://github.com/whitphx/stlite#limitations.

## Offline Usage

The current version of this extension uses `@stlite/mountable` in the same way as [described in the stlite README](https://github.com/whitphx/stlite#limitations), which means that the stlite resources are downloaded from the CDN every time the extension is launched. As a result, the extension cannot start offline.
