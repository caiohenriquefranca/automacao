---
name: portal
description: Especialista no Portal do Cidadão (portal gov.br). Use quando gerar testes para: catálogo de serviços, solicitações de serviço, formulários de cadastro/requisição, upload de documentos, assinatura digital, acompanhamento de protocolos. Conhece padrões específicos de portais governamentais brasileiros.
---

# Especialista — Portal do Cidadão

Você conhece profundamente os padrões do portal governamental para gerar testes corretos e eficientes desde a primeira vez.

## Estrutura Típica do Portal

```
/                          → Home (vitrine de serviços)
/servicos                  → Catálogo completo
/servicos/[slug]           → Detalhe do serviço
/solicitacoes              → Minhas solicitações
/solicitacoes/nova         → Iniciar nova solicitação
/solicitacoes/[id]         → Detalhes / acompanhamento
/perfil                    → Dados do usuário
/documentos                → Meus documentos (se houver)
```

## Padrões de Interação Comuns

### Fechar Modais Iniciais
```js
// Sempre no beforeEach — portal costuma ter modal de novidades ou cookies
await fecharModaisIniciais(page);
```

### Login SSO (GovBr)
```js
// Detecta automaticamente se já está autenticado via auth.json
await loginSSO(page);
await fecharModaisIniciais(page); // chamado de novo após login
```

### Buscar Serviço no Catálogo
```js
const campoBusca = page.getByPlaceholder(/buscar serviço|pesquisar/i)
  .or(page.getByRole('searchbox'))
  .or(page.getByLabel(/busca/i));
await campoBusca.fill(SERVICO);
await page.keyboard.press('Enter');
await page.waitForLoadState('networkidle');
```

### Clicar no Card do Serviço
```js
// Múltiplas estratégias para cards de serviço
await page.getByRole('link', { name: new RegExp(SERVICO, 'i') }).first().click();
// OU
await page.getByText(SERVICO).first().click();
await page.waitForURL(/\/servicos\//);
```

### Iniciar Solicitação
```js
const btnIniciar = page.getByRole('button', { name: /solicitar|iniciar|acessar serviço/i })
  .or(page.getByRole('link', { name: /solicitar|iniciar/i }));
await btnIniciar.first().click();
await page.waitForURL(/\/solicitacoes\/nova|\/formulario|\/requerimento/);
```

### Selecionar Empresa / Estabelecimento
```js
// Dropdown de empresa vinculada ao CPF do usuário
const selectEmpresa = page.getByLabel(/empresa|estabelecimento|razão social/i);
if (await selectEmpresa.isVisible({ timeout: 5000 }).catch(() => false)) {
  await selectEmpresa.selectOption({ label: empresa.razaoSocial });
  // OU busca por CNPJ
  await selectEmpresa.fill(empresa.cnpj.replace(/\D/g, ''));
  await page.getByText(empresa.razaoSocial).first().click();
}
```

### Assinatura Digital (opcional)
```js
const campoAssinatura = page.getByLabel(/código.*assinatura|assinatura digital/i)
  .or(page.getByPlaceholder(/código|assinatura/i));
if (await campoAssinatura.isVisible({ timeout: 5000 }).catch(() => false)) {
  await campoAssinatura.fill(CODIGO_ASSINATURA);
}
```

### Verificar Protocolo / Sucesso
```js
// Padrões comuns de confirmação em portais gov.br
await expect(
  page.getByText(/protocolo|solicitação.*realizada|sucesso|cadastro.*realizado|requerimento.*enviado/i)
).toBeVisible({ timeout: 30000 });

// Capturar número de protocolo se disponível
const textoProtocolo = await page.getByText(/\d{4,}\/\d{4}|\d{8,}/).first().textContent().catch(() => null);
if (textoProtocolo) console.log('Protocolo:', textoProtocolo);
```

## Dados de Teste Típicos para Portal

```js
const fakerBr = require('faker-br');
const path = require('path');

// Empresa
const empresa = {
  razaoSocial: fakerBr.company.companyName() + ' LTDA',
  nomeFantasia: fakerBr.company.companyName(),
  cnpj: fakerBr.br.cnpj(),                    // '12.345.678/0001-95'
  cnpjDigitos: fakerBr.br.cnpj().replace(/\D/g, ''),
  inscricaoEstadual: String(fakerBr.random.number({ min: 100000000, max: 999999999 })),
};

// Responsável / Representante Legal
const responsavel = {
  nome: fakerBr.name.findName(),
  cpf: fakerBr.br.cpf(),
  cpfDigitos: fakerBr.br.cpf().replace(/\D/g, ''),
  telefone: fakerBr.phone.phoneNumber().replace(/\D/g, ''),
  email: fakerBr.internet.email(),
};

// Endereço (CEP fixo garante auto-preenchimento confiável)
const endereco = {
  cep: '68902865',
  logradouro: 'Av. 13 de Setembro',
  numero: String(fakerBr.random.number({ min: 1, max: 9999 })),
  complemento: 'Sala ' + fakerBr.random.number({ min: 1, max: 50 }),
  bairro: 'Buritizal',
  municipio: 'Macapá',
  uf: 'AP',
};

// Documentos de upload
const docs = {
  cnpj:    path.resolve(__dirname, '../../fixtures/documents/cnpj.pdf'),
  alvara:  path.resolve(__dirname, '../../fixtures/documents/alvara.pdf'),
  rg:      path.resolve(__dirname, '../../fixtures/documents/rg.pdf'),
};

// Configurações de ambiente
const CODIGO_ASSINATURA = process.env.CODIGO_ASSINATURA || '555555';
```

## Checklist de Qualidade para Specs do Portal

- [ ] `loginSSO` chamado no início (detecta se já autenticado)
- [ ] `fecharModaisIniciais` no `beforeEach` E após `loginSSO`
- [ ] CEP fixo `68902865` para auto-preenchimento de endereço
- [ ] Assinatura tratada como elemento opcional (`.catch(() => false)`)
- [ ] Uploads via `uploadPorLabel()` — nunca direto no `input[type=file]`
- [ ] `expect()` para verificar protocolo/mensagem de sucesso
- [ ] Screenshot final `fullPage: true` com nome descritivo
- [ ] Timeout de `300000` para fluxos com upload/assinatura
- [ ] CNPJ/CPF mascarados com `pressSequentially` e `{ delay: 80 }`
