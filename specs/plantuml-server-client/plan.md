# Plan: cliente PlantUML (HTTP)

**Spec de referência:** [spec.md](./spec.md)

## Arquitectura

- Cliente implementado no **Extension Host** (Node), usando `fetch` global, não a Webview.
- Codificação do diagrama para URLs GET via biblioteca `plantuml-encoder` (dependência de runtime incluída no pacote).
- URL base normalizada (tratamento de espaços e barras finais) antes de compor caminhos `/svg` e `/png`.
- Combinação de `AbortSignal` externo com temporizador configurável para respeitar `requestTimeoutMs`.

## Decisões técnicas

| Decisão | Justificativa |
|---------|----------------|
| GET com path codificado quando a URL é suficientemente curta | Compatível com servidores PlantUML habituais. |
| POST com corpo texto UTF-8 quando a URL GET excede o limite ou após 404/414 no GET | Mitiga limites de proxy e Jetty em URLs longas. |
| Mensagens de erro com dicas por código de erro subjacente (`cause`) | Melhor diagnóstico em Node/undici (`fetch failed`, `ECONNREFUSED`, etc.). |

## Trade-offs

- **Servidor público por defeito:** pré-visualização imediata sem Docker; o texto do diagrama transita pela rede. Utilizadores com requisitos de confidencialidade devem configurar servidor local (documentado no spec e no documento global).
- **Sem JAR embutido:** menos peso e complexidade legal de Java; dependência de rede ou de infraestrutura local.

## Módulos de referência (implementação actual)

- Lógica principal: `src/plantuml/serverClient.ts`
- Leitura de URL e timeout: `src/plantumlConfig.ts` (integração com configuração VS Code)

## Dependências

- Spec **preparação de fonte** (texto final enviado no POST ou codificado no GET).
- Configuração `plantumlViewer.serverUrl`, `plantumlViewer.requestTimeoutMs`.
