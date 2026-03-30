# Tasks: pipeline de renderização visual

**Spec:** [spec.md](./spec.md) · **Plan:** [plan.md](./plan.md)

- [x] **T-VR-1** Módulos `rendering/` (análise, temas, préâmbulo, SVG, `renderDiagram`).
- [x] **T-VR-2** Configuração `plantumlViewer.visual*` + normalização em `plantumlConnectionSettings`.
- [x] **T-VR-3** Integração em `plantumlCustomEditorProvider` e `exportDiagram` (SVG).
- [x] **T-VR-4** Testes `visualRendering.test.ts`; `npm test` e `npm run test:coverage:unit`.
- [x] **T-VR-5** Exemplo `examples/visual-pipeline-sample.puml` + nota em `docs/visual-rendering.md`.
- [x] **T-VR-6** `!theme plain` não bloqueia o pipeline; `!theme` não-plain + testes `hasNonPlainPlantumlTheme`.
- [x] **T-VR-7** Paleta clara harmonizada (modern-dark), estereótipos `<<…>>`, sombras densas via CSS, heurística component antes de class/package.
- [x] **T-VR-8** Estilo sempre com `plain` + layout manual; inserção após `!theme`; `applyVisualPreambleAfterTheme`.
- [x] **T-VR-9** Tipografia (DejaVu Sans, ArrowFont*, SVG `font-family`); doc cruzamentos de linhas.

_Release: alinhar com `specs/engineering-release/` (versão, VSIX)._
