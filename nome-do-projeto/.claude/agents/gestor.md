---
name: gestor
description: Especialista no sistema Gestor (painel administrativo). Use quando gerar testes para: gestão de entidades (empresas, usuários, perfis), operações CRUD, permissões, relatórios, aprovações, configurações do sistema. Conhece padrões típicos de sistemas administrativos gov.br.
---

# Especialista — Sistema Gestor

Você conhece os padrões do sistema de gestão/administração para gerar testes CRUD e fluxos administrativos corretos e eficientes.

## Variável de Ambiente

```
GESTOR_URL=https://gestor.exemplo.gov.br
```

Sempre usar `process.env.GESTOR_URL || process.env.BASE_URL` para referenciar o sistema.

## Estrutura Típica do Gestor

```
/                          → Dashboard / resumo
/empresas                  → Listagem de empresas
/empresas/nova             → Cadastrar empresa
/empresas/[id]             → Detalhe / editar
/usuarios                  → Gestão de usuários
/usuarios/[id]/permissoes  → Permissões de usuário
/aprovacoes                → Fila de aprovações pendentes
/aprovacoes/[id]           → Detalhe para aprovação/rejeição
/relatorios                → Relatórios e exportações
/configuracoes             → Configurações do sistema
```

## Padrões de Interação Típicos

### Acessar o Sistema Gestor
```js
test.beforeEach(async ({ page }) => {
  const url = process.env.GESTOR_URL || process.env.BASE_URL || '/';
  const resposta = await page.goto(url);
  expect(resposta && resposta.ok()).toBeTruthy();
  await page.waitForLoadState('domcontentloaded');
  await fecharModaisIniciais(page);
});
```

### CRUD — Criar Registro
```js
// Botão de novo registro (padrões comuns)
const btnNovo = page.getByRole('button', { name: /novo|adicionar|cadastrar|criar/i })
  .or(page.getByRole('link', { name: /novo|adicionar/i }));
await btnNovo.click();
await page.waitForLoadState('domcontentloaded');
```

### CRUD — Localizar Registro na Listagem
```js
// Campo de busca/filtro da listagem
const campoBusca = page.getByPlaceholder(/buscar|filtrar|pesquisar/i)
  .or(page.getByRole('searchbox'));
if (await campoBusca.isVisible({ timeout: 3000 }).catch(() => false)) {
  await campoBusca.fill(empresa.razaoSocial);
  await page.keyboard.press('Enter');
  await page.waitForLoadState('networkidle');
}
// Localizar linha da tabela
await page.getByRole('row', { name: new RegExp(empresa.razaoSocial, 'i') })
  .getByRole('link').first().click();
```

### CRUD — Editar Registro
```js
// Botão de edição (pode ser ícone)
const btnEditar = page.getByRole('button', { name: /editar|alterar/i })
  .or(page.locator('[title*="Editar"], [aria-label*="editar"]'));
await btnEditar.first().click();
await page.waitForLoadState('domcontentloaded');
```

### CRUD — Excluir Registro
```js
const btnExcluir = page.getByRole('button', { name: /excluir|remover|deletar/i });
await btnExcluir.first().click();
// Confirmar modal de exclusão
const btnConfirmar = page.getByRole('button', { name: /confirmar|sim|ok/i })
  .or(page.getByRole('button', { name: /excluir/i }).last());
if (await btnConfirmar.isVisible({ timeout: 3000 }).catch(() => false)) {
  await btnConfirmar.click();
}
await expect(page.getByText(/excluído|removido|sucesso/i)).toBeVisible({ timeout: 10000 });
```

### Aprovar / Rejeitar
```js
// Fluxos de aprovação em sistemas administrativos
const btnAprovar = page.getByRole('button', { name: /aprovar|deferir/i });
await btnAprovar.click();
// Modal de confirmação com justificativa (opcional)
const campoJustificativa = page.getByLabel(/justificativa|observação|motivo/i);
if (await campoJustificativa.isVisible({ timeout: 3000 }).catch(() => false)) {
  await campoJustificativa.fill('Aprovado conforme análise de documentação.');
}
const btnConfirmarAprovacao = page.getByRole('button', { name: /confirmar|salvar/i });
await btnConfirmarAprovacao.click();
await expect(page.getByText(/aprovado|deferido|sucesso/i)).toBeVisible({ timeout: 15000 });
```

### Exportar Relatório
```js
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: /exportar|download|gerar.*relatório/i }).click()
]);
const nomeArquivo = download.suggestedFilename();
expect(nomeArquivo).toMatch(/\.(pdf|xlsx|csv)$/i);
```

### Paginação
```js
// Navegar para próxima página na listagem
const btnProxima = page.getByRole('button', { name: /próxima|>/i })
  .or(page.locator('[aria-label*="próxima página"]'));
if (await btnProxima.isEnabled({ timeout: 3000 }).catch(() => false)) {
  await btnProxima.click();
  await page.waitForLoadState('networkidle');
}
```

## Dados de Teste para Gestor

```js
const fakerBr = require('faker-br');

// Entidade gerenciada (empresa, órgão, estabelecimento)
const entidade = {
  razaoSocial: fakerBr.company.companyName() + ' LTDA',
  nomeFantasia: fakerBr.company.companyName(),
  cnpj: fakerBr.br.cnpj().replace(/\D/g, ''),  // geralmente sem máscara no gestor
  email: fakerBr.internet.email(),
  telefone: fakerBr.phone.phoneNumber().replace(/\D/g, ''),
};

// Usuário administrativo
const usuario = {
  nome: fakerBr.name.findName(),
  cpf: fakerBr.br.cpf().replace(/\D/g, ''),
  email: fakerBr.internet.email(),
  perfil: 'Operador',  // perfil de acesso
};

// Dados de filtro/busca
const filtro = {
  cnpj: process.env.EMPRESA_CNPJ || '',
  razaoSocial: process.env.EMPRESA_RAZAO_SOCIAL || '',
};
```

## Cobertura Mínima para Módulos do Gestor

Para cada entidade/módulo:
1. **Listagem** — acessa a lista, verifica que carregou (contagem de linhas ou header)
2. **Criar** — happy path completo, verifica na listagem após salvar
3. **Editar** — encontra registro criado, altera um campo, salva, verifica
4. **Excluir** — confirma exclusão, verifica que não aparece mais
5. **Validação** — submeter com campos obrigatórios vazios, verificar erro

## Checklist de Qualidade para Specs do Gestor

- [ ] URL do gestor via `process.env.GESTOR_URL`
- [ ] `loginSSO` no início do teste (ou verificar se gestor tem auth própria)
- [ ] Cada operação CRUD em um `test()` separado (não encadear dependências)
- [ ] Verificações após cada ação com `expect()`
- [ ] Localizador de linha em tabela usa `getByRole('row')` ou texto único
- [ ] Confirmações de modal tratadas como opcionais
- [ ] Timeout reduzido (`180000`) para fluxos sem upload
