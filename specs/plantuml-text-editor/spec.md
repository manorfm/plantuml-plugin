# Spec: experiência de edição PlantUML (texto)

## Problema

- Ficheiros `.puml` abertos no **editor de texto** do VS Code não têm **realce de sintaxe** (gramática TextMate embebida na extensão).
- Não existe **formatação / indentação** assistida para o dialecto PlantUML mais comum (`@startuml` … `@enduml`, blocos `alt`/`end`, chavetas, `skinparam`, setas).
- O fluxo de **empacotamento** deve ser óbvio para quem não memoriza o nome do script `vsce`.

## Comportamento esperado

### Realce de sintaxe

- Contribuir **gramática TextMate** para `languageId` `plantuml` (já registada na extensão).
- Cobrir, sem pretender exaustividade total da linguagem: **comentários** (`'`), **delimitadores de diagrama** (`@startuml`, `@enduml`, variantes comuns), **directivas** (`!include`, `!theme`, `skinparam`, …), **palavras-chave** frequentes (participantes, tipos de diagrama, `alt`/`else`/`end`, `note`, `activate`, …), **setas** (`->`, `-->`, `->>`, …), **strings** entre aspas.
- O realce no **editor de texto** usa TextMate; no **custom editor**, a extensão aplica **HTML com classes** (`webviewHighlight.ts`) por baixo da textarea (sincronizado com mensagens `highlight` / `requestHighlight`).

### Formatação e indentação

- **Formatar documento**: normalizar **espaços em fim de linha**, **newline** final, e aplicar **indentação** heurística baseada em:
  - chavetas `{` / `}`;
  - palavras-chave de bloco comuns (`alt`, `opt`, `loop`, `par`, `group`, `partition`, `package`, `namespace`, `box`, …) com `end` / `@enduml` para fecho lógico onde aplicável.
- **Editor de texto**: integrar com `Format Document` via `DocumentFormattingEditProvider` para `plantuml`.
- **Custom editor** (PlantUML Viewer activo): comando dedicado **PlantUML: Format document** que reescreve o `TextDocument` subjacente (o conteúdo da Webview actualiza-se pelo fluxo existente).
- Formatação **não** deve alterar a semântica do diagrama; em caso de dúvida, preferir **só trim** de linhas a reestruturar agressivamente.

### Script npm para `.vsix`

- Existir um script **`npm run vsix`** (ou nome equivalente documentado) que **compila** e invoca **`vsce package`**, gerando o ficheiro `.vsix` na raiz do repositório.

## Critérios de aceitação

1. Abrir um `.puml` no **PlantUML Viewer** mostra **cores** na área de código (keywords, comentários, setas, `@startuml`, `!include`, …). Com **Reopen Editor With… → Text Editor**, o **TextMate** da extensão também colore o buffer.
2. **Format Document** no editor de texto PlantUML aplica trim e indentação sem corromper um diagrama de sequência mínimo de teste.
3. Com o **custom editor** activo, **PlantUML: Format document** actualiza o ficheiro e a pré-visualização reflecte o texto novo.
4. `npm run vsix` conclui com sucesso e produz `plantuml-viewer-<versão>.vsix`.
5. Testes unitários cobrem a função pura de formatação (casos mínimos).

## Fora deste spec

- Parser PlantUML completo; formatação de todos os tipos de diagrama.
- Colorização dentro da Webview do custom editor.
- Integração com formatadores externos (Java, etc.).
