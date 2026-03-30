# Changelog

## [0.11.14] - 2026-03-30

- **Examples:** `visual-pipeline-sample.puml` simplificado (sem `legend`/`box`/`!theme`/`skinparam` pesados) para renderizar no **servidor público PlantUML** sem HTTP 500; nota curta; `media/readme-preview.png` regenerado.

## [0.11.13] - 2026-03-30

- **README:** Secção **Preview** com imagem `media/readme-preview.png` para o marketplace; esclarecimento: **`modern-dark` em `plantumlViewer.visualTheme` funciona** (defeito da extensão, paleta clara — id histórico); **não** usar `!theme modern-dark` no `.puml`. Tabela de pipeline vs. `!theme` do servidor.

## [0.11.12] - 2026-03-30

- **README:** Imagem de apresentação `media/readme-preview.png` (fluxo editar → pré-visualizar → exportar), gerada a partir de [`examples/visual-pipeline-sample.puml`](examples/visual-pipeline-sample.puml).

## [0.11.11] - 2026-03-30

- **Marketplace:** Palavras-chave ampliadas em `package.json` (`keywords`) para descoberta: PlantUML, UML, Diagram, diagramas, visualização, pré-visualização, SVG, PNG, export.

## [0.11.10] - 2026-03-30

- **Tests:** `architectureImports.test.ts` — `plantuml/rendering/**/*.ts` não importam `plantumlCustomEditorProvider`; `serverClient.ts` não importa `rendering/` (camada HTTP independente do pipeline).
- **Docs / examples:** títulos dos diagramas `examples/architecture*.puml` e `docs/architecture-diagrams.md` alinhados à versão.
- **README:** secção **Install from a local `.vsix`** com exemplo `plantuml-plugin-manorfm-0.11.10.vsix` e nota de que o nome segue `package.json` → `version`.

## [0.11.9] - 2026-03-30

- **Tests:** `architectureImports.test.ts` — regras de acoplamento (export / registry / formatação / barra de estado não importam `plantumlCustomEditorProvider`); verificação de **ciclos** em `src/` com **madge** na suíte `test:coverage:unit` (complementa `lint:deps`). Tipos em `src/types/madge.d.ts`.
- **Docs:** `docs/testing.md`, regra `test-coverage.mdc`, spec `engineering-release`.

## [0.11.8] - 2026-03-30

- **Architecture:** Sessões do custom editor PlantUML registas em `plantumlEditorSessionRegistry.ts`; exportação e formatação já não importam `plantumlCustomEditorProvider` só para obter o documento activo. Tipo `PlantumlViewMode` em `plantumlViewMode.ts`.
- **CI:** `npm run lint:deps` (madge, dependências circulares em `src/`).

## [0.11.7] - 2026-03-30

- **Typography:** Default font **DejaVu Sans** (better on typical Linux/Docker PlantUML servers than Segoe UI); skinparams for `ArrowFont*` / `Title*` / `Component*` / `Package*` / `Message*` / `Legend*` with harmonised sizes and slate text colours; SVG post-process adds `font-family` on `text`/`tspan` so labels are not stuck in serif when the server lacks the skinparam font.
- **Docs:** Line crossings — PlantUML/Graphviz do not support draw.io-style “line jumps”; workarounds listed in `docs/visual-rendering.md`.

## [0.11.6] - 2026-03-29

- **Visual pipeline:** Com `!theme plain`, o bloco de estilo (cores suaves, fonte, sombras, pacotes/cloud/notas, estereótipos) **aplica-se sempre** que o tema visual ≠ `none`, mesmo quando o ficheiro define `skinparam nodesep` / `ranksep` / `linetype` (neste caso só o **espaçamento** automático é omitido). O préâmbulo é inserido **depois** de `!theme plain` no texto enviado ao servidor para o tema plain não anular as cores.
- **Merge:** `diagramPreamble` do utilizador continua a ir **antes** do `@startuml`; o bloco visual do plugin é fundido **após** `!theme …` dentro do diagrama (`applyVisualPreambleAfterTheme`).

## [0.11.5] - 2026-03-29

- **Visual pipeline:** Default theme (`modern-dark`) redesigned — light harmonious colours (not dark), soft borders, `Segoe UI`, stereotype `<<name>>` blocks with a pastel accent palette, package/component borders, improved SVG shadows (CSS `drop-shadow` on dense component-style diagrams). `glass` / `minimal` aligned.
- **Heuristic:** Diagrams with `component` are classified before generic `package`/`class` so component skinparams match the diagram.
- **Docs:** README visual theme table; `docs/visual-rendering.md` and feature spec note.

## [0.11.4] - 2026-03-29

- **Visual pipeline:** `!theme plain` no longer disables the automatic preamble; only non-plain PlantUML `!theme` (e.g. `cerulean-outline`) or explicit layout `skinparam`s still block it. Documented in README and `docs/visual-rendering.md`; spec updated.
- **Tests:** `visualRendering.test.ts` covers plain vs cerulean and `hasNonPlainPlantumlTheme`.

## [0.11.3] - 2026-03-29

- **Example:** `architecture.puml` — `!theme plain` again; comments stress that `modern-dark` / `glass` / `minimal` / `none` must not be used as PlantUML `!theme` (server HTTP 400).
- **Docs:** README and `docs/visual-rendering.md` warn against `!theme modern-dark` etc.; spec note.

## [0.11.2] - 2026-03-29

- **Example:** `examples/architecture.puml` — `!theme glass` is not a PlantUML server theme; use `!theme plain` (or another [supported theme](https://plantuml.com/theme)). Extension visual themes (`glass`, etc.) are **Settings** only (`plantumlViewer.visualTheme`).
- **Docs:** README and `docs/visual-rendering.md` clarify `!theme` vs extension theme.

## [0.11.1] - 2026-03-29

- **Visual pipeline:** não injectar préâmbulo automático quando o ficheiro já tem `!theme` ou `skinparam` de layout (`nodesep`, `ranksep`, `linetype`, paddings, `dpi`).
- **SVG:** em diagramas densos (componente, classe, deploy, …), não aplicar filtro de sombra a todos os `rect`; `linetype ortho` só para sequência/actividade; mais espaçamento por defeito em componente.
- Ver [`docs/visual-rendering.md`](docs/visual-rendering.md).

## [0.11.0] - 2026-03-29

- **Visual rendering pipeline:** diagram kind heuristics, themes (`modern-dark`, `glass`, `minimal`, `none`), automatic `skinparam` preamble, semantic colour hints, SVG post-processing (defs, shadows, hover CSS). Settings: `plantumlViewer.visualTheme`, `visualSemanticColors`, `visualSvgEnhancements`. API: `renderDiagram`, `prepareUmlForServer`, `enhanceSvgString` in `src/plantuml/rendering/`.
- **Docs:** [`docs/visual-rendering.md`](docs/visual-rendering.md); example [`examples/visual-pipeline-sample.puml`](examples/visual-pipeline-sample.puml).

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
