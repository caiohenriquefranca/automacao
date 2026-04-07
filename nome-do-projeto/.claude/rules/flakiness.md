# Regra — Evitar e Tratar Testes Flaky

Testes flaky (que passam às vezes e falham outras sem mudança de código) são piores que testes ausentes — eles criam falsa sensação de segurança e esgotam a confiança na suite.

---

## Princípio: esperas semânticas, nunca por tempo fixo

**Errado** — frágil, depende do ambiente:
```js
await page.click('#enviar');
await page.waitForTimeout(3000); // "espera 3 segundos"
await expect(page.getByText('Sucesso')).toBeVisible();
```

**Certo** — aguarda a condição real:
```js
await page.click('#enviar');
await expect(page.getByText('Sucesso')).toBeVisible(); // espera até aparecer (padrão 30s)
```

---

## 1. Esperas de navegação

```js
// Após clicar em link/botão que navega
await page.getByRole('link', { name: 'Próxima Etapa' }).click();
await page.waitForURL('**/etapa-2**'); // aguarda a URL mudar

// Após submit de formulário
await page.getByRole('button', { name: 'Enviar' }).click();
await page.waitForURL('**/confirmacao**');
// ou
await expect(page).toHaveURL(/confirmacao/);
```

---

## 2. Esperas de resposta de API

```js
// Aguardar a API responder antes de verificar o resultado
const [resposta] = await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/salvar') && resp.ok()),
  page.getByRole('button', { name: 'Salvar' }).click(),
]);

// Verificar o resultado após a resposta
await expect(page.getByText('Salvo com sucesso')).toBeVisible();
```

---

## 3. Elementos com animação ou delay de UI

```js
// Para modais, tooltips e elementos com transição CSS
await expect(page.getByRole('dialog')).toBeVisible(); // aguarda automaticamente
await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });

// Para elementos que desaparecem (spinner, loading)
await expect(page.locator('.loading')).toBeHidden({ timeout: 15000 });
```

---

## 4. Campos com debounce (CEP, CNPJ, autocomplete)

```js
// CNPJ dispara busca após blur — aguardar preenchimento automático
await page.getByLabel('CNPJ').pressSequentially('00000000000191', { delay: 80 });
await page.keyboard.press('Tab');
// Aguardar preenchimento automático da razão social
await expect(page.getByLabel('Razão Social')).not.toHaveValue('', { timeout: 5000 });

// CEP — aguardar endereço ser preenchido
await page.getByLabel('CEP').pressSequentially('68902865', { delay: 80 });
await page.keyboard.press('Tab');
await expect(page.getByLabel('Logradouro')).not.toHaveValue('', { timeout: 5000 });
```

---

## 5. `waitForTimeout` — quando é aceitável

`waitForTimeout` só é aceito em casos com comportamento não-detectável por evento:

```js
// Aceitável: debounce de campo (sem evento observável)
await page.keyboard.press('Tab');
await page.waitForTimeout(1000); // debounce máximo aceito: 1500ms

// Aceitável: animação de transição sem evento
await page.waitForTimeout(500); // animação de 400ms + margem

// PROIBIDO: espera arbitrária sem motivo documentado
await page.waitForTimeout(3000); // ❌ sem comentário explicando por quê
```

**Regra:** se usar `waitForTimeout`, adicionar comentário obrigatório explicando o motivo.

---

## 6. Retries — quando e como configurar

```js
// playwright.config.js
retries: process.env.CI ? 2 : 0,
// CI: 2 tentativas antes de marcar como falha
// Local: 0 (falha imediata para feedback rápido)
```

**Retries não curam flakiness** — são uma rede de segurança para instabilidades de ambiente (rede, CI frio). Se um teste precisa de retry local para passar, diagnosticar a causa.

---

## 7. Elementos opcionais / condicionais

```js
// Verificar antes de interagir (nunca assumir que está visível)
const modal = page.getByRole('dialog', { name: 'Aviso' });
if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
  await modal.getByRole('button', { name: 'Fechar' }).click();
}

// Ou usar o helper existente
await fecharModaisIniciais(page); // src/support/auth.js
```

---

## 8. Paralelismo e isolamento de estado

```js
// Specs independentes — não compartilhar estado entre testes
test.describe('Fluxo de Cadastro', () => {
  // Cada test() deve ser independente
  // Usar beforeEach para garantir estado limpo
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await fecharModaisIniciais(page);
  });
});

// Nunca:
let empresaCriada; // variável entre testes — causa dependência
test('criar empresa', async ({ page }) => { empresaCriada = ...; });
test('editar empresa', async ({ page }) => { await editar(empresaCriada); }); // ❌
```

---

## 9. Checklist anti-flakiness

Antes de finalizar um spec, verificar:

- [ ] Nenhum `waitForTimeout` > 1500ms sem comentário
- [ ] Navegações aguardam `waitForURL` ou `expect().toHaveURL()`
- [ ] Submits aguardam resposta de API ou mudança de URL
- [ ] Campos com debounce têm espera após `Tab`/`blur`
- [ ] Elementos opcionais verificados com `.isVisible({ timeout: N }).catch(() => false)`
- [ ] Nenhuma dependência de ordem entre `test()` dentro do `describe`
- [ ] Screenshots/traces configurados para reter em falha (`retain-on-failure`)
