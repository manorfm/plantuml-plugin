# Plan: preparação do texto fonte

**Spec de referência:** [spec.md](./spec.md)

## Arquitectura

- Fase **expand includes**: percorre o texto, identifica linhas `!include` elegíveis, lê via `vscode.workspace.fs` ou API equivalente, limite de profundidade, detecção de ciclo.
- Fase **préâmbulo**: prefixação de texto de configuração (`diagramPreamble`) após includes.
- Ordem fixa: (1) texto do documento → (2) expansão de includes → (3) préâmbulo → (4) consumo pelo cliente HTTP e pela exportação.

## Decisões técnicas


| Decisão                                          | Justificativa                                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `!includeurl` não tratado como include local     | Evita I/O de rede implícito e ambiguidade de segurança; alinhado ao parser actual. |
| Padrões de caminho: simples, `<ficheiro>`, aspas | Cobertura das formas mais usadas em repositórios.                                  |


## Trade-offs

- **Apenas includes locais `file:`:** simplicidade e previsibilidade; utilizadores com `!includeurl` dependem do servidor PlantUML.

## Módulos de referência (implementação actual)

- `src/plantuml/expandIncludes.ts`
- `src/plantuml/sourceTransform.ts` (`applyDiagramPreamble`)

## Dependências

- Configuração `plantumlViewer.diagramPreamble`.
- URI do documento rastreado para resolver caminhos relativos.

