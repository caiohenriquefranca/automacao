# Skill — Múltiplas Abas e Janelas com Playwright

Use quando o fluxo abre uma nova aba/janela (links com `target="_blank"`, popups de assinatura, visualização de PDF em nova aba).

---

## 1. Aguardar nova aba abrir

```js
// Disparar a ação e aguardar a nova aba simultaneamente
const novaAbaPromise = page.context().waitForEvent('page');
await page.getByRole('link', { name: 'Ver Protocolo' }).click();
const novaAba = await novaAbaPromise;

// Aguardar a nova aba carregar completamente
await novaAba.waitForLoadState('domcontentloaded');

// Agora interagir com a nova aba normalmente
console.log('URL da nova aba:', novaAba.url());
await expect(novaAba.getByRole('heading', { name: 'Protocolo' })).toBeVisible();

// Fechar a nova aba quando terminar
await novaAba.close();
```

---

## 2. Nova aba com autenticação compartilhada

Como o projeto usa `storageState` (auth.json), a sessão já é compartilhada entre abas do mesmo contexto.

```js
// Não precisa fazer login na nova aba — a sessão vem do contexto
const novaAbaPromise = page.context().waitForEvent('page');
await page.getByRole('link', { name: 'Abrir no Gestor' }).click();
const novaAba = await novaAbaPromise;

await novaAba.waitForLoadState();
// Se redirecionar para login, auth.json está expirado — executar save-auth
await expect(novaAba.getByRole('heading')).toBeVisible();
```

---

## 3. Popup de confirmação ou modal em janela separada

```js
// Alguns sistemas abrem janelas popup (window.open)
const popupPromise = page.waitForEvent('popup');
await page.getByRole('button', { name: 'Assinar Digitalmente' }).click();
const popup = await popupPromise;

await popup.waitForLoadState();
await popup.getByLabel('PIN').fill('123456');
await popup.getByRole('button', { name: 'Confirmar' }).click();

// Aguardar popup fechar
await popup.waitForEvent('close');

// Verificar que a aba original foi atualizada
await expect(page.getByText('Assinatura confirmada')).toBeVisible();
```

---

## 4. Trabalhar com múltiplas abas abertas

```js
// Obter todas as páginas abertas no contexto
const todasPaginas = page.context().pages();
console.log('abas abertas:', todasPaginas.length);

// Encontrar a aba pelo título ou URL
const abaGestor = todasPaginas.find(p => p.url().includes('gestor'));
await abaGestor.bringToFront(); // focar na aba

// Fechar todas as abas exceto a principal
for (const aba of todasPaginas) {
  if (aba !== page) {
    await aba.close();
  }
}
```

---

## 5. Link que abre PDF em nova aba

```js
// Verificar URL do PDF sem precisar abrir leitor
const novaAbaPromise = page.context().waitForEvent('page');
await page.getByRole('link', { name: 'Visualizar PDF' }).click();
const abaPDF = await novaAbaPromise;

await abaDF.waitForLoadState();
const url = abaDF.url();

// Verificar que é um PDF válido
expect(url).toMatch(/\.(pdf)$/i);
// ou verificar que o servidor retornou PDF
const resposta = await abaDF.waitForResponse(r => r.url() === url);
expect(resposta.headers()['content-type']).toContain('pdf');

await abaDF.close();
```

---

## 6. Nova aba que demora para carregar

```js
const novaAbaPromise = page.context().waitForEvent('page');
await page.getByRole('button', { name: 'Abrir Relatório' }).click();
const novaAba = await novaAbaPromise;

// Aguardar até a rede ficar ociosa (todos os recursos carregados)
await novaAba.waitForLoadState('networkidle', { timeout: 30000 });

// Alternativa: aguardar elemento específico
await novaAba.getByRole('table').waitFor({ timeout: 20000 });
```

---

## 7. Fechar modal que se comporta como popup

Alguns sistemas usam janelas modais que parecem popups mas são `<dialog>` ou elementos DOM.

```js
// Verificar se é modal no DOM (não nova aba)
const modal = page.locator('[role="dialog"]');
if (await modal.isVisible()) {
  // É um modal DOM — interagir normalmente
  await modal.getByRole('button', { name: 'Fechar' }).click();
} else {
  // Pode ser popup — usar waitForEvent('popup')
}
```

---

## Padrão no contexto deste projeto

Portal e gestor frequentemente abrem novas abas para:
- Protocolo/comprovante em PDF
- Sistema externo (ex: assinatura digital ICP-Brasil)
- Relatório em nova janela

```js
// Template para fluxo com nova aba
test('fluxo com abertura de nova aba', async ({ page }) => {
  await loginSSO(page);
  await page.goto('/servicos/meu-servico');
  await fecharModaisIniciais(page);
  
  // ... preencher formulário ...
  
  // Clicar em botão que abre nova aba
  const novaAbaPromise = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Visualizar Resultado' }).click();
  const novaAba = await novaAbaPromise;
  
  await novaAba.waitForLoadState('domcontentloaded');
  
  // Verificações na nova aba
  await expect(novaAba.getByText('Protocolo')).toBeVisible();
  
  await novaAba.close();
  
  // Continuar na aba original
  await expect(page.getByText('Concluído')).toBeVisible();
});
```
