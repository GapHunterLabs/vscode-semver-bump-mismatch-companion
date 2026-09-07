# Semver Bump Mismatch Companion (VS Code)

Flags a `CHANGELOG.md` release whose own text reads as a breaking
change but whose version only bumped MINOR or PATCH — no data leaves
your editor.

**v0.1, pilot.** Part of the Gap Hunter Labs VS Code workstream,
ported from the IntelliJ-family `semver-bump-mismatch-companion`. No
VS Code Marketplace equivalent found — existing changelog/version
tools handle *executing* a bump, not verifying whether a past bump's
severity actually matched its content.

## What it does

Parses a [Keep a Changelog](https://keepachangelog.com/)-format
`CHANGELOG.md` (`## [X.Y.Z] - YYYY-MM-DD` headers) and compares each
release against the one right before it. A release is flagged when:

- its body text contains "BREAKING" (case-insensitive — the same
  marker Conventional Commits uses), or a `### Removed` section
  (removing a feature/API is a breaking change by definition), **and**
- its version only bumped MINOR or PATCH versus the previous release,
  never MAJOR.

`[Unreleased]` is never checked (no real version to compare against
yet), and `0.x.y` releases are skipped entirely — SemVer itself treats
the whole `0.x` line as "anything can break".

## Privacy

See [PRIVACY.md](PRIVACY.md) — zero network calls, everything runs
against `CHANGELOG.md` already open in your editor.

## Development

```bash
npm install
npm run compile   # or: npm run watch
npm test
```

To build an installable package without publishing:

```bash
npx @vscode/vsce package
```

## License

Apache License 2.0 — see [LICENSE](LICENSE).
