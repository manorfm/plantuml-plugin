# Spec: cliente PlantUML (HTTP)

## Problema

A extensão precisa de obter representações renderizadas (SVG para pré-visualização; SVG ou PNG para exportação) a partir do texto PlantUML, sem embutir o motor Java localmente por defeito.

## Comportamento esperado

- O utilizador configura uma **URL base** de um servidor PlantUML compatível; pedidos usam endpoints desse servidor para obter SVG ou PNG.
- Diagramas pequenos e grandes são suportados: quando o pedido por URL codificada deixa de ser viável, o cliente deve usar uma estratégia alternativa prevista pelo plano técnico, sem exigir acção manual do utilizador para essa escolha.
- Falhas de rede, tempos limite e respostas HTTP inválidas produzem mensagens compreensíveis; a extensão não deve terminar abruptamente.
- O tráfego HTTP dirige-se apenas ao destino configurado (ou ao valor por defeito definido ao nível de produto). O utilizador deve conseguir optar por servidor local para conteúdo sensível.

## Critérios de aceitação

1. Com servidor acessível e diagrama válido, o cliente devolve SVG ou PNG conforme o formato pedido.
2. Com servidor inacessível ou recusa de ligação, o erro comunicado indica natureza da falha e orienta verificação de URL/porta ou rede, sem crash.
3. Com tempo limite configurado ultrapassado, o pedido em curso é cancelado e o resultado reflecte cancelamento ou tempo limite.
4. Respostas HTTP de erro ou corpo inesperado (não SVG/PNG) são tratadas como falha controlada com mensagem útil.
5. O valor por defeito da URL base (quando o utilizador não define outro) está alinhado com a política de privacidade documentada no documento global do produto.

## Fora deste spec

- Como o SVG é mostrado no painel (Webview) ou guardado no disco — ver specs de pré-visualização e exportação.
- Sintaxe PlantUML e expansão de ficheiros — ver spec de preparação de fonte.
