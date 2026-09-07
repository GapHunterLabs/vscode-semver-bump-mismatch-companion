/**
 * Pure logic -- no `vscode` dependency. Ported from the IntelliJ-
 * family semver-bump-mismatch-companion (ChangelogParser + SemVer +
 * SemverBumpChecker), already a hand-rolled line-oriented parser with
 * zero PSI dependency in the original.
 */

export interface ChangelogEntry {
  version: string;
  headerLine: number; // 1-based
  bodyText: string;
}

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

export interface MismatchHit {
  entry: ChangelogEntry;
  previousVersion: string;
}

const HEADER = /^##\s*\[([^\]]+)\]/;

/** Hand-rolled parser for Keep a Changelog format (`## [X.Y.Z] -
 * YYYY-MM-DD` or `## [X.Y.Z]` release headers, an optional
 * `## [Unreleased]` at the top). Returns every release section found,
 * in file order (Keep a Changelog convention: newest first). */
export function parseChangelog(text: string): ChangelogEntry[] {
  const lines = text.split('\n');
  const headers: { version: string; line: number }[] = [];
  lines.forEach((line, index) => {
    const match = HEADER.exec(line);
    if (match) headers.push({ version: match[1].trim(), line: index });
  });
  if (headers.length === 0) return [];

  return headers.map((header, index) => {
    const bodyStart = header.line + 1;
    const bodyEnd = headers[index + 1]?.line ?? lines.length;
    const bodyText = lines.slice(bodyStart, bodyEnd).join('\n');
    return { version: header.version, headerLine: header.line + 1, bodyText };
  });
}

export function parseSemVer(text: string): SemVer | null {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(text);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

const BREAKING_MARKER = /breaking/i;
// Keep a Changelog's own standard "### Removed" section header --
// documented there as "for now removed features". Removing a feature/
// API is a breaking change by definition, same strength of signal as
// the literal word "BREAKING". Deliberately NOT "### Deprecated" -- a
// deprecation warns of a *future* removal without breaking anything yet.
const REMOVED_SECTION = /^\s*#{1,4}\s*Removed\b/im;

/** Compares each release entry against the one immediately before it
 * (newest-first order) -- flags a release whose body text reads as a
 * breaking change but whose version only bumped MINOR or PATCH.
 * [Unreleased] is skipped (no real version to compare); a 0.x.y major
 * of 0 is skipped entirely (SemVer treats the whole 0.x line as
 * "anything can break"). */
export function findMismatches(entries: ChangelogEntry[]): MismatchHit[] {
  const releases = entries.filter((entry) => entry.version !== 'Unreleased');
  const hits: MismatchHit[] = [];

  for (let i = 0; i < releases.length - 1; i++) {
    const newer = releases[i];
    const older = releases[i + 1];

    const newerSemVer = parseSemVer(newer.version);
    const olderSemVer = parseSemVer(older.version);
    if (!newerSemVer || !olderSemVer) continue;
    if (newerSemVer.major === 0) continue;

    const isBreaking = BREAKING_MARKER.test(newer.bodyText) || REMOVED_SECTION.test(newer.bodyText);
    const majorBumped = newerSemVer.major > olderSemVer.major;
    if (isBreaking && !majorBumped) {
      hits.push({ entry: newer, previousVersion: older.version });
    }
  }

  return hits;
}
