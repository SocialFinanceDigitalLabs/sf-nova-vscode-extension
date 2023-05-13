import * as vscode from "vscode";
import * as path from "path";

const requirementsFileName = "requirements.txt";

export function parseRequirementsTxt(content: string): string[] {
  return content
    .split("\n")
    .filter((r) => !r.startsWith("#"))
    .map((r) => r.trim())
    .filter((r) => r !== "");
}

export const getRequirements = async (
  workspaceFolder: vscode.WorkspaceFolder,
  relDirPath: string
) => {
  const reqPath = path.join(relDirPath, requirementsFileName)
  const reqUri = vscode.Uri.joinPath(
    workspaceFolder.uri,
    reqPath
  );

  let requirements: string[] = [];
  try {
    const requirementsContent = await vscode.workspace.fs.readFile(reqUri);
    requirements = parseRequirementsTxt(
      new TextDecoder().decode(requirementsContent)
    );
  } catch (error) {
    console.info("error in getting requirements:", error);
  }
  return requirements;
};
