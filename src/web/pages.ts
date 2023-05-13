import * as vscode from "vscode";
import * as path from "path";

export const getPages = async (
  workspaceFolder: vscode.WorkspaceFolder,
  relDirPath: string
) => {
  const pagesPath = path.join(relDirPath, "pages")
  const pagesDirUri = vscode.Uri.joinPath(workspaceFolder.uri, pagesPath);
  console.log("getting pages from ", pagesDirUri);
  console.log("relDirPath: ", relDirPath);
  try {
    const pages = await vscode.workspace.fs.readDirectory(pagesDirUri);
    console.log("pages is ", pages);
    const files: { [fileName: string]: Uint8Array } = {};

    for (const _page of pages) {
      const page = _page[0];

      if (page.endsWith("py")) {
        const pageRelPath = path.join(pagesPath, page);
        const pageUri = vscode.Uri.joinPath(
          workspaceFolder.uri,
          pageRelPath
        );
        const pageContent = await vscode.workspace.fs.readFile(pageUri);
        files[pageRelPath] = pageContent;
      }
    }
    console.log("files after pages is ", files);

    return files;
  } catch (error) {
    console.info("error in getting pages:", error);
    return {};
  }
};
