import * as vscode from 'vscode';
import { parseChangelog, findMismatches } from './semverBump';

let diagnostics: vscode.DiagnosticCollection;

function basename(uri: vscode.Uri): string {
  const path = uri.path;
  return path.slice(path.lastIndexOf('/') + 1);
}

function refresh(document: vscode.TextDocument): void {
  if (basename(document.uri) !== 'CHANGELOG.md') return;

  const entries = parseChangelog(document.getText());
  const hits = findMismatches(entries);
  const result = hits.map((hit) => {
    const line = hit.entry.headerLine - 1;
    const range = new vscode.Range(line, 0, line, Number.MAX_SAFE_INTEGER);
    const diagnostic = new vscode.Diagnostic(
      range,
      `Release ${hit.entry.version} mentions "BREAKING" (or a Removed section) but only bumped minor/patch versus ${hit.previousVersion} -- SemVer expects a MAJOR bump for a breaking change.`,
      vscode.DiagnosticSeverity.Warning,
    );
    diagnostic.source = 'Semver Bump Mismatch Companion';
    return diagnostic;
  });
  diagnostics.set(document.uri, result);
}

export function activate(context: vscode.ExtensionContext): void {
  diagnostics = vscode.languages.createDiagnosticCollection('semverBumpMismatchCompanion');
  context.subscriptions.push(diagnostics);

  vscode.workspace.textDocuments.forEach(refresh);

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(refresh),
    vscode.workspace.onDidChangeTextDocument((event) => refresh(event.document)),
    vscode.workspace.onDidCloseTextDocument((document) => diagnostics.delete(document.uri)),
  );
}

export function deactivate(): void {
  diagnostics?.dispose();
}
