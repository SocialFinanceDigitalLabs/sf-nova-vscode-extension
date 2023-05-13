import * as path from "path";
import * as vscode from "vscode";

import { PromiseDelegate } from "./promise-delegate";
import { getWebviewContent } from "./webview";
import { parseRequirementsTxt } from "./requirements";

import { getMountOptions } from "./mount";

const STLITE_VERSION = "0.31.0";
const requirementsFileName = "requirements.txt";

let panel: vscode.WebviewPanel | undefined = undefined;
let panelInitializedPromise = new PromiseDelegate<void>();

export function activate(context: vscode.ExtensionContext) {
  console.log('"vscode-stlite" is now active in the web extension host.');

  const disposable = vscode.commands.registerCommand(
    "stlite.start",
    async () => {
      if (panel) {
        panel.reveal();
        return;
      }
      setFileWatcher();

      if (!vscode.window.activeTextEditor) {
        return vscode.window.showErrorMessage(
          "Please ensure you have your app python file (.py) opened and focused on."
        );
      }
      const fileUri = vscode.window.activeTextEditor?.document.uri;
      if (!fileUri.path.endsWith(".py")) {
        return vscode.window.showErrorMessage(
          "Please ensure you have your app python file (.py) opened and focused on."
        );
      }
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
      if (!workspaceFolder) {
        return;
      }

      panel = vscode.window.createWebviewPanel(
        "stlite",
        "stlite preview",
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );
      panel.onDidDispose(
        () => {
          panel = undefined;
        },
        undefined,
        context.subscriptions
      );

      panelInitializedPromise = new PromiseDelegate();
      panel.webview.html = getWebviewContent(STLITE_VERSION);
      panel.webview.onDidReceiveMessage(
        (message) => {
          console.debug("Received message from webview:", message);
          // NOTE: There are both types of messages from the webview,
          //       messages defined for stlite's functionality, and
          //       Streamlit's iframe messages transmitted from the `withHostCommunication` HOC and relayed by the mocked `window.parent.postMessage` in the WebView,
          switch (message.type) {
            case "init:done": {
              panelInitializedPromise.resolve();
              return;
            }
            case "GUEST_READY": {
              // Override the base URL for page links in MPA to solve the problem of https://github.com/whitphx/stlite/issues/519.
              // On vscode.dev, the base URL is set as `https://...` because `window.location.protocol` is `https://` and it is used as https://github.com/streamlit/streamlit/blob/1.19.0/frontend/src/components/core/Sidebar/SidebarNav.tsx#L106,
              // however, links with such href values in WebView panels on vscode.dev will open unnecessary new tabs
              // when clicked even if the `onClick` handler is set and `e.preventDefault()` is called.
              // So, we have to override the base URL with the `vscode-webview://` protocol, which doesn't open new tabs on vscode.dev.
              panel?.webview.postMessage({
                stCommVersion: 1,
                type: "SET_PAGE_LINK_BASE_URL",
                pageLinkBaseUrl: "vscode-webview://stlite",
              });
              return;
            }
          }
        },
        undefined,
        context.subscriptions
      );

      // set paths
      const mountOptions = await getMountOptions(fileUri, workspaceFolder);
      initStlite(mountOptions);
    }
  );
  context.subscriptions.push(disposable);
}

async function initStlite(mountOptions: unknown) {
  console.debug("[stlite] Initialize: " + mountOptions);
  if (panel == null) {
    console.warn("[stlite] Panel has not been created.");
    return;
  }

  panel.webview.postMessage({
    type: "init",
    data: {
      mountOptions,
    },
  });

  await panelInitializedPromise.promise;
  console.debug("[stlite] Initialization request completed");
}

const setFileWatcher = () => {
  const fileWatcher = vscode.workspace.createFileSystemWatcher("**/*");
  fileWatcher.onDidCreate(writeFile);
  fileWatcher.onDidChange(writeFile);
  fileWatcher.onDidDelete(deleteFile);
};

function deleteFile(uri: vscode.Uri) {
  console.debug("[stlite] Delete file: " + uri.path);
  if (panel == null) {
    return;
  }
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  if (!workspaceFolder) {
    return;
  }
  const relPath = path.relative(workspaceFolder.uri.path, uri.path);
  console.debug("[stlite]  RelPath: " + relPath);
  panel.webview.postMessage({
    type: "file:delete",
    data: {
      path: relPath,
    },
  });
}

const writeFile = async (uri: vscode.Uri) => {
  console.debug("[stlite] Write file: " + uri.path);
  if (panel == null) {
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  if (!workspaceFolder) {
    return;
  }
  const relPath = path.relative(workspaceFolder.uri.path, uri.path);
  const content = await vscode.workspace.fs.readFile(uri);

  if (relPath === requirementsFileName) {
    const requirements = parseRequirementsTxt(
      new TextDecoder().decode(content)
    );

    panel.webview.postMessage({
      type: "install",
      data: {
        requirements,
      },
    });
    return;
  }

  panel.webview.postMessage({
    type: "file:write",
    data: {
      path: relPath,
      content,
    },
  });
};

// This method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
