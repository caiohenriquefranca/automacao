---
name: atendimento
description: Especialista no sistema de Atendimento (helpdesk, chamados, tickets). Use quando gerar testes para: abertura de chamados, acompanhamento de tickets, filas de atendimento, histórico de interações, notificações, status de chamados, encerramento de atendimento.
---

# Especialista — Sistema de Atendimento

Você conhece os padrões de sistemas de atendimento/helpdesk para gerar testes corretos para fluxos de chamados e suporte.

## Variável de Ambiente

```
ATENDIMENTO_URL=https://atendimento.exemplo.gov.br
```

Sempre usar `process.env.ATENDIMENTO_URL || process.env.BASE_URL`.

## Estrutura Típica do Atendimento

```
/                          → Dashboard de atendimentos
/chamados                  → Lista de chamados (meus / todos)
/chamados/novo             → Abrir novo chamado
/chamados/[id]             → Detalhe / histórico do chamado
/chamados/[id]/responder   → Responder / atualizar chamado
/fila                      → Fila de atendimento (visão do atendente)
/relatorios                → Relatórios de SLA e produtividade
```

## Padrões de Interação Típicos

### Abrir Novo Chamado
```js
// Localizar botão de novo chamado
const btnNovoChamado = page.getByRole('button', { name: /novo chamado|abrir chamado|solicitar/i })
  .or(page.getByRole('link', { name: /novo|abrir/i }));
await btnNovoChamado.click();
await page.waitForURL(/\/novo|\/abrir|\/criar/i);
await page.waitForLoadState('domcontentloaded');
```

### Selecionar Categoria / Tipo de Chamado
```js
// Dropdown de categoria (obrigatório na maioria dos sistemas)
await selecionarOpcao(page, 'Categoria', 'Solicitação de Informação');
// OU
await selecionarOpcao(page, 'Tipo', 'Dúvida');
// OU
await page.getByLabel(/categoria|tipo de chamado/i).selectOption({ index: 1 });

// Selecionar urgência/prioridade se disponível
const selectPrioridade = page.getByLabel(/prioridade|urgência/i);
if (await selectPrioridade.isVisible({ timeout: 3000 }).catch(() => false)) {
  await selectPrioridade.selectOption({ label: 'Normal' });
}
```

### Preencher Dados do Chamado
```js
// Assunto / título do chamado
await preencherCampoTexto(page, 'Assunto', chamado.assunto);
// OU
await page.getByLabel(/assunto|título/i).fill(chamado.assunto);

// Descrição detalhada
await page.getByLabel(/descrição|detalhes|mensagem/i).fill(chamado.descricao);
```

### Anexar Arquivo ao Chamado
```js
const btnAnexar = page.getByRole('button', { name: /anexar|adicionar arquivo/i });
if (await btnAnexar.isVisible({ timeout: 3000 }).catch(() => false)) {
  await uploadPorLabel(page, 'Arquivo', docs.anexo);
}
```

### Submeter Chamado
```js
const btnEnviar = page.getByRole('button', { name: /enviar|abrir chamado|confirmar|registrar/i });
await btnEnviar.click();
await page.waitForLoadState('networkidle');
```

### Verificar Protocolo do Chamado
```js
// Padrões comuns de protocolo
await expect(
  page.getByText(/chamado.*aberto|protocolo|ticket.*registrado|solicitação.*criada/i)
).toBeVisible({ timeout: 30000 });

// Capturar número do protocolo
const protocolo = await page.getByText(/[A-Z]{2,}-\d+|\d{6,}/).first().textContent().catch(() => null);
if (protocolo) console.log('Protocolo:', protocolo.trim());
```

### Consultar Status do Chamado
```js
// Buscar chamado por protocolo
const campoBusca = page.getByPlaceholder(/protocolo|número|buscar/i);
await campoBusca.fill(protocoloGerado);
await page.keyboard.press('Enter');
await page.waitForLoadState('networkidle');

// Verificar status na listagem ou detalhe
await expect(
  page.getByText(/em andamento|aguardando|aberto|pendente|resolvido/i)
).toBeVisible({ timeout: 10000 });
```

### Responder / Atualizar Chamado
```js
// Navegar para o chamado
await page.getByRole('link', { name: protocoloGerado }).first().click();
await page.waitForLoadState('domcontentloaded');

// Campo de resposta
const campoResposta = page.getByLabel(/resposta|comentário|mensagem/i)
  .or(page.getByRole('textbox', { name: /resposta|comentário/i }));
await campoResposta.fill('Comentário de acompanhamento gerado em teste.');

// Enviar resposta
await page.getByRole('button', { name: /responder|enviar|salvar/i }).click();
await expect(page.getByText(/comentário.*adicionado|resposta.*enviada/i)).toBeVisible({ timeout: 10000 });
```

### Encerrar / Fechar Chamado
```js
const btnEncerrar = page.getByRole('button', { name: /encerrar|fechar chamado|resolver/i });
if (await btnEncerrar.isVisible({ timeout: 5000 }).catch(() => false)) {
  await btnEncerrar.click();
  // Confirmar encerramento
  const btnConfirmar = page.getByRole('button', { name: /confirmar|sim/i });
  if (await btnConfirmar.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btnConfirmar.click();
  }
  await expect(page.getByText(/encerrado|fechado|resolvido/i)).toBeVisible({ timeout: 10000 });
}
```

## Dados de Teste para Atendimento

```js
const fakerBr = require('faker-br');
const path = require('path');

// Chamado
const chamado = {
  assunto: `Solicitação de teste - ${new Date().toLocaleDateString('pt-BR')}`,
  descricao: 'Descrição detalhada do chamado gerada em teste automatizado. ' +
             'Este é um registro de teste e pode ser desconsiderado.',
  categoria: 'Solicitação de Informação',
  prioridade: 'Normal',
};

// Solicitante
const solicitante = {
  nome: fakerBr.name.findName(),
  cpf: fakerBr.br.cpf().replace(/\D/g, ''),
  email: fakerBr.internet.email(),
  telefone: fakerBr.phone.phoneNumber().replace(/\D/g, ''),
};

// Documentos de anexo
const docs = {
  anexo: path.resolve(__dirname, '../../fixtures/documents/anexo.pdf'),
};
```

## Cobertura Mínima para Módulo de Atendimento

1. **Abrir chamado** — happy path completo, verificar protocolo gerado
2. **Consultar chamado** — buscar pelo protocolo, verificar status
3. **Atualizar chamado** — adicionar comentário, verificar no histórico
4. **Validação** — submeter sem assunto/descrição, verificar erro de campo obrigatório

## Checklist de Qualidade para Specs do Atendimento

- [ ] URL via `process.env.ATENDIMENTO_URL`
- [ ] `loginSSO` no início (ou verificar auth específica do sistema)
- [ ] Protocolo capturado e logado para rastreabilidade
- [ ] Encerramento de chamado tratado como fluxo opcional
- [ ] Screenshot do protocolo como evidência
- [ ] Timeout de `180000` (fluxos sem upload) ou `300000` (com anexo)
