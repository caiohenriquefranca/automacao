# Guia do Projeto — Automação Playwright (Multi-Sistema)

Guia de referência para entender, configurar e usar o projeto de automação de testes E2E com Playwright para sistemas gov.br.

---

## Visão Geral

O projeto automatiza testes de ponta a ponta em múltiplos sistemas que usam autenticação **SSO GovBr** (login.gov.br com CAPTCHA). A estratégia central é:

1. Fazer login uma vez manualmente (`npm run save-auth`), salvando a sessão em `auth.json`
2. Todos os specs reutilizam esse `auth.json` — sem repetir o fluxo SSO a cada teste
3. Dados de formulário são gerados dinamicamente com **faker-br** (CPF, CNPJ, nomes válidos)
4. Seletores são sempre obtidos da **página real** via agente `page-scout` — nunca por intuição

**Stack:** Playwright · Node.js · faker-br · playwright-extra + stealth plugin

**Sistemas cobertos:**

| Sistema | Descrição | Var de ambiente |
|---------|-----------|-----------------|
| **portal** | Portal do cidadão — serviços, solicitações, formulários | `BASE_URL` |
| **gestor** | Painel administrativo — CRUD, aprovações, relatórios | `GESTOR_URL` |
| **sso** | Autenticação GovBr — login, sessão, multi-conta | `SSO_URL` |
| **atendimento** | Helpdesk — chamados, tickets, filas, histórico | `ATENDIMENTO_URL` |

---

## Estrutura de Pastas

```
nome-do-projeto/
│
├── src/
│   ├── support/                  — helpers reutilizáveis (SEMPRE verificar aqui antes de criar novo)
│   │   ├── save-auth.js          — gera auth.json via login SSO com stealth (rodar 1x por sessão)
│   │   ├── auth.js               — loginSSO(), fecharModaisIniciais()
│   │   └── form.js               — preencherCampoTexto(), uploadPorLabel(), selecionarOpcao(), etc.
│   │
│   ├── tests/                    — specs organizados por sistema
│   │   ├── portal-login.spec.js  — setup de autenticação (executado automaticamente antes dos testes)
│   │   ├── portal/               — serviços e solicitações do portal do cidadão
│   │   ├── gestor/               — administração e CRUD do painel gestor
│   │   ├── sso/                  — autenticação e fluxos de sessão
│   │   ├── atendimento/          — chamados, tickets e helpdesk
│   │   └── exemplo/
│   │       └── exemploServico.spec.js  — TEMPLATE: copiar este para criar novos testes
│   │
│   ├── fixtures/
│   │   └── documents/            — PDFs usados em uploads de teste (cnpj.pdf, representante-legal.pdf…)
│   │
│   ├── data/                     — dados estáticos opcionais (JSON, CSV)
│   └── pages/                    — Page Objects opcionais (abordagem helper-based não exige)
│
├── .claude/                      — configuração do Claude Code para este projeto
│   ├── CLAUDE.md (raiz)          — regras globais lidas automaticamente pelo Claude
│   ├── CLAUDE.local.md           — overrides locais (não commitar)
│   ├── agents/                   — agentes especializados do projeto
│   │   ├── orchestrator.md       — coordenador principal — ponto de entrada para criar testes
│   │   ├── page-scout.md         — inspeciona páginas reais e extrai seletores verificados
│   │   ├── spec-builder.md       — gera specs .js a partir do mapa de página
│   │   ├── portal.md             — especialista no portal do cidadão
│   │   ├── gestor.md             — especialista no sistema gestor/admin
│   │   ├── sso.md                — especialista em autenticação e sessão
│   │   ├── atendimento.md        — especialista no sistema de atendimento
│   │   ├── qa-validator.md       — executa, valida e corrige testes gerados
│   │   └── debugger.md           — diagnostica falhas — lê spec+artefatos e propõe correção
│   ├── rules/
│   │   ├── testing.md            — hierarquia de seletores, estratégias de espera, estrutura obrigatória
│   │   ├── code-style.md         — nomenclatura, sistema de módulos (CommonJS vs ESM)
│   │   ├── data-policy.md        — quando usar faker-br, dados fixos vs variáveis, credenciais
│   │   ├── flakiness.md          — esperas semânticas, retries, isolamento entre testes
│   │   └── reporting.md          — screenshots, traces, nomenclatura de artefatos
│   ├── skills/
│   │   ├── auth/login-gov.md     — técnica de bypass SSO GovBr com stealth plugin
│   │   ├── data/faker-br.md      — snippets de geração de dados brasileiros
│   │   ├── playwright/
│   │   │   ├── setup.md          — checklist para inicializar novo projeto
│   │   │   ├── debugging.md      — Inspector, Trace Viewer, diagnóstico de falhas
│   │   │   ├── selectors-avancados.md — Shadow DOM, iframe, strict mode, elementos dinâmicos
│   │   │   ├── downloads.md      — download de PDFs e arquivos com waitForEvent
│   │   │   └── multi-tab.md      — fluxos que abrem nova aba ou popup
│   │   ├── forms/
│   │   │   └── campos-mascarados.md — CPF, CNPJ, CEP, telefone, data, moeda
│   │   └── ci-cd/
│   │       └── github-actions.md — pipeline CI com secrets, cache e artefatos
│   ├── commands/
│   │   ├── run-tests.md          — /run-tests: executa testes com opções e trace
│   │   ├── generate-data.md      — /generate-data: gera massa de dados faker-br
│   │   ├── inspect-page.md       — /inspect-page: aciona page-scout em uma URL
│   │   ├── fix-test.md           — /fix-test: diagnostica e corrige spec falhando
│   │   ├── check-auth.md         — /check-auth: verifica validade do auth.json
│   │   └── new-spec.md           — /new-spec: wizard interativo para criar spec
│   ├── hooks/
│   │   └── validate-tests.sh     — valida specs (test.describe, test.beforeEach, auth imports)
│   ├── settings.json             — permissões de ferramentas para os agentes
│   └── memory/
│       └── project-context.md    — contexto persistente do projeto para o Claude
│
├── playwright.config.js          — configuração do Playwright (ESM; dois projetos: setup + chromium)
├── package.json                  — dependências e scripts npm
├── .mcp.json                     — configuração de servidores MCP
├── .env.example                  — template das variáveis de ambiente
├── .env                          — variáveis reais (NÃO commitar — está no .gitignore)
└── auth.json                     — sessão SSO salva (NÃO commitar — está no .gitignore)
```

---

## Setup (Primeira Vez)

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo de ambiente
cp .env.example .env
# Editar .env e preencher:
#   BASE_URL=https://portal.exemplo.gov.br
#   GESTOR_URL=https://gestor.exemplo.gov.br
#   ATENDIMENTO_URL=https://atendimento.exemplo.gov.br
#   USER_CPF=000.000.000-00
#   USER_PASSWORD=sua_senha

# 3. Gerar sessão de autenticação
npm run save-auth
# → Abre browser → Preenche CPF automaticamente
# → Aguarda 60s para resolver o CAPTCHA manualmente
# → Salva auth.json

# 4. Rodar os testes
npm test
```

> `auth.json` expira com a sessão do portal (geralmente horas/dias). Quando expirar, rode `npm run save-auth` novamente.

---

## Scripts npm

| Comando | O que faz |
|---|---|
| `npm run save-auth` | Abre browser, faz login SSO e salva sessão em `auth.json` |
| `npm test` | Roda todos os testes (projeto `setup` → projeto `chromium`) |
| `npm run test:headed` | Roda com browser visível (bom para ver o que está acontecendo) |
| `npm run test:debug` | Abre Playwright Inspector (step-by-step com DevTools) |
| `npm run report` | Abre relatório HTML com resultado, screenshots e traces |

**Comandos avançados (`npx playwright`):**

```bash
# Rodar spec específico
npx playwright test src/tests/portal/meuTeste.spec.js

# Rodar com browser visível
npx playwright test src/tests/gestor/meuTeste.spec.js --headed

# Filtrar por nome do teste
npx playwright test --grep "fluxo completo"

# Rodar em modo debug (para inspecionar seletores)
npx playwright test src/tests/portal/meuTeste.spec.js --debug
```

---

## Hook de Validação de Specs

O arquivo `.claude/hooks/validate-tests.sh` verifica automaticamente os padrões obrigatórios nos specs.

**O que ele valida:**
- Presença de `test.describe()` em todos os specs
- Presença de `test.beforeEach()` em todos os specs
- Importação dos helpers de auth (`loginSSO` / `fecharModaisIniciais`)
- Existência de `auth.json` e `.env`

**Executar manualmente (em qualquer spec):**
```bash
bash .claude/hooks/validate-tests.sh
```

**Integrar como pre-commit hook:**
```bash
# Criar hook de pre-commit
echo 'bash .claude/hooks/validate-tests.sh' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

---

## Arquitetura de Agentes

O projeto usa agentes especializados em `.claude/agents/` para garantir qualidade máxima com menor custo de IA.

### Princípio: Page-First, AI-Second

**Nunca gerar seletores por intuição.** Sempre inspecionar a página real com Playwright antes de gerar código. O agente `page-scout` faz isso automaticamente — dados reais = seletores corretos da primeira vez.

### Fluxo Obrigatório para Criar Testes

```
1. COLETAR — usuário informa sistema, URL e fluxo
2. page-scout — inspeciona a página real e extrai seletores verificados
3. especialista (portal/gestor/sso/atendimento) — aplica contexto do sistema
4. spec-builder — gera o arquivo .spec.js a partir do mapa + contexto
5. qa-validator — executa, valida e corrige se necessário
```

### Agentes Disponíveis

| Agente | Quando usar |
|--------|-------------|
| `orchestrator` | **Ponto de entrada** para qualquer criação ou atualização de teste |
| `page-scout` | Inspecionar página real antes de gerar spec (sempre o primeiro passo) |
| `spec-builder` | Gerar arquivo .spec.js a partir do mapa de página |
| `portal` | Especialista no portal do cidadão |
| `gestor` | Especialista no sistema gestor/admin |
| `sso` | Especialista em autenticação e sessão |
| `atendimento` | Especialista no sistema de atendimento |
| `qa-validator` | Executar, validar e corrigir testes gerados |
| `debugger` | **Diagnosticar falhas** — lê spec + artefatos + erro e propõe correção pontual |

### Adicionar um Novo Sistema

1. Criar pasta `src/tests/[sistema]/`
2. Adicionar `[SISTEMA]_URL` no `.env.example` e no `.env`
3. O `orchestrator` coordena o restante usando `page-scout` para explorar o novo sistema

---

## Como Criar um Novo Teste

### Via Agentes (recomendado)

Diga ao Claude (que acionará o `orchestrator`):

```
Cria um spec para o serviço "Nome do Serviço" no [sistema] (URL: /caminho).
Fluxo: [descreva o passo a passo em linguagem natural]
```

O orchestrator coordenará page-scout → especialista → spec-builder → qa-validator automaticamente.

### Manualmente (a partir do template)

1. **Copiar o template:**
   ```bash
   cp src/tests/exemplo/exemploServico.spec.js src/tests/portal/nomeDoServico.spec.js
   ```

2. **Adaptar no arquivo copiado:**
   - Alterar `SERVICO` e `MODULO` no topo
   - Ajustar dados gerados com faker-br conforme os campos do formulário
   - Substituir os seletores de exemplo pelos seletores reais do portal
   - Atualizar caminhos dos documentos em `docs`

3. **Adicionar PDFs necessários:**
   ```
   src/fixtures/documents/cnpj.pdf
   src/fixtures/documents/representante-legal.pdf
   ```

4. **Testar isolado antes de integrar:**
   ```bash
   npx playwright test src/tests/portal/nomeDoServico.spec.js --headed
   ```

---

## Helpers Disponíveis

Antes de criar qualquer função nova, verificar se já existe em `src/support/`.

### `src/support/auth.js`

```js
const { loginSSO, fecharModaisIniciais } = require('../../support/auth');

await fecharModaisIniciais(page);  // fecha modais de news, cookies, perfil incompleto
await loginSSO(page);              // faz login SSO ou detecta sessão já autenticada
```

### `src/support/form.js`

```js
const { preencherCampoTexto, preencherCampoArea, uploadPorLabel, selecionarOpcao } = require('../../support/form');

await preencherCampoTexto(page, 'Razão Social', empresa.razaoSocial);
await preencherCampoArea(page, 'Observações', 'Texto livre...');
await uploadPorLabel(page, 'Documento CNPJ', docs.cnpj);
await selecionarOpcao(page, 'Tipo de Solicitação', 'Novo Cadastro');
```

Todas as funções **retornam `false` silenciosamente** se o elemento não for encontrado — nunca lançam exceção.

---

## Como Interagir com o Claude Neste Projeto

### O que o Claude lê automaticamente

Ao iniciar uma conversa dentro do projeto, o Claude carrega:
- `CLAUDE.md` — contexto global, regras de ouro, lista de sistemas
- `.claude/rules/*.md` — padrões obrigatórios de teste, código e dados
- `.claude/memory/project-context.md` — contexto persistente

Use `.claude/skills/` como referência quando precisar de técnicas específicas. Cada skill é um guia prático com snippets copiáveis — o Claude as consulta automaticamente quando o contexto exige.

---

### Skills Disponíveis

#### `auth/login-gov.md` — Autenticação SSO GovBr

**O que contém:** Técnica de bypass do CAPTCHA GovBr usando `playwright-extra` com Stealth Plugin. Inclui o código completo de `save-auth.js`, as funções `loginSSO()` e `fecharModaisIniciais()`, e a configuração do `storageState` no Playwright.

**Por que é importante:** O GovBr bloqueia automação detectando o `webdriver`. Sem esta técnica, é impossível autenticar nos sistemas automaticamente. Todo o projeto depende dela para funcionar.

**Quando consultar:** Ao configurar autenticação em um novo sistema, ao entender como o `auth.json` é gerado, ou ao depurar falhas de login.

---

#### `data/faker-br.md` — Geração de Dados Brasileiros

**O que contém:** Snippets prontos para gerar CPF, CNPJ, nomes, endereços e telefones com `faker-br`. Inclui CEP fixo validado (68902865 — Macapá/AP) para auto-preenchimento confiável e instruções sobre quando usar dados variáveis vs fixos.

**Por que é importante:** Formulários que validam CPF e CNPJ com dígitos verificadores reais. Dados aleatórios sem validação causam falha nos formulários. faker-br gera dados estruturalmente válidos a cada execução.

**Quando consultar:** Ao criar qualquer spec que preenche formulários com dados de empresa, pessoa ou endereço.

---

#### `playwright/setup.md` — Inicialização de Novo Projeto

**O que contém:** Checklist completo para criar um projeto do zero: estrutura de pastas, `package.json`, `playwright.config.js` com ESM e dois projetos (setup + chromium), `.env.example`, `.gitignore` e os dois checklists (novo projeto e novo teste).

**Por que é importante:** Garante que todo projeto comece com a configuração correta: `retries` para CI, `screenshot/trace` configurados para falhas, `storageState` apontando para o `auth.json`.

**Quando consultar:** Ao criar um projeto de automação do zero ou ao revisar se a configuração base está correta.

---

#### `playwright/debugging.md` — Diagnóstico de Falhas

**O que contém:** Guia completo de depuração: Playwright Inspector (`--debug`), Trace Viewer (como capturar e abrir), captura de logs de console e rede, interpretação das mensagens de erro mais comuns (`strict mode violation`, `timeout exceeded`, `Target closed`) e checklist de diagnóstico em 6 passos.

**Por que é importante:** Testes falham por razões nem sempre óbvias. Saber usar o Trace Viewer e o Inspector elimina o ciclo de tentativa e erro e reduz drasticamente o tempo de diagnóstico.

**Quando consultar:** Sempre que um teste falhar e a mensagem de erro não for suficiente para entender a causa.

---

#### `playwright/selectors-avancados.md` — Seletores Difíceis

**O que contém:** Técnicas para alcançar elementos que `getByRole` e `getByLabel` não cobrem: elementos dentro de **iframe** (`frameLocator`), **Shadow DOM** (`pierce:`), elementos **dinâmicos** com `waitFor` e `filter`, resolução de **strict mode** com `.first()` e `.nth()`, navegação em **tabelas** e **selects customizados** (Select2, Chosen).

**Por que é importante:** Portais frequentemente usam componentes de terceiros, iframes para mapas ou assinatura digital, e estruturas DOM não-semânticas. Sem estas técnicas, vários elementos simplesmente não são alcançáveis com seletores básicos.

**Quando consultar:** Quando `getByRole` ou `getByLabel` falhar, quando o elemento estiver dentro de iframe, quando houver strict mode violation, ou ao interagir com tabelas e selects customizados.

---

#### `playwright/downloads.md` — Download de Arquivos

**O que contém:** Padrão `Promise.all` com `waitForEvent('download')`, como salvar o arquivo localmente, verificar nome e extensão, lidar com timeout longo em relatórios pesados, múltiplos downloads sequenciais e PDFs que abrem em nova aba antes de baixar.

**Por que é importante:** Protocolos, comprovantes e relatórios são saídas essenciais dos sistemas. Sem esta skill, o teste não consegue verificar que o arquivo foi gerado corretamente — e `page.click()` no botão de download sem `waitForEvent` faz o teste falhar silenciosamente.

**Quando consultar:** Ao testar qualquer fluxo que gere protocolo PDF, exportação de relatório ou comprovante para download.

---

#### `playwright/multi-tab.md` — Múltiplas Abas e Popups

**O que contém:** Como aguardar nova aba com `context.waitForEvent('page')`, interagir com popups (`waitForEvent('popup')`), verificar URL de PDF em nova aba, trabalhar com múltiplas abas abertas e fechar abas após verificação.

**Por que é importante:** Portais frequentemente abrem visualizações de documento, sistemas externos (assinatura ICP-Brasil) e relatórios em nova aba. Sem tratar a nova aba corretamente, o teste perde o controle e trava esperando por um elemento que está em outra aba.

**Quando consultar:** Quando clicar em um link abre nova aba, quando há popup de assinatura digital, ou quando o fluxo inclui "Visualizar PDF" que abre em nova janela.

---

#### `forms/campos-mascarados.md` — Campos com Máscara

**O que contém:** Receita para cada tipo de campo mascarado: CPF, CNPJ, CEP (com espera do auto-fill de endereço), telefone, data (texto e datepicker), e moeda. Explica por que `fill()` falha em campos com máscara e como `pressSequentially` com `delay: 80` resolve. Inclui também como limpar campo antes de preencher e como verificar o valor final com a máscara aplicada.

**Por que é importante:** Quase todo formulário tem campos com máscara. Usar `fill()` direto em um campo CPF simplesmente não funciona — o valor é inserido mas a máscara não é aplicada, o formulário não valida e o teste falha. Esta skill evita um dos erros mais comuns na automação destes sistemas.

**Quando consultar:** Ao preencher qualquer campo de CPF, CNPJ, CEP, telefone, data ou valor monetário.

---

#### `ci-cd/github-actions.md` — Pipeline de CI

**O que contém:** Workflow YAML completo para GitHub Actions com cache de browsers, configuração de `secrets` para as variáveis de ambiente e para o `AUTH_JSON`, upload automático de artefatos (screenshots, traces, relatório HTML) em caso de falha, execução em matrix por sistema e orientações para renovar a sessão SSO periodicamente.

**Por que é importante:** Sem CI, os testes só rodam manualmente. Esta skill permite que os testes sejam executados automaticamente a cada push ou pull request, com artefatos disponíveis para diagnóstico de falhas remotas — sem precisar reproduzir localmente.

**Quando consultar:** Ao configurar execução automática dos testes, ao configurar secrets no GitHub, ou ao investigar falhas que acontecem apenas em CI.

### Comandos Customizados

Estes comandos estão definidos em `.claude/commands/` e podem ser invocados diretamente:

| Comando | O que faz |
|---|---|
| `/run-tests` | Executa os testes com opções interativas |
| `/generate-data` | Gera snippets de dados com faker-br |
| `/inspect-page [url] [sistema]` | Inspeciona página real e retorna mapa de seletores |
| `/fix-test [arquivo] [erro]` | Diagnostica e corrige spec falhando |
| `/check-auth` | Verifica se auth.json está válido antes de rodar |
| `/new-spec [sistema] [url]` | Wizard interativo para criar spec do zero |

---

## Boas Práticas de Engenharia de Prompt

### Princípio Geral

O Claude neste projeto já conhece os padrões via `CLAUDE.md` e `rules/`, e tem agentes especializados por sistema. Seus prompts devem focar em **contexto de negócio** — qual sistema, qual fluxo, quais dados. O Claude já sabe usar `getByRole`, `loginSSO`, `faker-br`, acionar o `page-scout`, etc.

---

### 1. Identifique o Sistema Alvo

O Claude precisa saber em qual dos sistemas o fluxo acontece.

**Ruim:**
> "Cria um teste para o portal"

**Bom:**
> "Cria um spec para o **portal** — serviço 'Habilitação de Estabelecimento de Saúde' em `/servicos/habilitacao`. O fluxo é: buscar o serviço pelo nome → clicar no card → preencher CNPJ → selecionar 'Novo Pedido' → upload do alvará → confirmar e aguardar protocolo."

---

### 2. Descreva o Fluxo Como um Manual do Usuário

Pense em como você explicaria o passo a passo para alguém que nunca usou o sistema.

**Ruim:**
> "Automatiza o fluxo de cadastro"

**Bom:**
> "O fluxo é:
> 1. Navegar para `/cadastro`
> 2. Clicar em 'Nova Empresa'
> 3. Preencher CNPJ (campo com máscara xx.xxx.xxx/xxxx-xx)
> 4. Aguardar preenchimento automático da razão social (leva ~2s após sair do campo)
> 5. Preencher campos de endereço (CEP dispara busca automática)
> 6. Upload do contrato social (PDF)
> 7. Clicar em 'Enviar' e aguardar mensagem 'Protocolo gerado'"

---

### 3. Informe Campos com Comportamentos Especiais

Alguns campos têm máscara, dependências ou comportamentos não-óbvios.

**Bom:**
> "O campo CPF usa máscara e precisa de `pressSequentially` com delay. O campo Município só aparece após selecionar o Estado. O botão 'Próximo' fica desabilitado até todos os campos obrigatórios estarem preenchidos."

---

### 4. Indique Arquivos Existentes Relevantes

Se já existe um spec parecido ou um helper específico, diga ao Claude.

**Bom:**
> "Já existe `src/tests/portal/cadastroEmpresa.spec.js` com fluxo similar. Cria `src/tests/portal/alteracaoEmpresa.spec.js` baseado nele, mas para o fluxo de alteração de dados cadastrais."

---

### 5. Diga o que NÃO Fazer

Evitar comportamentos que o Claude poderia assumir por padrão.

**Bom:**
> "Não cria Page Object — usa os helpers existentes de `src/support/form.js`. Não usa `waitForTimeout` sem comentário. Não hardcoda CPF ou senha — usa `process.env`."

---

### 6. Para Depuração: Descreva o Sintoma Exato

**Ruim:**
> "O teste não está funcionando"

**Bom:**
> "O spec `src/tests/portal/licencaSanitaria.spec.js` falha em `await uploadPorLabel(page, 'Alvará Sanitário', docs.alvara)` com erro 'locator not found'. No portal, o label do campo é 'Alvará Sanitário Municipal' (com a palavra 'Municipal'). Corrige o seletor ou ajusta a chamada."

---

### 7. Para Corrigir Seletores: Forneça o HTML Real

Se um seletor não está funcionando, cole o HTML do elemento ou descreva sua estrutura.

**Bom:**
> "O botão 'Solicitar Serviço' não está sendo encontrado por `getByRole('button', { name: 'Solicitar Serviço' })`. No HTML ele é um `<a>` com classe `btn` e texto 'Solicitar Serviço'. Ajusta o seletor."

---

### Exemplos de Prompts Completos

**Criar novo spec:**
```
Cria um spec em src/tests/portal/licencaSanitaria.spec.js para o serviço
"Licença Sanitária — Renovação" no portal (URL: /servicos/licenca-sanitaria/renovacao).

Fluxo:
1. Buscar o serviço na home pelo nome
2. Clicar no card do serviço
3. Preencher CNPJ da empresa (com máscara)
4. Selecionar "Renovação" no campo "Tipo de Solicitação"
5. Preencher data de vencimento da licença atual (formato dd/mm/aaaa)
6. Upload do documento "Licença Anterior" (PDF)
7. Clicar em "Enviar Solicitação"
8. Aguardar e verificar mensagem com número de protocolo

Campos de dados necessários: cnpj (faker-br), dataVencimento (data fixa '01/12/2024').
Documento em src/fixtures/documents/licenca-anterior.pdf.
Não criar Page Object — usar helpers existentes de src/support/.
```

**Corrigir fluxo com erro:**
```
O spec src/tests/portal/licencaSanitaria.spec.js falha na etapa de upload.
Erro: "Error: locator.click: Target closed"
O campo de upload abre um dialog do sistema operacional, não um input[type=file] diretamente.
Verifica como uploadPorLabel em src/support/form.js lida com file chooser e ajusta se necessário.
```

**Adicionar passo a spec existente:**
```
No spec src/tests/gestor/cadastroEmpresa.spec.js, após o preenchimento do endereço,
adiciona um passo para selecionar o "Responsável Técnico" em um select que aparece
somente quando o tipo de empresa é "Prestador de Serviço de Saúde".
O select é opcional — se não aparecer, o teste deve continuar sem falhar.
```

---

## Padrões Críticos (Resumo Rápido)

```js
// Estrutura mínima obrigatória de todo spec
const { test, expect } = require('@playwright/test');
const { fecharModaisIniciais, loginSSO } = require('../../support/auth');

test.setTimeout(300000);

test.describe('Nome do Serviço — Módulo', () => {
  test.beforeEach(async ({ page }) => {
    const resposta = await page.goto('/');
    expect(resposta && resposta.ok()).toBeTruthy();
    await fecharModaisIniciais(page);
  });

  test('fluxo completo', async ({ page }) => {
    await loginSSO(page);
    // ...
  });
});
```

| Regra | Correto | Evitar |
|---|---|---|
| Seletores | `getByRole`, `getByLabel` | `.locator('.btn-primary')` |
| Esperas | `waitForURL`, `expect().toBeVisible()` | `waitForTimeout(3000)` sem comentário |
| Elementos opcionais | `await el.isVisible().catch(() => false)` | `await el.click()` sem checar |
| Credenciais | `process.env.USER_CPF` | CPF/senha hardcoded |
| Módulos nos specs | `require()` (CommonJS) | `import` (ESM) |
| Uploads | `uploadPorLabel(page, label, path)` | `input[type=file]` direto |
| Dados | `faker-br` para formulários variáveis | Dados fixos repetidos |
| Seletores de origem | `page-scout` (página real) | Intuição / tentativa e erro |
| Pasta dos specs | `src/tests/[sistema]/` | Tudo misturado em `tests/` |
