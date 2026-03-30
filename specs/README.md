# Especificações por feature (SDD)

Este directório contém **artefactos vivos** por domínio: intenção (`spec.md`), decisão técnica (`plan.md`) e execução (`tasks.md`).

## Documento global

- **`SPECIFICATION.md`** (raiz): visão, princípios, restrições e índice das features. Não substituir por implementação directa sem passar pelos artefactos abaixo.

## Fluxo para agentes e humanos

1. Identificar ou criar **`specs/<feature>/spec.md`** (o quê e porquê, sem como).
2. Actualizar ou criar **`specs/<feature>/plan.md`** (arquitectura e trade-offs; referencia o spec).
3. Actualizar **`specs/<feature>/tasks.md`** (passos pequenos, ordenados, verificáveis).
4. Só então alterar código, testes ou `package.json`.

Alterações de comportamento devem **actualizar primeiro** o `spec.md` (ou o global) e só depois o plano e as tarefas.

## Features

| Pasta | Domínio |
|--------|---------|
| [`plantuml-server-client/`](./plantuml-server-client/) | Cliente HTTP ao servidor PlantUML (codificação, GET/POST, timeouts, erros). |
| [`source-preparation/`](./source-preparation/) | Transformação do texto fonte antes do envio (`!include`, préâmbulo). |
| [`preview-rendering/`](./preview-rendering/) | Painel Webview, HTML temático, SVG inline, zoom, pan, estados de UI. |
| [`diagram-wheel-zoom/`](./diagram-wheel-zoom/) | Zoom in/out com a roda do rato sobre a área do diagrama (limites alinhados a `previewZoom`). |
| [`view-modes/`](./view-modes/) | Três modos de vista, persistência, foco e barra do editor. |
| [`export-diagram/`](./export-diagram/) | Exportação SVG/PNG para ficheiro. |
| [`engineering-release/`](./engineering-release/) | Testes, empacotamento `.vsix`, SemVer e coerência de documentação. |
| [`visual-rendering-pipeline/`](./visual-rendering-pipeline/) | Pipeline visual: análise do diagrama, temas, préâmbulo, pós-processamento SVG. |
| [`plantuml-text-editor/`](./plantuml-text-editor/) | Realce de sintaxe TextMate, formatação/indentação, script `vsix`. |

## Convenções de nomes

- **`spec.md`**: problema, comportamento esperado, critérios de aceitação. Sem nomes de ficheiros ou classes.
- **`plan.md`**: referência ao spec, módulos, dependências, trade-offs.
- **`tasks.md`**: tarefas mapeadas a secções do spec e do plano (IDs ou títulos).
