# Changelog

All notable changes to this project are documented in this file.

## [0.10.5] - 2026-03-29

### Changed

- Marketplace-oriented metadata: `keywords`, `galleryBanner`, refined `categories` for discoverability.
- User-facing documentation (`README.md`, `docs/editor-behavior-spec.md`) is now **English** for the VS Code Marketplace and international users.
- Short `description` in `package.json` clarified for privacy (diagram text sent over HTTP to the configured server).
- Added `bugs` URL (same placeholder host as `repository`; replace when you publish under a real GitHub org).

### Fixed

- Unreferenced `media/icon_2.jpg` is excluded from the VSIX via `.vscodeignore` to keep the published package smaller.

## [0.10.4] - 2026-03-29

### Added

- Extension icon (`media/icon.png`) referenced by the `icon` field in `package.json`.

### Changed

- Patch release with packaging and README install examples updated for the new version.

## Earlier versions

See `git log` and release tags for full history prior to this changelog.
