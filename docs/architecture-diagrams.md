# Diagramas de arquitectura (exemplos PlantUML)

Versão de referência nos títulos: alinhada a `package.json` (ex.: **v0.11.14**).

## Duas leituras

| Ficheiro | Propósito |
|----------|-----------|
| [`examples/architecture-overview.puml`](../examples/architecture-overview.puml) | **Poucas setas**, camadas grossas — leitura rápida sem “esparguete”. |
| [`examples/architecture.puml`](../examples/architecture.puml) e variantes `architecture-theme-*.puml` | **Componentes e dependências** entre ficheiros — referência para quem altera código. |

Com muitos nós, qualquer grafo **completo** tende a cruzar linhas: não indica por si só **ciclos de imports** nem mau desenho; é limitação de layout automático.

## Imports vs. desenho do diagrama

- **`renderPipeline` → `serverClient` e `sourceTransform`:** o fluxo é **unidireccional**. O cliente HTTP **não** importa o pipeline de renderização; não há ciclo **RP ↔ SC** ao nível de módulos.
- **`plantumlConnectionSettings`:** importa `DEFAULT_PLANTUML_SERVER_URL` de `serverClient` e tipos de `rendering/themes`. É **camada de normalização** que conhece rede e tema — se no futuro se quiser uma árvore estrita, candidatos a indireção são: constante de URL por defeito em `constants/`, e tipos de tema num módulo `types/` ou só em `rendering/themes` re-exportados sem puxar `serverClient` para settings.

## Ficheiros na raiz de `src/`

O VS Code espera **`main`** em `package.json` (hoje `dist/extension.js` compilado a partir de `extension.ts`). É normal o **ponto de composição** ficar na raiz.

Os outros ficheiros soltos (`plantumlConfig.ts`, `plantumlStatusBar.ts`, `plantumlModeCodeLens.ts`) são **histórico + tamanho pequeno**. Uma organização por pastas (ex.: `src/config/`, `src/ui/`) pode alinhar pastas às **camadas** do diagrama; é refactor mecânico — não muda comportamento se os imports forem actualizados.

## Dicas visuais nos `.puml` detalhados

- **`skinparam linetype ortho`** reduz curvas sobrepostas; **`nodesep` / `ranksep`** abrem espaço.
- O domínio (**rendering + rede + texto + export**) está **aninhado** num único pacote para aproximar no desenho o que no código é o mesmo “bloco” funcional.
