# Plan: exportação de diagrama

**Spec de referência:** [spec.md](./spec.md)

## Arquitectura

- Comando `exportDiagram` → quick pick de formato → obtenção de bytes/texto via cliente HTTP (SVG ou PNG) → diálogo “Guardar como” → `workspace.fs.writeFile`.
- Reutiliza `readPlantumlConfig`, expansão de includes, préâmbulo e funções `fetchSvgDiagram` / `fetchPngDiagram`.

## Decisões técnicas

| Decisão | Justificativa |
|---------|----------------|
| Mesmo pipeline que preview | Coerência visual e de conteúdo. |
| PNG como binário, SVG como texto | Formatos naturais devolvidos pelo servidor. |

## Trade-offs

- Depende do servidor para ambos os formatos; servidor antigo pode falhar em diagramas muito grandes no PNG tal como no SVG.

## Módulos de referência (implementação actual)

- `src/plantuml/exportDiagram.ts`, entrada em `src/extension.ts`

## Dependências

- Specs **preparação de fonte** e **cliente HTTP**.
