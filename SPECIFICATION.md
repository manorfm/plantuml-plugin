# Especificação global: PlantUML Viewer (VS Code)

Documento de **visão, princípios e restrições** do produto. Detalhe executável por domínio está em **`specs/<feature>/`** ([índice](specs/README.md)).

---

## Desenvolvimento orientado por especificação (SDD)

1. **Intenção:** `specs/<feature>/spec.md` — problema, comportamento, critérios de aceitação (sem implementação).
2. **Decisão:** `specs/<feature>/plan.md` — arquitectura, trade-offs, referência ao spec.
3. **Execução:** `specs/<feature>/tasks.md` — tarefas pequenas, ordenadas, verificáveis.

Regra para agentes e equipa: **não** alterar código ou contratos (`package.json` contributes) sem alinhar primeiro o `spec.md` (e plano/tarefas) da feature afectada.

---

## Estado actual do produto (resumo)

Extensão **funcional e empacotável** para visualizar diagramas PlantUML (`.puml`, `.plantuml`, `.pu`, `.wsd`) no VS Code e editores compatíveis, com pré-visualização em Webview, modos de vista persistidos, preparação de fonte (`!include`, préâmbulo), cliente HTTP ao servidor PlantUML, exportação SVG/PNG, testes automatizados e artefacto `.vsix`.

---

## 1. Objetivo

Permitir **visualizar e exportar** diagramas PlantUML a partir do editor, com UI **legível**, **alinhada ao tema**, **actualizável** (manual e opcionalmente automática), sem obrigar o utilizador a sair do editor para ver o diagrama.

### 1.1 Resultados mensuráveis (nível global)

- Pré-visualização com estados de carregamento e erro controlados.
- Suporte à sintaxe comum `@startuml` / `@enduml` e diagramas típicos (sequência, classe, etc.).
- Erros (rede, timeout, includes, resposta do servidor) **visíveis** e **sem crash** da extensão.
- Temas claro, escuro e alto contraste respeitados no **chrome** da Webview.
- Empacotamento `.vsix` com dependências de runtime necessárias ao encoding.

### 1.2 Limitações (nível global)

- **URL por defeito** do servidor: uso previsto para diagramas **não confidenciais**; conteúdo sensível exige servidor **local** (ver spec `plantuml-server-client` e README).
- Estilo **dentro** do SVG gerado pelo motor PlantUML não é forçado pelo tema do editor.
- `diagramPreamble` e `!theme` dependem das capacidades do **servidor**.
- Servidores muito antigos podem falhar em diagramas extremamente grandes mesmo com POST.

### 1.3 Fora de escopo

- Edição WYSIWYG; integração Git específica; editor visual de skins além do texto em `diagramPreamble`.

---

## 2. Cenários (visão)

| Cenário | Resultado esperado (resumo) |
|--------|------------------------------|
| Abrir `.puml` e pré-visualizar | Carregamento → SVG ou erro legível. |
| Mudar tema do editor | Webview mantém coerência visual (tokens). |
| Editar com auto-refresh | Re-render após debounce; sem refresh, comando «Atualizar». |
| Servidor inacessível / timeout | Mensagem clara; sem hang indefinido. |
| Includes locais | Resolução ou erro/ciclo reportado. |
| Exportar | Escolha SVG/PNG e gravação em disco. |
| Modos de vista | Só código / split / foco diagrama no **mesmo separador**; `toggleViewMode` em `editor/title`; na Webview, três ícones de modo + refresh/export (`view-modes`, `docs/editor-behavior-spec.md`). |

---

## 3. Superfície do produto (referência única)

Comandos, linguagem, extensões de ficheiro, ícones da barra e chaves `plantumlViewer.*` estão definidos em **`package.json`** (`contributes`). A **semântica** de cada grupo de definições está distribuída pelos specs:

| Área | Spec |
|------|------|
| HTTP, encoding, erros de rede | `specs/plantuml-server-client/` |
| `!include`, préâmbulo | `specs/source-preparation/` |
| Webview, tema, zoom, pan, loading | `specs/preview-rendering/` |
| Modos, persistência, foco | `specs/view-modes/` |
| Exportação ficheiro | `specs/export-diagram/` |
| Testes, VSIX, SemVer | `specs/engineering-release/` |

**Backlog** (não especificado ao nível de aceitação neste global): pré-visualização PNG no painel; `!includeurl` local ou mensagem dedicada.

---

## 4. Restrições não funcionais (globais)

- **Performance:** debounce configurado na ordem de centenas de ms; cancelar pedido anterior ao re-renderizar.
- **Segurança / privacidade:** tráfego HTTP apenas para o destino configurado; política do URL por defeito documentada no spec do cliente e no README.
- **Compatibilidade:** `engines.vscode` em `package.json`.
- **Acessibilidade:** estado de carregamento comunicável (ex.: `aria-live`); erros legíveis.
- **Theming:** sem cores hex fixas obrigatórias no chrome da Webview.

---

## 5. Índice de features (`specs/`)

| Pasta | Nome |
|--------|------|
| `specs/plantuml-server-client/` | Cliente HTTP PlantUML |
| `specs/source-preparation/` | Preparação do texto (`!include`, préâmbulo) |
| `specs/preview-rendering/` | Pré-visualização Webview |
| `specs/view-modes/` | Modos de vista |
| `specs/export-diagram/` | Exportação SVG/PNG |
| `specs/engineering-release/` | Qualidade e release |

---

## 6. Setup e referências

- **Comandos de desenvolvimento:** `npm install`, `npm run compile`, `npm test`, `npm run vscode:package` — critérios em `specs/engineering-release/`.
- **PlantUML Server:** [plantuml.com — servidor](https://plantuml.com/pt/server)
- **Webview / theming:** [VS Code Webview](https://code.visualstudio.com/api/extension-guides/webview#theming-webview-content)

---

## 7. Cursor: regras e skills

- Regras: `.cursor/rules/` (inclui `plantuml-plugin-context.mdc`, `spec-driven-development.mdc`).
- Skills: `.cursor/skills/` — `vscode-plantuml-extension`, `typescript-vscode-extension`, `vscode-extension-testing`.

---

## 8. Versionamento e releases

Política SemVer, geração do `.vsix` e coerência com README: **spec** `specs/engineering-release/spec.md`, **plan** e **tasks** correspondentes. Resumo: cada alteração de produto incrementa `version`, gera `plantuml-viewer-<versão>.vsix`, e actualiza exemplos de instalação no README quando aplicável.

---

## 9. Riscos (nível global)

Dependência de **versão do servidor** PlantUML; **URLs GET** longas (mitigado por POST — ver spec do cliente); **rede** e **política do serviço público** quando se usa URL por defeito. Mitigações detalhadas nos plans das features.

---

*Documento vivo: mudanças de comportamento devem actualizar o `spec.md` da feature e, se afectarem visão ou restrições globais, este ficheiro.*
