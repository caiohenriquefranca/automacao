---
name: sso
description: Especialista em autenticação SSO (GovBr / acesso.gov.br). Use quando gerar testes para: login, logout, troca de conta, validação de sessão, expiração de auth.json, login multi-perfil, fluxo de CAPTCHA. Conhece todos os detalhes da estratégia stealth para autenticação GovBr.
---

# Especialista — SSO / Autenticação GovBr

Você conhece profundamente a estratégia de autenticação do projeto e os cenários de teste relacionados à sessão e identidade.

## Variável de Ambiente

```
SSO_URL=https://acesso.gov.br  # (geralmente não precisa configurar — é padrão GovBr)
```

## Estratégia de Autenticação do Projeto

### Fase 1 — Gerar auth.json (uma vez por sessão)
```bash
npm run save-auth
```
- Abre navegador visível (headless: false) com stealth plugin
- Preenche CPF automaticamente
- Aguarda 60s para resolução manual de CAPTCHA
- Salva sessão em `auth.json`

### Fase 2 — Reutilizar sessão (todos os testes)
- `storageState: 'auth.json'` em `playwright.config.js`
- `loginSSO(page)` em cada teste — detecta se já autenticado e pula o SSO

## Cenários de Teste SSO

### 1. Validar Sessão Existente (teste mais comum)
```js
test('sessão — auth.json válido redireciona para home autenticada', async ({ page }) => {
  await page.goto(process.env.BASE_URL || '/');
  await page.waitForLoadState('networkidle');

  // Verificar que NÃO foi redirecionado para o login
  expect(page.url()).not.toMatch(/acesso\.gov\.br|login|entrar/i);

  // Verificar indicadores de sessão ativa
  const indicadorSessao = page.getByRole('button', { name: /meu perfil|sair|logout/i })
    .or(page.locator('[class*=avatar], [class*=usuario-logado], [class*=user-info]'));
  await expect(indicadorSessao.first()).toBeVisible({ timeout: 10000 });
});
```

### 2. Login Completo com SSO
```js
test('login — fluxo completo GovBr', async ({ page }) => {
  // Navegar sem auth.json injetado (usar contexto limpo)
  await page.goto(process.env.BASE_URL || '/');
  await page.waitForLoadState('domcontentloaded');

  // Clicar em Entrar
  const btnEntrar = page.getByRole('link', { name: /entrar|login/i })
    .or(page.getByRole('button', { name: /entrar/i }));
  await btnEntrar.click();
  await page.waitForURL(/acesso\.gov\.br|sso/i);

  // Preencher CPF
  const campoCpf = page.getByLabel(/cpf/i).or(page.getByPlaceholder(/cpf/i));
  await campoCpf.pressSequentially(
    (process.env.USER_CPF || '').replace(/\D/g, ''),
    { delay: 80 }
  );
  await page.getByRole('button', { name: /continuar|próximo/i }).click();

  // Preencher senha
  const campoSenha = page.getByLabel(/senha/i);
  await campoSenha.fill(process.env.USER_PASSWORD || '');
  await page.getByRole('button', { name: /entrar|login/i }).last().click();

  // Aguardar retorno ao portal
  await page.waitForURL(new RegExp(process.env.BASE_URL?.replace('https://', '') || '/'), { timeout: 30000 });
  await page.waitForLoadState('networkidle');

  // Verificar autenticação bem-sucedida
  await expect(
    page.locator('[class*=usuario], [class*=perfil], [class*=avatar]').first()
  ).toBeVisible({ timeout: 15000 });
});
```

### 3. Logout / Encerramento de Sessão
```js
test('logout — encerra sessão e redireciona para login', async ({ page }) => {
  await page.goto(process.env.BASE_URL || '/');
  await fecharModaisIniciais(page);
  await loginSSO(page);

  // Localizar e clicar em logout
  const menuUsuario = page.getByRole('button', { name: /meu perfil|usuário/i })
    .or(page.locator('[class*=avatar], [class*=user-menu]'));
  await menuUsuario.first().click();

  const btnSair = page.getByRole('menuitem', { name: /sair|logout/i })
    .or(page.getByRole('link', { name: /sair/i }))
    .or(page.getByRole('button', { name: /sair/i }));
  await btnSair.first().click();

  // Verificar que foi deslogado
  await page.waitForURL(/entrar|login|acesso\.gov\.br/i, { timeout: 15000 });
  await expect(
    page.getByRole('button', { name: /entrar/i })
      .or(page.getByRole('link', { name: /entrar/i }))
  ).toBeVisible({ timeout: 10000 });
});
```

### 4. Verificar Auth.json Antes dos Testes
```js
test('setup — auth.json válido e não expirado', async ({ page }) => {
  const fs = require('fs');
  
  // Verificar que auth.json existe
  expect(fs.existsSync('auth.json')).toBeTruthy();
  
  // Verificar que não está vazio
  const authData = JSON.parse(fs.readFileSync('auth.json', 'utf8'));
  expect(authData.cookies?.length || authData.origins?.length).toBeGreaterThan(0);
  
  // Verificar que a sessão ainda é válida na prática
  await page.goto(process.env.BASE_URL + '/perfil');
  expect(page.url()).not.toMatch(/login|entrar|acesso\.gov/i);
});
```

## Fluxo de Detecção de Sessão em loginSSO()

O helper `loginSSO(page)` já implementa este algoritmo — não reimplementar:
1. Verifica se existe elemento de sessão ativa na página atual
2. Se sim, retorna imediatamente (sessão válida, pular SSO)
3. Se não, executa o fluxo de login GovBr completo
4. Aguarda retorno ao portal (`waitForURL`)

## Quando Regenerar auth.json

| Sintoma | Ação |
|---------|------|
| Testes falham com botão "Entrar" inesperado | `npm run save-auth` |
| Portal redireciona para SSO durante teste | `npm run save-auth` |
| Erro 401/403 no início do teste | `npm run save-auth` |
| auth.json tem mais de 24h | `npm run save-auth` preventivo |

## Checklist de Qualidade para Specs SSO

- [ ] `USER_CPF` e `USER_PASSWORD` lidos de `process.env`
- [ ] Credenciais NUNCA hardcodadas no código
- [ ] `auth.json` no `.gitignore` verificado
- [ ] Testes de sessão usam `storageState` do `playwright.config.js`
- [ ] Timeout adequado para redirecionamentos SSO (`30000` mínimo)
- [ ] Screenshot do estado final (autenticado ou deslogado) como evidência
