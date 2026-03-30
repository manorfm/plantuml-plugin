# Visual rendering pipeline

The extension can **enhance** diagrams after the PlantUML server returns SVG, without changing the server binary.

## Flow

1. **Analyse** — `analyzeDiagramKind()` infers sequence, class, component, etc. from the source (heuristics).
2. **Preamble** — `buildVisualPreamble()` emits `skinparam` lines (spacing, `linetype ortho`, soft palette, `defaultFontName`, optional per-`<<stereotype>>` accents, colours) for the selected **visual theme**, merged **before** your `diagramPreamble` so you can still override with your own skinparams.
3. **Render** — existing HTTP client sends the combined text to `/svg`.
4. **SVG post-process** — `postProcessSvg()` injects `<defs>` (shadow filter or CSS `drop-shadow` on dense graphs, gradient when applicable) and a small `<style>` block for hover polish.

## `!theme` no ficheiro ≠ tema da extensão

- **`plantumlViewer.visualTheme`** (`none`, `modern-dark`, `glass`, `minimal`) — processado pelo plugin (préâmbulo + SVG). **Não** podes usar estes nomes em `!theme …` no ficheiro; o servidor devolve **400** (“Cannot load theme …”).
- **`!theme …` no `.puml`** — só temas do **motor** PlantUML (lista em [plantuml.com/theme](https://plantuml.com/theme)), por exemplo `plain`, `cerulean-outline`. Erros comuns: `!theme glass`, `!theme modern-dark`, `!theme minimal` — copiados das definições da extensão, mas **inválidos** no servidor.

## Respeitar o teu `.puml`

- **`!theme plain`** — o servidor desenha um baseline neutro; a extensão **pode** ainda antepor o bloco automático (skinparams + cores semânticas) e aplicar o pós-processamento SVG, **desde que** não existam também `skinparam` de layout listados abaixo.
- **`!theme …` com outro nome** (ex.: `cerulean-outline`, `superhero`) — o motor PlantUML assume o estilo visual; a extensão **não** injecta skinparams do pipeline (evita conflito com o tema do servidor).
- **`skinparam`** de layout (`nodesep`, `ranksep`, `linetype`, `packagePadding`, `componentPadding`, `dpi`) — com `!theme plain`, a extensão **não** sobrescreve estes valores (não injecta `nodesep`/`ranksep`/`linetype` automáticos), mas **injecta na mesma** cores, fonte, sombras (`skinparam shadowing`), estereótipos e bordas — o bloco é inserido **depois** de `!theme plain` no ficheiro para não ser anulado pelo tema.

Para diagramas **densos** (componente, classe, …), o pós-processamento **não** usa o filtro SVG `feGaussianBlur` em todas as primitivas; em vez disso aplica **CSS `drop-shadow`** suave às caixas, para dar profundidade sem “estourar” o `viewBox` como no filtro antigo.

### Tipografia

O préâmbulo usa **DejaVu Sans** por defeito (comum em servidores Linux) e define tamanhos/cores para texto geral, **rótulos de setas** (`ArrowFont*`), título, pacotes, componentes e (em sequência) mensagens. O pós-processamento SVG reforça `font-family` sans-serif nos elementos `<text>` para evitar fallback para tipos com serifa quando o servidor ignora parte dos skinparams.

### Cruzamentos de linhas (“salto” / uma por cima da outra)

O motor **PlantUML + Graphviz** **não** implementa o efeito “jump over” como no draw.io ([pedido na comunidade](https://forum.plantuml.net/17955/possible-create-jump-over-effect-lines-that-cross-other)). Não é possível obter esse efeito só com skinparams ou com o pós-processamento SVG actual.

Para **reduzir** cruzamentos confusos: aumentar `nodesep` / `ranksep`, agrupar ligações com `together { }`, repartir por pacotes, ou experimentar `!pragma layout elk` (motor alternativo, nem todos os diagramas são suportados). Saltos visuais exactos exigiriam edição manual do SVG noutra ferramenta.

## Settings (`plantumlViewer.*`)

| Key | Values | Role |
|-----|--------|------|
| `visualTheme` | `none`, `modern-dark`, `glass`, `minimal` | `none` = no automatic preamble or SVG polish (compat mode). |
| `visualSemanticColors` | boolean | Extra skinparam hints from keywords (user, API, database, …). |
| `visualSvgEnhancements` | boolean | Enable SVG defs/CSS step. |

## Developer API

`src/plantuml/rendering/renderPipeline.ts`:

- `prepareUmlForServer(source, userPreamble, visual)` — text to send to the server + inferred kind.
- `enhanceSvgString(svg, kind, visual)` — run after fetch.
- `renderDiagram({ uml, serverUrl, userPreamble, visual, signal, timeoutMs })` — end-to-end when the source is already self-contained (no `!include` expansion).

## Performance

- Preamble and SVG transforms are **string operations** (no DOM in Node).
- Diagram cache stores **raw** server SVG; enhancements run on each display so theme toggles apply without a new HTTP request when the preamble is unchanged (cache key includes full server text).

## Spec

See `specs/visual-rendering-pipeline/spec.md`.
