# Plano: zoom com roda do rato na área do diagrama

**Spec de referência:** [spec.md](./spec.md).

## Objectivo técnico

Expor zoom incremental na **área do diagrama** da Webview do editor personalizado, escutando eventos de **roda** (`wheel`) no contentor do SVG (ou equivalente), com **stopPropagation** / **preventDefault** apenas onde for necessário para não roubar scroll ao painel de código.

## Relação com `previewZoom`

- **Opção A (preferida para consistência):** cada passo de zoom por roda **actualiza** o valor efectivo usado para escala (por exemplo reflectindo em `plantumlViewer.previewZoom` via mensagem para o host, ou actualizando o mesmo estado em memória que já multiplica o SVG). Assim o utilizador vê o mesmo valor nas definições após interacção (ou após debounce).
- **Opção B:** zoom por roda aplica-se só como **factor local** na Webview até ao próximo re-render; maior risco de dessincronia com definições — só se o re-render for frequente.

Decisão a fixar na implementação: **preferir A** salvo custo de escrita em `WorkspaceConfiguration` elevado; nesse caso **debounce** na escrita.

## Limites e incrementos

- Reutilizar **mínimo / máximo** já aplicados a `previewZoom` (ver `plantumlConfig` / HTML da pré-visualização).
- Incremento por “tick” de roda: constante pequena (ex. 0.05–0.1) ou multiplicativo (ex. 1.1×); evitar saltos que ultrapassem os limites.

## Ficheiros prováveis (referência, não contrato)

- Fragmentos HTML/JS injectados na Webview onde o SVG é montado (`customEditorHtml`, `preview/html` ou script inline da Webview).
- Mensagens `postMessage` entre Webview e extensão se o zoom tiver de persistir no `plantumlViewer.previewZoom`.
- Implementação actual: **Ctrl/Cmd + wheel** no `.diagram-scrollport`; `previewZoomChange` → `plantumlViewer.previewZoom` com debounce 300 ms; constantes `PREVIEW_ZOOM_MIN` / `PREVIEW_ZOOM_MAX` em `plantumlConfig.ts`; função pura `computeNextPreviewZoom` em `util/previewZoomWheel.ts` (testes unitários).

## Testes

- Onde possível, testes **unitários** de função pura que calcula o novo zoom a partir do delta da roda e do zoom actual.
- Teste manual: modo **split** e modo **só diagrama**; confirmar que o código continua a receber scroll normal.

## Riscos

- **Trackpad** com gestos horizontais/verticais: pode gerar deltas grandes — limitar ou suavizar.
- **Linux / Wayland:** comportamento da roda pode variar — validar em pelo menos um ambiente.
