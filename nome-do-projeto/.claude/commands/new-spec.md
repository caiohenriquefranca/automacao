# Comando /new-spec

Wizard interativo para criar um novo spec do zero, coordenando automaticamente o fluxo completo: page-scout → especialista → spec-builder → qa-validator.

---

## Sintaxe

```
/new-spec [sistema] [url] [descrição-do-fluxo]
```

**Parâmetros:**
- `sistema` — `portal`, `gestor`, `sso` ou `atendimento`
- `url` — caminho relativo ou URL completa da página inicial do fluxo
- `descrição-do-fluxo` (opcional) — descrição em linguagem natural do que o teste deve fazer

---

## Exemplos de uso

```
/new-spec portal /servicos/licenca-sanitaria

/new-spec gestor /admin/empresas "Criar nova empresa: preencher CNPJ, razão social, endereço e salvar"

/new-spec atendimento /chamados/novo "Abrir chamado com título, categoria e anexo PDF"
```

---

## Fluxo executado

Ao receber este comando, coordenar automaticamente:

```
1. COLETAR
   └─ Se parâmetros incompletos → perguntar sistema, URL e fluxo
   └─ Se completos → prosseguir

2. page-scout (inspect)
   └─ Navegar até a URL com auth.json
   └─ Mapear: campos, botões, labels, elementos dinâmicos
   └─ Retornar mapa de página verificado

3. especialista (contexto do sistema)
   └─ portal / gestor / sso / atendimento
   └─ Aplicar padrões específicos do sistema

4. spec-builder (geração)
   └─ Gerar arquivo .spec.js no caminho correto
   └─ Usar helpers existentes (form.js, auth.js)
   └─ Aplicar padrões de testing.md e code-style.md

5. qa-validator (validação)
   └─ Verificar estrutura obrigatória (test.describe, test.beforeEach)
   └─ Checar anti-patterns
   └─ Propor execução de teste: npx playwright test <arquivo> --headed
```

---

## Diálogo quando parâmetros estão incompletos

Se o usuário executar apenas `/new-spec`, perguntar:

```
Qual sistema será testado?
  1. portal — Portal do cidadão (BASE_URL)
  2. gestor — Painel administrativo (GESTOR_URL)
  3. sso — Autenticação GovBr (SSO_URL)
  4. atendimento — Helpdesk (ATENDIMENTO_URL)

Informe o número ou nome do sistema:
```

Após o sistema:

```
Qual a URL ou caminho da página inicial do fluxo?
Exemplo: /servicos/licenca-sanitaria
```

Após a URL:

```
Descreva o fluxo em linguagem natural (passo a passo):
Exemplo:
  1. Buscar serviço pelo nome
  2. Clicar no card
  3. Preencher CNPJ
  4. Selecionar tipo de solicitação
  5. Upload do documento
  6. Clicar em Enviar
  7. Verificar protocolo

(ou pressione Enter para usar apenas o mapa de página como base)
```

---

## Saída final

```
✓ Mapa de página obtido via page-scout
✓ Contexto do sistema portal aplicado
✓ Spec gerado em: src/tests/portal/licencaSanitaria.spec.js
✓ Validação concluída — sem anti-patterns detectados

Para executar:
  npx playwright test src/tests/portal/licencaSanitaria.spec.js --headed

Se algo falhar:
  /fix-test src/tests/portal/licencaSanitaria.spec.js
```

---

## Quando usar vs orchestrator

| Situação | Use |
|----------|-----|
| Criação interativa guiada passo a passo | `/new-spec` |
| Criação direta com contexto completo já em mãos | Prompt para `orchestrator` |
| Atualizar spec existente | Prompt para `orchestrator` |
| Apenas inspecionar página | `/inspect-page` |
