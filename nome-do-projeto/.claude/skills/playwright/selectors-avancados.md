# Skill — Seletores Avançados Playwright

Use quando os seletores básicos (`getByRole`, `getByLabel`) não alcançam o elemento desejado.

---

## 1. Hierarquia de seletores (do melhor para o pior)

```js
// 1. Semântico — melhor opção sempre
page.getByRole('button', { name: 'Enviar' })
page.getByLabel('Razão Social')
page.getByPlaceholder('Digite o CNPJ')
page.getByText('Protocolo gerado com sucesso')
page.getByAltText('Logo da empresa')

// 2. Atributo específico — boa opção quando disponível
page.locator('[data-testid="btn-enviar"]')
page.locator('[aria-label="Fechar modal"]')

// 3. XPath — útil para relações pai/filho
page.locator('//label[contains(.,"Razão Social")]/following-sibling::input')
page.locator('//td[contains(.,"Aprovado")]/preceding-sibling::td[1]')

// 4. CSS — último recurso (frágil, evitar)
page.locator('form.cadastro input[name="razao"]')
```

---

## 2. Elementos dinâmicos e esperas

### Aguardar elemento aparecer

```js
// Aguardar elemento ficar visível (com timeout customizado)
await page.locator('[role="alert"]').waitFor({ state: 'visible', timeout: 10000 });

// Aguardar elemento desaparecer (ex: spinner de loading)
await page.locator('.loading-spinner').waitFor({ state: 'hidden', timeout: 15000 });

// Aguardar elemento existir no DOM (mesmo que oculto)
await page.locator('#resultado').waitFor({ state: 'attached' });
```

### Filtrar locators dinamicamente

```js
// Filtrar por texto visível
const linhas = page.locator('tr').filter({ hasText: 'Empresa XYZ' });
await linhas.first().locator('button', { hasText: 'Editar' }).click();

// Filtrar por locator interno
const cards = page.locator('.card').filter({
  has: page.locator('.badge', { hasText: 'Pendente' })
});
await expect(cards).toHaveCount(3);
```

---

## 3. Elementos dentro de iframes

Portais gov.br às vezes embeds de terceiros (mapas, assinatura digital) vivem em iframe.

```js
// Localizar o iframe pelo src ou title
const frame = page.frameLocator('iframe[title="Assinatura Digital"]');

// Interagir com elementos dentro do iframe
await frame.getByRole('button', { name: 'Assinar' }).click();
await frame.getByLabel('PIN').fill('123456');

// Iframe aninhado (iframe dentro de iframe)
const innerFrame = page.frameLocator('#outer-frame').frameLocator('#inner-frame');
await innerFrame.getByLabel('Campo').fill('valor');
```

---

## 4. Shadow DOM

Componentes web modernos (Web Components) encapsulam o DOM em shadow root.

```js
// Playwright perfura shadow DOM automaticamente em muitos casos
// Se não funcionar, usar pierce:
page.locator('pierce/input[name="cpf"]')

// Ou acessar via host
page.locator('meu-componente').locator('input')
```

---

## 5. Strict mode — resolver "múltiplos elementos"

Quando o seletor retorna mais de 1 elemento, Playwright lança erro em strict mode.

```js
// Erro: strict mode violation (2 botões "Enviar" encontrados)

// Solução 1: usar o contexto do formulário
await page.locator('form#cadastro').getByRole('button', { name: 'Enviar' }).click();

// Solução 2: pegar o primeiro
await page.getByRole('button', { name: 'Enviar' }).first().click();

// Solução 3: pegar por índice
await page.getByRole('button', { name: 'Enviar' }).nth(1).click(); // segundo botão

// Solução 4: filtrar por visibilidade
await page.getByRole('button', { name: 'Enviar' }).filter({ visible: true }).click();

// Diagnóstico: quantos elementos foram encontrados?
const count = await page.getByRole('button', { name: 'Enviar' }).count();
console.log('encontrados:', count);
```

---

## 6. Elementos que aparecem com animação/delay

```js
// expect().toBeVisible() já espera com timeout padrão (30s)
await expect(page.getByText('Protocolo gerado')).toBeVisible();

// Para elementos que aparecem após ação assíncrona
await page.getByRole('button', { name: 'Gerar Protocolo' }).click();
await expect(page.locator('.protocolo-numero')).toBeVisible({ timeout: 15000 });

// Aguardar URL mudar (após redirect)
await page.waitForURL('**/confirmacao**');

// Aguardar resposta de API que desencadeia o elemento
await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/protocolo') && resp.ok()),
  page.getByRole('button', { name: 'Enviar' }).click(),
]);
```

---

## 7. Tabelas e listas — navegar por estrutura

```js
// Encontrar célula por texto e pegar a célula irmã
const linha = page.locator('tr').filter({ hasText: 'CNPJ 00.000.000/0001-00' });
await linha.getByRole('button', { name: 'Editar' }).click();

// Pegar valor de uma célula específica numa linha
const status = await page.locator('tr').filter({ hasText: 'Minha Empresa' })
  .locator('td').nth(3).textContent();

// Verificar que tabela tem N linhas (excluindo header)
await expect(page.locator('tbody tr')).toHaveCount(5);
```

---

## 8. Selects customizados (não-nativos)

Muitos sistemas gov.br usam selects baseados em `<div>` ou bibliotecas como Select2.

```js
// Select nativo HTML
await page.selectOption('select[name="estado"]', 'SP');
await page.getByLabel('Estado').selectOption({ label: 'São Paulo' });

// Select2 / Chosen (baseado em div)
await page.getByLabel('Município').click(); // abre o dropdown
await page.getByRole('option', { name: 'Belém' }).click(); // seleciona a opção

// Select com autocomplete (digitar para filtrar)
await page.getByLabel('Município').fill('Bel');
await page.waitForSelector('[role="listbox"]');
await page.getByRole('option', { name: 'Belém' }).click();
```

---

## 9. Checkboxes e radios

```js
// Checkbox por label
await page.getByLabel('Concordo com os termos').check();
await expect(page.getByLabel('Concordo com os termos')).toBeChecked();

// Radio button por valor
await page.locator('input[type="radio"][value="pessoa_juridica"]').check();

// Verificar estado
const marcado = await page.getByLabel('Ativo').isChecked();
```

---

## Referência rápida de locators

| Situação | Seletor recomendado |
|----------|---------------------|
| Botão com texto | `getByRole('button', { name: '...' })` |
| Campo com label | `getByLabel('...')` |
| Campo com placeholder | `getByPlaceholder('...')` |
| Mensagem de sucesso/erro | `getByText('...')` ou `getByRole('alert')` |
| Link | `getByRole('link', { name: '...' })` |
| Elemento dentro de iframe | `frameLocator('iframe').getBy...()` |
| Linha de tabela | `locator('tr').filter({ hasText: '...' })` |
| Múltiplos elementos iguais | `.first()` ou `.nth(N)` |
| Elemento após animação | `expect().toBeVisible({ timeout: 15000 })` |
