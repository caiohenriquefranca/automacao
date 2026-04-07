---
name: Projeto de Automação Playwright Multi-Sistema
description: Automação E2E para múltiplos sistemas gov.br — portal, gestor, SSO, atendimento. Arquitetura de agentes especializados para geração eficiente de testes.
type: project
---

Projeto de automação de testes E2E com Playwright para conjunto de sistemas governamentais brasileiros com SSO GovBr.

Baseado no projeto de referência: `/home/caio/Documentos/equanimus/projeto-svs/portal/portal-pw`

**Why:** Automatizar testes de múltiplos sistemas (portal, gestor, SSO, atendimento) com máxima cobertura e eficiência, minimizando custo de IA via inspeção real de páginas antes de gerar código.

**How to apply:** Usar o fluxo `page-scout → especialista → spec-builder → qa-validator` para qualquer novo teste. Nunca gerar seletores por intuição — sempre inspecionar a página real primeiro.

## Sistemas Cobertos

| Sistema | URL env var | Pasta de testes |
|---------|-------------|-----------------|
| Portal do Cidadão | `BASE_URL` | `src/tests/portal/` |
| Gestor / Admin | `GESTOR_URL` | `src/tests/gestor/` |
| SSO / Autenticação | `SSO_URL` | `src/tests/sso/` |
| Atendimento | `ATENDIMENTO_URL` | `src/tests/atendimento/` |
| Novos sistemas | `[SISTEMA]_URL` | `src/tests/[sistema]/` |

## Arquitetura de Agentes (.claude/agents/)

```
orchestrator     → ponto de entrada, coordena workflow completo
page-scout       → inspeção de página real com Playwright
spec-builder     → geração do .spec.js a partir de dados reais
portal           → especialista portal do cidadão
gestor           → especialista sistema administrativo
sso              → especialista autenticação GovBr
atendimento      → especialista sistema de atendimento
qa-validator     → executa, valida e corrige specs gerados
```

## Princípio de Custo Mínimo

1. `page-scout` primeiro — dados reais = zero iterações de seletor errado
2. `spec-builder` usa template + dados reais = geração direta
3. `qa-validator` fecha o ciclo — uma rodada de correção, não múltiplas tentativas
