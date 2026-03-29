# Spec: preparação do texto fonte

## Problema

O texto aberto pelo utilizador pode referenciar outros ficheiros e pode precisar de um bloco comum de directivas (temas, `skinparam`) antes do diagrama. O servidor recebe um único fluxo de texto coerente e resolvido quando possível.

## Comportamento esperado

- Linhas de inclusão local reconhecíveis são expandidas com conteúdo lido do sistema de ficheiros do workspace, relativamente ao documento de origem.
- Inclusões em URL ou formas não suportadas para expansão local não são silenciosamente “corrigidas”; o comportamento segue o que está acordado no plano técnico (preservar ou reportar).
- Ciclos de inclusão são detetados e tratados como erro compreensível.
- Um texto opcional configurado pelo utilizador pode ser aplicado **após** a resolução de inclusões e **antes** do envio ao servidor, sem alterar o ficheiro guardado no disco.

## Critérios de aceitação

1. Diagrama com `!include` local válido envia ao servidor o texto já combinado.
2. Include inválido ou ficheiro em falta produz mensagem de erro visível no fluxo de pré-visualização (ou equivalente), sem crash.
3. Ciclo de includes é detectado e reportado.
4. Com préâmbulo configurado, o servidor recebe préâmbulo seguido do diagrama (após includes), na ordem correcta.
5. Documentos não persistidos como `file:` não permitem resolução de includes em disco de forma que exija caminhos relativos inconsistentes — o comportamento face a esse caso está alinhado com o plano.

## Fora deste spec

- Chamadas HTTP ao servidor.
- Modos de vista e ciclo de vida da Webview.
