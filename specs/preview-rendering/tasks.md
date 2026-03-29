# Tasks: pré-visualização (Webview)

Mapeamento: **S** = [spec.md](./spec.md), **P** = [plan.md](./plan.md).

_Verificado na entrega **0.4.0**: suíte automatizada; HTML/preview sem alteração funcional nesta release._

## Manutenção e regressão

- [x] **T-PRV-1 (S: aceitação 1, 3, P: fluxo)** Fluxo preview integrado ao Extension Host (smoke + uso manual F5).
- [x] **T-PRV-2 (S: aceitação 2, P: CSS)** Theming via tokens — sem regressão conhecida.
- [x] **T-PRV-3 (S: aceitação 4, P: debounce)** Debounce 500 ms inalterado.
- [x] **T-PRV-4 (S: aceitação 5–6, P: html)** `sanitizeSvgForInline` e CSP inalterados nesta release.

## Evolução

- [ ] **T-PRV-5** Pré-visualização PNG no painel: novo spec/plan antes de código.
