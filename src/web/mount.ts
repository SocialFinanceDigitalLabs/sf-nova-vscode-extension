import * as vscode from "vscode";
import * as path from "path";
import { getRequirements } from "./requirements";
import { getPages } from "./pages";

export function getDirectoryPath(filePath: string) {
  const lastSlashIndex = filePath.lastIndexOf("/");
  return filePath.substring(0, lastSlashIndex);
}

export const getMountOptions = async (
  fileUri: vscode.Uri,
  workspaceFolder: vscode.WorkspaceFolder
) => {
  const relPath = path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath);
  const relDirPath = getDirectoryPath(relPath);

  // get requirements and pages content
  const requirements = await getRequirements(workspaceFolder, relDirPath);
  const pages = await getPages(workspaceFolder, relDirPath);
  const files: { [fileName: string]: Uint8Array } = { ...pages };

  // get main page content
  const content = await vscode.workspace.fs.readFile(fileUri);
  files[relPath] = content;

  return {
    requirements: requirements,
    entrypoint: relPath,
    files: files,
    allowedOriginsResp: {
      // The `withHostCommunication` HOC in Streamlit's frontend accepts messages from the parent window on these hosts.
      allowedOrigins: [
        "vscode-webview://*", // For VSCode desktop
        "https://*.vscode-cdn.net", // For vscode.dev
      ],
      useExternalAuthToken: false,
    },
  }; // NOTE: This must be JSON-encodable.
};
