# Tasks: cliente PlantUML (HTTP)

Mapeamento: **S** = [spec.md](./spec.md), **P** = [plan.md](./plan.md).

_Verificado na entrega **0.4.0** (`npm test`)._

## Manutenção e regressão

- [x] **T-SRV-1 (S: aceitação 1–2, P: fetch)** Suíte cobre `fetch` mockado, erros HTTP e `ECONNREFUSED`.
- [x] **T-SRV-2 (S: aceitação 3, P: timeout)** Teste de timeout com `AbortSignal` a passar.
- [x] **T-SRV-3 (S: aceitação 5, P: URL por defeito)** URL público por defeito alinhado em `serverClient`, `package.json` e docs.

## Evolução (quando o spec mudar)

- [ ] **T-SRV-4** Novo endpoint ou motor: documentar no plan antes de implementar.
