# Skill — Downloads de Arquivos com Playwright

Use quando o teste precisa baixar um arquivo (PDF de protocolo, relatório, comprovante) e verificar que foi gerado corretamente.

---

## 1. Padrão básico — aguardar download

```js
// Disparar o download e capturar o objeto Download simultaneamente
const [download] = await Promise.all([
  page.waitForEvent('download'),         // aguarda o evento de download
  page.getByRole('button', { name: 'Baixar PDF' }).click(), // dispara o download
]);

// Aguardar o download completar e obter o caminho temporário
const caminhoTemp = await download.path();
console.log('arquivo baixado em:', caminhoTemp);

// Verificar nome do arquivo sugerido pelo servidor
const nomeArquivo = download.suggestedFilename();
console.log('nome do arquivo:', nomeArquivo); // ex: "protocolo-12345.pdf"
```

---

## 2. Salvar arquivo numa localização específica

```js
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('link', { name: 'Exportar Relatório' }).click(),
]);

// Salvar no diretório de resultados de teste
await download.saveAs(`test-results/relatorio-${Date.now()}.pdf`);
```

---

## 3. Verificar o arquivo baixado

```js
const fs = require('fs');
const path = require('path');

const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Gerar Comprovante' }).click(),
]);

// Salvar localmente
const destino = `test-results/comprovante.pdf`;
await download.saveAs(destino);

// Verificações básicas
expect(fs.existsSync(destino)).toBe(true);

const stats = fs.statSync(destino);
expect(stats.size).toBeGreaterThan(0); // arquivo não está vazio

// Verificar extensão pelo nome sugerido
const nome = download.suggestedFilename();
expect(nome).toMatch(/\.pdf$/i);
expect(nome).toContain('comprovante'); // ou número de protocolo
```

---

## 4. Download com timeout customizado

```js
// Relatórios pesados podem demorar para gerar
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 60000 }), // 60s para geração do relatório
  page.getByRole('button', { name: 'Gerar Relatório Mensal' }).click(),
]);
```

---

## 5. Verificar URL de download (sem baixar)

Quando só precisamos confirmar que o link de download existe:

```js
// Interceptar a request de download sem baixar
const respostaPromise = page.waitForResponse(
  resp => resp.url().includes('/download') && resp.ok()
);
await page.getByRole('link', { name: 'Baixar' }).click();
const resposta = await respostaPromise;

expect(resposta.headers()['content-type']).toContain('application/pdf');
expect(resposta.status()).toBe(200);
```

---

## 6. Múltiplos downloads sequenciais

```js
// Baixar vários documentos de uma lista
const linhas = page.locator('tbody tr');
const count = await linhas.count();

for (let i = 0; i < count; i++) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    linhas.nth(i).getByRole('button', { name: 'PDF' }).click(),
  ]);
  await download.saveAs(`test-results/doc-${i + 1}.pdf`);
}
```

---

## 7. Download que abre em nova aba

Alguns sistemas abrem o PDF em nova aba antes de baixar.

```js
// Aguardar a nova página e capturar a URL do PDF
const novaAbaPromise = page.context().waitForEvent('page');
await page.getByRole('link', { name: 'Ver Protocolo' }).click();
const novaAba = await novaAbaPromise;

await novaAba.waitForLoadState();
const url = novaAba.url();
expect(url).toContain('.pdf');

await novaAba.close(); // fechar a aba após verificar
```

---

## Padrão no contexto deste projeto

Nos sistemas gestor e atendimento, downloads típicos são:
- **Protocolo de solicitação** — após enviar formulário no portal
- **Relatório de atendimentos** — exportação do painel gestor
- **Comprovante de ticket** — atendimento/helpdesk

```js
// Exemplo: baixar protocolo após envio de formulário no portal
test('deve gerar protocolo PDF após envio', async ({ page }) => {
  await loginSSO(page);
  // ... preencher e enviar formulário ...
  
  await expect(page.getByText('Solicitação enviada com sucesso')).toBeVisible();
  
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Baixar Protocolo' }).click(),
  ]);
  
  const nome = download.suggestedFilename();
  expect(nome).toMatch(/protocolo.*\.pdf$/i);
  
  await download.saveAs(`test-results/protocolo-${Date.now()}.pdf`);
});
```
