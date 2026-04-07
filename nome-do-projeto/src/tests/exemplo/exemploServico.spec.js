// src/tests/exemplo/exemploServico.spec.js
// TEMPLATE — copie e adapte para cada novo serviço
//
// Substitua:
//   NOME_DO_SERVICO → nome real do serviço
//   NOME_DO_MODULO  → módulo/categoria (ex: servicos, ouvidoria, agendamentos)
//   Os dados de teste, seletores e passos conforme o serviço

const { test, expect } = require('@playwright/test');
const path = require('path');
const fakerBr = require('faker-br');
const { fecharModaisIniciais, loginSSO } = require('../../support/auth');
const { preencherCampoTexto, preencherCampoArea, uploadPorLabel, selecionarOpcao } = require('../../support/form');

test.setTimeout(300000);

// ─── Configuração ────────────────────────────────────────────────────────────

const SERVICO = 'Exemplo de Serviço';
const CODIGO_ASSINATURA = process.env.CODIGO_ASSINATURA || '555555';

// ─── Dados de Teste (gerados 1x por run) ─────────────────────────────────────

const empresa = {
  razaoSocial: fakerBr.company.companyName() + ' LTDA',
  cnpj: fakerBr.br.cnpj(),
  nomeFantasia: fakerBr.company.companyName(),
};

const responsavel = {
  nome: fakerBr.name.findName(),
  cpf: fakerBr.br.cpf(),
  rg: String(fakerBr.random.number({ min: 1000000, max: 9999999 })),
  celular: `(96) 9${fakerBr.random.number({ min: 1000, max: 9999 })}-${fakerBr.random.number({ min: 1000, max: 9999 })}`,
  email: fakerBr.internet.email(),
};

const endereco = {
  cep: '68902865',             // CEP válido — auto-preenchimento funciona
  numero: String(fakerBr.random.number({ min: 1, max: 9999 })),
  complemento: 'Sala 1',
};

// ─── Fixtures de Documentos ───────────────────────────────────────────────────

const docs = {
  cnpj: path.resolve(__dirname, '../../fixtures/documents/cnpj.pdf'),
  representante: path.resolve(__dirname, '../../fixtures/documents/representante-legal.pdf'),
};

// ─── Testes ───────────────────────────────────────────────────────────────────

test.describe(`${SERVICO} — Módulo Exemplo`, () => {

  test.beforeEach(async ({ page }) => {
    const resposta = await page.goto('/');
    expect(resposta && resposta.ok()).toBeTruthy();
    await expect(page).toHaveTitle(/Portal/i);
    await page.waitForTimeout(2000);
    await fecharModaisIniciais(page);
  });

  test('fluxo completo — cadastro e envio', async ({ page }) => {
    // 1. Login (pula SSO se sessão já ativa via auth.json)
    await loginSSO(page);
    await fecharModaisIniciais(page);

    // 2. Navegar até o serviço
    // Exemplo: buscar pelo nome do serviço
    const campoBusca = page.getByRole('searchbox').or(page.getByPlaceholder(/[Bb]uscar|[Pp]esquisar/));
    if (await campoBusca.isVisible({ timeout: 3000 }).catch(() => false)) {
      await campoBusca.fill(SERVICO);
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
    }

    // Clicar no card/link do serviço
    const cardServico = page.getByRole('link', { name: new RegExp(SERVICO, 'i') })
      .or(page.getByText(SERVICO));
    await cardServico.first().click();
    await page.waitForLoadState('domcontentloaded');

    // 3. Iniciar solicitação
    const btnSolicitar = page.getByRole('button', { name: /[Ss]olicitar|[Ii]niciar/ });
    await expect(btnSolicitar).toBeVisible({ timeout: 10000 });
    await btnSolicitar.click();
    await page.waitForLoadState('domcontentloaded');

    // 4. Preencher formulário
    // Dados da empresa
    await preencherCampoTexto(page, 'CNPJ', empresa.cnpj.replace(/\D/g, ''));
    await preencherCampoTexto(page, 'Razão Social', empresa.razaoSocial);
    await preencherCampoTexto(page, 'Nome Fantasia', empresa.nomeFantasia);

    // Endereço (CEP auto-preenche)
    await preencherCampoTexto(page, 'CEP', endereco.cep);
    await page.waitForTimeout(1500); // debounce do CEP
    await preencherCampoTexto(page, 'Número', endereco.numero);
    await preencherCampoTexto(page, 'Complemento', endereco.complemento);

    // Responsável
    await preencherCampoTexto(page, 'Nome do Responsável', responsavel.nome);
    await preencherCampoTexto(page, 'CPF', responsavel.cpf.replace(/\D/g, ''));
    await preencherCampoTexto(page, 'E-mail', responsavel.email);
    await preencherCampoTexto(page, 'Celular', responsavel.celular.replace(/\D/g, ''));

    // Upload de documentos
    await uploadPorLabel(page, 'Documento CNPJ', docs.cnpj);
    await uploadPorLabel(page, 'Representante Legal', docs.representante);

    // Screenshot do formulário preenchido
    await page.screenshot({ path: `test-results/${SERVICO.replace(/\s+/g, '-')}-formulario.png`, fullPage: true });

    // 5. Enviar
    const btnEnviar = page.getByRole('button', { name: /[Ee]nviar|[Ss]alvar|[Pp]róximo/ });
    await btnEnviar.click();

    // 6. Assinatura eletrônica (se necessário)
    const campoAssinatura = page.getByLabel(/[Aa]ssinatura|[Cc]ódigo/);
    if (await campoAssinatura.isVisible({ timeout: 5000 }).catch(() => false)) {
      await campoAssinatura.fill(CODIGO_ASSINATURA);
      await page.getByRole('button', { name: /[Cc]onfirmar|[Aa]ssinar/ }).click();
    }

    // 7. Verificar sucesso
    await expect(
      page.getByText(/[Ss]ucesso|[Pp]rotocolo|[Ss]olicitação.*realizada/i)
    ).toBeVisible({ timeout: 30000 });

    // Screenshot de evidência
    await page.screenshot({
      path: `test-results/${SERVICO.replace(/\s+/g, '-')}-sucesso.png`,
      fullPage: true,
    });
  });

});
