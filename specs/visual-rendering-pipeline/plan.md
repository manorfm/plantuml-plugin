# Plan: pipeline de renderização visual

**Spec:** [spec.md](./spec.md)

## Arquitectura

```
Texto .puml (após includes)
    → analyzeDiagramKind (heurística)
    → buildVisualPreamble (estilo sempre com plain; layout só se não houver skinparam de espaçamento)
    → diagramPreamble do utilizador prefixado; bloco visual inserido após !theme … no diagrama
    → fetchSvgDiagram (servidor)
    → postProcessSvg (inject defs / estilos)
    → Webview / export
```

- **Módulos:** `src/plantuml/rendering/` — `analyzeDiagram.ts`, `themes.ts`, `visualPreamble.ts`, `svgPostProcess.ts`, `renderPipeline.ts` (API `renderDiagram` + helpers).
- **Configuração:** novos campos em `plantumlConnectionSettings` / `package.json` → `plantumlViewer.visualTheme`, `plantumlViewer.visualSemanticColors`, `plantumlViewer.visualSvgEnhancements`.
- **Cache:** o cache de diagrama continua a usar o texto **exactamente** como enviado ao servidor; guarda SVG **bruto**; na leitura aplica-se `postProcessSvg` com o tema actual (evita invalidar cache ao mudar só o tema de pós-processamento — na prática tema afecta também o préâmbulo; se o préâmbulo mudar, a chave de cache muda).

## Trade-offs

- Heurísticas de tipo e semântica podem errar em diagramas pouco convencionais — aceitável; modo `none` desliga tudo.
- Pós-processamento por string é mais frágil que DOM, mas evita dependências pesadas e mantém performance previsível em CI.
- Diagramas **densos** (componente, pacotes, classe, …): não aplicar sombra SVG em todas as primitivas; `linetype ortho` só para sequência/actividade — evita empilhamento e “estouro” na Webview.

## Compatibilidade

- SVG inválido ou vazio: devolver sem alteração ou com mensagem de erro já existente no cliente HTTP.
