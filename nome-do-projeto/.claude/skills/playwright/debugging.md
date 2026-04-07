# Skill — Debugging de Testes Playwright

Use esta skill quando um teste estiver falhando e você precisar diagnosticar a causa raiz.

---

## 1. Playwright Inspector (step-by-step interativo)

```bash
# Abre o Inspector com pause em cada ação
npx playwright test src/tests/portal/meuTeste.spec.js --debug

# Equivalente: adicionar page.pause() no spec para pausar num ponto específico
await page.pause(); // pausar aqui → inspecionar no DevTools
```

**No Inspector:**
- Botão **Step Over** avança ação a ação
- Campo **Locator** permite testar seletores em tempo real
- Aba **Elements** mostra o DOM atual

---

## 2. Trace Viewer — análise pós-mortem

### Capturar trace durante a execução

```bash
# Grava trace e abre automaticamente após falha
npx playwright test src/tests/portal/meuTeste.spec.js --trace on

# Grava trace apenas nas falhas (mais leve)
npx playwright test --trace retain-on-failure
```

### Abrir trace de uma execução anterior

```bash
# O arquivo fica em test-results/<nome-do-teste>/trace.zip
npx playwright show-trace test-results/meuTeste-chromium/trace.zip
```

### O que o Trace Viewer mostra

- Timeline de cada ação com screenshot antes/depois
- Console logs e erros de rede
- Snapshots do DOM no momento exato da falha
- Tempo de cada ação

---

## 3. Screenshots automáticos em falha

Configurar no `playwright.config.js` (já deve estar ou adicionar):

```js
use: {
  screenshot: 'only-on-failure',  // captura ao falhar
  video: 'retain-on-failure',     // vídeo ao falhar (opcional)
  trace: 'retain-on-failure',     // trace ao falhar
}
```

Screenshot manual num ponto específico:

```js
await page.screenshot({ path: 'test-results/debug-ponto-critico.png', fullPage: true });
```

---

## 4. Modo headed — ver o browser em ação

```bash
# Ver o browser enquanto roda
npx playwright test src/tests/portal/meuTeste.spec.js --headed

# Ver + debug (para em cada ação)
npx playwright test src/tests/portal/meuTeste.spec.js --headed --debug
```

---

## 5. Ler mensagens de erro de locator

### Erro: `locator.click: Error: strict mode violation`

Significa que o seletor encontrou **mais de um elemento**.

```js
// Problema
await page.getByRole('button', { name: 'Enviar' }).click(); // 2 botões encontrados

// Solução: filtrar por contexto
await page.getByRole('form').getByRole('button', { name: 'Enviar' }).click();
// ou
await page.getByRole('button', { name: 'Enviar' }).first().click();
```

### Erro: `locator.click: Timeout 30000ms exceeded`

Elemento não encontrado ou não ficou visível.

```js
// Diagnóstico: verificar se o elemento existe no DOM
const el = page.getByLabel('Nome da Empresa');
console.log('visível:', await el.isVisible());
console.log('count:', await el.count());

// Verificar se está dentro de um iframe
// Ver skill: playwright/selectors-avancados.md
```

### Erro: `Error: locator.fill: Target closed`

A página foi fechada ou navegou antes de completar a ação.

```js
// Aguardar a navegação antes de interagir
await page.waitForURL('**/formulario**');
await page.getByLabel('Nome').fill('valor');
```

---

## 6. Logs de console e rede

```js
// Capturar todos os logs do browser
page.on('console', msg => console.log(`[browser] ${msg.type()}: ${msg.text()}`));

// Capturar erros de rede (requests com falha)
page.on('response', response => {
  if (!response.ok()) {
    console.log(`[rede] ${response.status()} ${response.url()}`);
  }
});

// Esperar por uma chamada de API específica
await page.waitForResponse(resp => resp.url().includes('/api/salvar') && resp.ok());
```

---

## 7. Executar spec com output verboso

```bash
# Ver todos os passos e timings
npx playwright test src/tests/portal/meuTeste.spec.js --reporter list

# Gerar relatório HTML completo
npx playwright test src/tests/portal/meuTeste.spec.js --reporter html
npx playwright show-report
```

---

## Checklist de diagnóstico rápido

Quando um teste falha, verificar nesta ordem:

1. **Ler a mensagem de erro completa** — geralmente aponta linha exata e tipo de problema
2. **Rodar com `--headed`** — ver visualmente o que acontece antes da falha
3. **Abrir trace** — examinar screenshot no momento exato da falha
4. **Testar o seletor no Inspector** — confirmar se o elemento existe e como selecioná-lo
5. **Verificar auth.json** — executar `/check-auth` para ver se a sessão expirou
6. **Verificar se mudou o DOM** — comparar seletores do spec com page-scout na página atual
