# PlantUML Viewer

Extensão para [Visual Studio Code](https://code.visualstudio.com/) e editores compatíveis (por exemplo [Cursor](https://cursor.com/)) que **pré-visualiza** diagramas [PlantUML](https://plantuml.com/) a partir de ficheiros `.puml` / `.plantuml`, usando um **servidor PlantUML** local ou na rede.

## Requisitos

- **Editor:** VS Code ≥ 1.85 (ver `engines.vscode` em `package.json`).
- **Servidor PlantUML** acessível por HTTP (a extensão não embute o motor Java). **Por defeito** usa-se o servidor HTTP oficial em `https://www.plantuml.com/plantuml`, para a pré-visualização funcionar **sem instalar Docker**. O texto do diagrama é enviado a esse serviço — para **dados confidenciais** ou **offline**, altere **PlantUML Viewer → Server URL** para um servidor **local** (Docker abaixo).

### Servidor local (exemplo Docker)

```bash
docker run -d -p 8080:8080 plantuml/plantuml-server:jetty
```

Se a **porta 8080 já estiver em uso** (outro contentor ou aplicação), use outra porta no anfitrião e a mesma no URL da extensão, por exemplo:

```bash
docker run -d -p 8081:8080 plantuml/plantuml-server:jetty
```

Em **Definições → PlantUML Viewer → Server URL**, defina `http://127.0.0.1:8081` (ou o valor correcto).

Confirme que o serviço responde no URL configurado em **Definições → PlantUML Viewer → Server URL**.

## Funcionalidades

- **Três modos de vista** (persistidos por ficheiro): **só código**, **código e diagrama**, **só diagrama**, no **mesmo separador** (`CustomTextEditorProvider`). **Um** botão na barra do título (`plantumlViewer.toggleViewMode`, ciclo code→split→preview) com ícone conforme o modo actual. **Refresh** e **Export** na **barra de estado** (com custom editor activo) e na **barra interna da Webview** (`showWebviewToolbar`): **três botões de ícone** para modo (código / split / pré-visualização) + ícones para refresh e export. Comandos directos de modo e paleta mantêm-se para atalhos.
- Pré-visualização **SVG inline** com **tema** do VS Code; pan e zoom como antes.
- **Pan:** quando o diagrama é maior que o painel, **arraste** com o rato (ou arraste com o dedo em ecrã táctil) para deslocar a vista; a **roda** do rato faz scroll como habitualmente.
- **Atualização automática** opcional ao editar (com debounce) ou **atualização manual**.
- **Tempo limite** configurável para pedidos HTTP ao servidor.
- **Escala** da pré-visualização (`previewZoom`).
- **Préâmbulo opcional** (`diagramPreamble`) — texto colocado **antes** do diagrama (após `!include`), útil para `!theme`, `skinparam`, etc., conforme o servidor suportar.
- Expansão de **`!include`** com caminhos relativos ao ficheiro: `ficheiro.puml`, `<ficheiro.puml>`, `"caminho com espaços.puml"`. **`!includeurl`** não é expandido localmente (mantém-se a linha).
- **Diagramas muito grandes:** quando a URL GET codificada fica demasiado longa, a extensão usa **POST** com o texto do diagrama para `/svg` ou `/png` (plantuml-server; versões muito antigas podem não suportar).
- **Exportação** do diagrama para ficheiro **SVG** ou **PNG** (via servidor).
- **Realce de sintaxe PlantUML** (TextMate embebido) e **Format document** no **editor de texto**; comando **PlantUML: Format document** também com o **PlantUML Viewer** (custom editor) activo. Ver `specs/plantuml-text-editor/`.
- Empacotamento **`.vsix`**: `npm run vscode:package` ou **`npm run vsix`** (compila + empacota).

## Exemplo de diagrama (este projeto)

Na pasta **`examples/`** está o ficheiro **`architecture.puml`**, que descreve a arquitetura dos módulos desta extensão. Com o **servidor PlantUML** a correr e esta extensão instalada, abra o ficheiro (abre no **PlantUML Viewer** por defeito) ou use **Modo código e diagrama** / **Abrir pré-visualização** na paleta; o modo **split** é o defeito por URI até alterar.

## Limitações (importante)

- **Área do diagrama:** dentro do **mesmo separador** que o código (editor personalizado). Para voltar ao editor de texto clássico: **Reopen Editor With… → Text Editor**.
- **Dentro do SVG:** o fundo e o estilo **desenhados pelo PlantUML** no ficheiro SVG (por exemplo fundo branco) **não** são alterados pela extensão. O que segue o tema do VS Code é o **painel** da Webview (fundo do painel, texto de erro).
- **Temas PlantUML** (`!theme`, `skinparam` no préâmbulo) dependem do **servidor** e da versão do motor; a extensão apenas envia o texto.
- Servidores sem suporte a **POST** nos endpoints acima podem falhar em diagramas extremamente grandes.

## Erro «fetch failed» ou falha de rede

Se a mensagem ainda mostrar **`http://127.0.0.1:8080`** mas não usa servidor local, provavelmente **Server URL** ficou guardado com esse valor nas definições (utilizador ou espaço de trabalho). Apague o valor para voltar ao defeito da extensão ou defina explicitamente `https://www.plantuml.com/plantuml`.

1. **Com o URL por defeito** (`https://www.plantuml.com/plantuml`): confirme **ligação à Internet**, firewall e proxy. Teste no terminal:  
   `curl -sS -o /dev/null -w "%{http_code}\n" "https://www.plantuml.com/plantuml/"` — deve obter `200` ou redirecção.
2. **Com servidor local** (`http://127.0.0.1:8080`, etc.): confirme que o contentor ou processo está a correr — ex.:  
   `docker run -d -p 8080:8080 plantuml/plantuml-server:jetty`  
   **Porta ocupada:** use `-p 8081:8080` e **Server URL** `http://127.0.0.1:8081`. Teste: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/`.
3. Em **Definições → PlantUML Viewer → Server URL**, o URL deve coincidir com o servidor real. Em **WSL** ou **Remote-SSH**, `127.0.0.1` é o ambiente onde a extensão corre; alinhe host e porta em conformidade.

A mensagem de erro na pré-visualização foi alargada para explicar **ligação recusada** (`ECONNREFUSED`) e outros casos comuns.

**Erro 404 em `/svg` ou `/png`:** (1) **Server URL** deve ser a **base** correcta: Docker local `http://127.0.0.1:8080` (sem path extra); servidor público `https://www.plantuml.com/plantuml`. A extensão chama `GET/POST {base}/svg` e `…/png`. (2) URLs GET muito longas: usa-se POST; se o GET devolver 404/414, repete-se com POST.

## Instalação e atualização

### Pré-requisitos

1. **Editor:** Visual Studio Code, Cursor ou outro derivado do VS Code (≥ versão em `engines.vscode` no `package.json`).
2. **Rede** para o URL por defeito (`plantuml.com`), ou **servidor PlantUML** local se alterar **Server URL** (Docker — ver [Requisitos](#requisitos)).

### Instalar a extensão a partir do ficheiro `.vsix`

O pacote **`.vsix`** contém a extensão pronta a instalar (gerado com `npm run vscode:package` na raiz do repositório).

**Opção A — pela paleta de comandos**

1. **View → Command Palette** (ou `Ctrl+Shift+P` / `Cmd+Shift+P`).
2. Escolha **Extensions: Install from VSIX…** (ou o equivalente no seu idioma).
3. Selecione o ficheiro `plantuml-viewer-<versão>.vsix` (o nome inclui a versão definida em `package.json`).

**Opção B — linha de comandos**

```bash
# Visual Studio Code
code --install-extension ./plantuml-viewer-0.10.3.vsix

# Cursor (se o CLI estiver no PATH)
cursor --install-extension ./plantuml-viewer-0.10.3.vsix
```

Substitua `0.10.3` pela versão real do ficheiro gerado (`version` em `package.json`). Use o caminho absoluto ou relativo correcto até ao `.vsix`.

Depois da instalação, confirme que a extensão aparece em **Extensions** com o nome **PlantUML Viewer** (publisher `local`, salvo tenha alterado o `publisher` no `package.json`).

### Atualizar a extensão

Para passar para uma **versão mais nova** do mesmo pacote:

1. **Incremente** o campo `version` em `package.json` (semântica `X.Y.Z` é a usual).
2. Gere o novo pacote: `npm run vscode:package`.
3. Instale de novo o `.vsix` com um dos métodos acima. O instalador **substitui** a versão anterior com o mesmo identificador (`publisher.name`).

Se preferir remover antes de instalar: **Extensions** → localize **PlantUML Viewer** → **Uninstall**, depois instale o novo `.vsix`.

Recomenda-se **recarregar a janela** do editor após instalar ou atualizar: **Command Palette → Developer: Reload Window**.

### Instalação em modo desenvolvimento (sem `.vsix`)

Para testar alterações ao código antes de empacotar:

```bash
npm install
npm run compile
```

Abra a pasta do repositório no editor e use **Run → Start Debugging** (F5). Abre-se uma **Extension Development Host** com esta extensão carregada a partir do código-fonte.

## Comandos

| Comando | Descrição |
|--------|-----------|
| **PlantUML: Cycle view mode** | Alterna **code → split → preview → code** no custom editor activo (também é o único botão em `editor/title`). |
| **PlantUML: Code only** | Força modo código (paleta / atalhos). |
| **PlantUML: Code and diagram** | Força modo split. |
| **PlantUML: Diagram only** | Força modo só diagrama. |
| **PlantUML: Open preview** | Igual a **Code and diagram**. |
| **PlantUML: Refresh preview** | Re-render no custom editor activo (também na status bar e na webview). |
| **PlantUML: Export diagram…** | Exporta SVG/PNG (também na status bar e na webview). |
| **PlantUML: Format document** | Formata e indenta o `.puml` (custom editor activo ou **Format Document** no editor de texto). |

**Where the buttons are:** **Editor title:** só **ciclo de modo** (`navigation@1`, ícone conforme `plantumlViewer.viewMode`). **Status bar:** Refresh + Export com custom editor activo. **Webview:** barra superior opcional com **três ícones de modo** + refresh e export em ícone. **CodeLens:** só refresh no editor de texto, se `showModeCodeLens`.

**Onde está o diagrama:** no **mesmo separador** que o código (modo split ou só diagrama). Documentação técnica: **`docs/editor-behavior-spec.md`**.

**Realce de sintaxe:** no **PlantUML Viewer** (custom editor), a área de código usa uma camada `<pre>` colorida por baixo da textarea (`webviewHighlight.ts`). Com **Reopen Editor With… → Text Editor**, a **gramática TextMate** (`syntaxes/plantuml.tmLanguage.json`) também colore o buffer `plantuml`.

## Configuração (`plantumlViewer.*`)

| Chave | Descrição |
|-------|-----------|
| `serverUrl` | URL **base** **sem** barra final. **Defeito:** `https://www.plantuml.com/plantuml` (rede; evite para diagramas confidenciais). Local: Docker `http://127.0.0.1:8080` (ou outra porta). Pedidos: `{base}/svg` e `{base}/png`. |
| `autoRefresh` | Atualizar a pré-visualização ao editar (debounce ~500 ms). |
| `requestTimeoutMs` | Tempo máximo (ms) para cada pedido HTTP. |
| `previewZoom` | Escala do diagrama na Webview (0,25 a 3; 1 = 100 %). |
| `diagramPreamble` | Texto opcional **antes** do diagrama (várias linhas), após expansão de `!include` — por exemplo `!theme plain`. |
| `showWebviewToolbar` | **true** por defeito: barra na Webview com ícones de modo (3) + refresh + export. |
| `showStatusBarActions` | **true** por defeito: Refresh + Export na barra de estado (só com custom editor activo). |
| `showModeCodeLens` | **false** por defeito: CodeLens só refresh no editor de **texto** (fallback opcional). |

## `!include`

Linhas `!include` são expandidas **antes** do envio ao servidor, com leitura de ficheiros relativos ao documento. São aceites formas como `!include partes/a.puml`, `!include <estilos.puml>` e `!include "ficheiro com espaços.puml"`. URLs em **`!includeurl`** não são tratadas como ficheiros locais. Documentos **só em memória** (não guardados como `file:`) não aplicam includes em disco; guarde o ficheiro para caminhos consistentes.

## Exportação

O export usa o mesmo servidor, as mesmas expansões de `!include` e o mesmo **préâmbulo** que a pré-visualização. É necessário que o documento esteja guardado em disco (`file:`).

## Desenvolvimento

```bash
npm run compile    # compilar TypeScript
npm run watch      # compilar em modo observação
npm test           # testes (Extension Host + Mocha)
npm run vscode:package   # gera plantuml-viewer-*.vsix
npm run vsix             # compile + vsce package (atalho)
```

Documentação técnica detalhada: **`SPECIFICATION.md`** na raiz; comportamento do editor: **`docs/editor-behavior-spec.md`** (inclui versionamento SemVer em `SPECIFICATION.md` e geração do `.vsix`).

## Licença

MIT — ver ficheiro `LICENSE`.
