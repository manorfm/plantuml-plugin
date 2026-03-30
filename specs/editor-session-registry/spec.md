# Spec: registo de sessão do custom editor PlantUML

## Problema

Vários módulos (exportação, formatação, barra de estado) precisam de saber qual é o documento PlantUML «activo» quando o utilizador trabalha no **custom editor** (Webview). Manter esse estado apenas num `Map` estático dentro do ficheiro do provider cria **acoplamento** desnecessário: qualquer funcionalidade que precise do documento activo acaba a importar o provider inteiro, mesmo quando só precisa de uma superfície mínima (`document`, `setMode`, `refreshDiagram`).

## Comportamento esperado

- A extensão continua a resolver **uma** sessão activa por aba quando o separador activo é o custom editor PlantUML Viewer (`TabInputCustom` com o view type correcto).
- Exportação, formatação e ícones da barra de estado obtêm o documento ou a sessão através de um **módulo dedicado** ao registo, sem depender da classe do provider para esse fim.
- O provider regista e remove entradas quando o editor é aberto ou fechado; não há referências circulares de import entre «export / rede» e a implementação completa do custom editor.

## Critérios de aceitação

1. O módulo de exportação **não** importa o ficheiro do `PlantumlCustomEditorProvider` apenas para obter o documento activo.
2. `getActivePlantumlDocument()` e `getActivePlantumlEditorSession()` têm a mesma semântica que antes: custom editor activo ou, em alternativa, editor de texto com ficheiro PlantUML reconhecido.
3. Comportamento da extensão (comandos, pré-visualização, export) permanece correcto nos cenários já cobertos por testes.

## Fora deste spec

- Detalhe de implementação da Webview ou do pipeline de renderização.
