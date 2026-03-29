# Tarefas: zoom com roda do rato na área do diagrama

Mapeamento: **S** = [spec.md](./spec.md), **P** = [plan.md](./plan.md).

## Preparação

- [x] **T-DWZ-1 (S: critérios 1–2, P: limites)** Confirmar no código os limites numéricos actuais de escala (`previewZoom`) e o ponto único onde o factor é aplicado ao SVG.
- [x] **T-DWZ-2 (S: critério 3, P: eventos)** Localizar o contentor DOM da área do diagrama vs textarea na Webview e definir onde anexar `wheel` (sem afectar scroll do código).

## Implementação

- [x] **T-DWZ-3 (S: 1–2, P: wheel)** Implementar listener de roda na área do diagrama; calcular novo zoom por incremento; aplicar transformação ou CSS coerente com o fluxo actual.
- [x] **T-DWZ-4 (S: 2, P: previewZoom)** Sincronizar o zoom efectivo com `plantumlViewer.previewZoom` (ou estado partilhado documentado no plano), com debounce se escrever nas definições.
- [x] **T-DWZ-5 (S: 4)** Garantir que pan e restantes mensagens da Webview não regressam (teste manual nos três modos de vista relevantes).

## Documentação e qualidade

- [x] **T-DWZ-6 (S: 5)** Actualizar README ou descrição da definição `previewZoom` com uma linha sobre zoom por roda na área do diagrama.
- [x] **T-DWZ-7 (P: testes)** Adicionar ou actualizar teste(s) unitário(s) para a função de cálculo do novo zoom, se extraída.
- [x] **T-DWZ-8** `npm run compile` e `npm test` sem falhas; bump SemVer e `npm run vscode:package` conforme `specs/engineering-release/`.

**Nota de UX:** zoom com **Ctrl** (Windows/Linux) ou **Cmd** (macOS) + roda sobre o diagrama; roda sem modificador mantém o scroll do painel (evita conflito com o spec de pré-visualização).
