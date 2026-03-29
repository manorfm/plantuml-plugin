# Plan: pré-visualização (Webview)

**Spec de referência:** [spec.md](./spec.md)

## Arquitectura

- **Sessão do editor personalizado** (`PlantumlCustomEditorSession`): Webview embutida no `CustomTextEditorProvider`, cancelamento de pedido anterior, debounce para `autoRefresh`, orquestração texto preparado → cliente HTTP → fragmento HTML no contentor do diagrama.
- **Geração de HTML**: estados loading, erro (sem script), sucesso com SVG inline sanitizado e script mínimo apenas para pan quando aplicável.
- **WebviewPanel**: `retainContextWhenHidden`, `enableScripts` conforme necessidade de pan; CSP restritiva com excepções controladas para SVG inline.

## Decisões técnicas

| Decisão | Justificativa |
|---------|----------------|
| SVG inline em vez de `data:` em `<img>` | Preserva legibilidade vectorial e interacção textual. |
| Sanitização de SVG (remover `script`, etc.) | Reduz superfície XSS na Webview. |
| Variáveis CSS `--vscode-*` | Theming oficial recomendado pela plataforma. |
| Debounce ~500 ms | Equilíbrio entre responsividade e carga no servidor. |

## Trade-offs

- CSP com `unsafe-inline` para estilos/scripts do HTML gerado: necessário para o modelo actual; conteúdo do diagrama deve permanecer sanitizado.

## Módulos de referência (implementação actual)

- `src/plantuml/plantumlCustomEditorProvider.ts`, `src/preview/html.ts`, `src/plantuml/customEditorHtml.ts`
- Utilitários: `src/util/debounce.ts`, `src/util/plantumlEditor.ts`

## Dependências

- Specs **preparação de fonte** e **cliente HTTP**.
- Configuração `autoRefresh`, `previewZoom`.
