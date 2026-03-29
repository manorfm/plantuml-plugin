# Changelog

## [0.10.12] - 2026-03-29

- **Config:** `plantumlConnectionSettings` — normalização partilhada com `readPlantumlConfig`.
- **Tests:** shell HTML do custom editor; `buildPreviewHtml` / fragmentos do diagrama; `fetchPngDiagram` com `fetch` mockado; limiares `c8` alinhados à suíte.

## [0.10.11] - 2026-03-29

- Testes de `debounce` e cache SVG; `clearDiagramSvgCache()` para isolamento em testes.

## [0.10.10] - 2026-03-29

- **CI:** GitHub Actions (compile, Extension Host, `test:coverage:unit`).
- **Constantes:** `PREVIEW_ZOOM_*` em `constants/previewZoomLimits.ts` para testes sem carregar `vscode` no subset Node.
- **Docs:** [`docs/testing.md`](docs/testing.md).

## [0.10.9] - 2026-03-29

- **Ctrl/Cmd + wheel zoom** keeps the diagram point under the cursor fixed by adjusting scroll after each zoom step.

## [0.10.8] - 2026-03-29

- **Diagram zoom:** Ctrl/Cmd + mouse wheel over the diagram area adjusts zoom; value is persisted to **Preview Zoom** (debounced). Plain wheel scrolls the diagram panel.

## [0.10.7] - 2026-03-29

- Marketplace listing and README shortened for clarity.

## [0.10.6] - 2026-03-29

- Listing categories and documentation updates.

## [0.10.5] - 2026-03-29

- Icon and Marketplace metadata improvements.

## Earlier versions

See the repository history on GitHub.
