# Skill — Campos com Máscara em Formulários Gov.br

Campos com máscara rejeitam `fill()` direto — precisam de `pressSequentially` com delay.
Esta skill cobre os padrões de campos mascarados mais comuns em sistemas gov.br.

---

## Por que `fill()` falha em campos mascarados?

`fill()` apaga o conteúdo e insere o valor de uma vez, sem acionar os event listeners da máscara.
`pressSequentially()` simula tecla a tecla, ativando cada evento de input.

---

## 1. CPF — 000.000.000-00

```js
// Forma correta: limpar máscara e digitar apenas números
const cpfLimpo = cpf.replace(/\D/g, ''); // '12345678901'
await page.getByLabel('CPF').pressSequentially(cpfLimpo, { delay: 80 });

// Verificar que a máscara foi aplicada
await expect(page.getByLabel('CPF')).toHaveValue('123.456.789-01');
```

---

## 2. CNPJ — 00.000.000/0000-00

```js
const cnpjLimpo = cnpj.replace(/\D/g, ''); // '00000000000191'
await page.getByLabel('CNPJ').pressSequentially(cnpjLimpo, { delay: 80 });

// Se o campo disparar busca automática de dados da empresa:
await page.getByLabel('CNPJ').pressSequentially(cnpjLimpo, { delay: 80 });
await page.keyboard.press('Tab'); // sair do campo para disparar o evento blur
await page.waitForTimeout(2000); // aguardar preenchimento automático (razão social, etc.)
```

---

## 3. CEP — 00000-000

```js
const cepLimpo = cep.replace(/\D/g, ''); // '68902865'
await page.getByLabel('CEP').pressSequentially(cepLimpo, { delay: 80 });

// CEP dispara busca automática de endereço — aguardar debounce
await page.keyboard.press('Tab'); // sair do campo
await page.waitForTimeout(2500); // aguardar preenchimento de Rua, Bairro, Cidade, Estado

// Verificar que o endereço foi preenchido automaticamente
await expect(page.getByLabel('Logradouro')).not.toHaveValue('');
```

**CEP fixo para testes** (Belém-PA, sem falha de busca): `68902865`

---

## 4. Telefone / Celular — (00) 00000-0000

```js
const telefoneLimpo = telefone.replace(/\D/g, ''); // '91999999999'
await page.getByLabel('Telefone').pressSequentially(telefoneLimpo, { delay: 80 });

// Celular com 9 dígitos (formato atual)
// (91) 99999-9999 → digitar: 91999999999
```

---

## 5. Data — dd/mm/aaaa

### Campo de texto com máscara

```js
// Digitar a data com a máscara (incluindo barras)
await page.getByLabel('Data de Vencimento').pressSequentially('31/12/2024', { delay: 80 });

// Ou limpar a máscara e deixar o campo formatar
// (depende de como o campo foi implementado — testar ambos)
await page.getByLabel('Data').pressSequentially('31122024', { delay: 80 });
```

### Datepicker (componente visual)

```js
// Abrir o datepicker
await page.getByLabel('Data de Início').click();

// Navegar para o mês correto
while (await page.getByRole('button', { name: 'Próximo mês' }).isVisible()) {
  const mesAtual = await page.locator('.datepicker-header').textContent();
  if (mesAtual.includes('dezembro') && mesAtual.includes('2024')) break;
  await page.getByRole('button', { name: 'Próximo mês' }).click();
}

// Clicar no dia
await page.getByRole('button', { name: '31', exact: true }).click();

// Alternativa: tentar fill direto (alguns datepickers aceitam)
await page.getByLabel('Data').fill('2024-12-31'); // formato ISO
```

---

## 6. Moeda — R$ 0.000,00

```js
// Digitar apenas os números (centavos implícitos)
// R$ 1.500,00 → digitar: 150000
const valorCentavos = '150000'; // R$ 1.500,00
await page.getByLabel('Valor').pressSequentially(valorCentavos, { delay: 80 });

// Verificar valor formatado
await expect(page.getByLabel('Valor')).toHaveValue('R$ 1.500,00');
```

---

## 7. Campos que bloqueiam colagem (paste)

Alguns campos desabilitam `Ctrl+V`. `pressSequentially` resolve isso.

```js
// Se o campo rejeitar até pressSequentially (muito raro), usar clipboard API
await page.evaluate((valor) => {
  const input = document.querySelector('input[name="cpf"]');
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  nativeInputValueSetter.call(input, valor);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}, cpfLimpo);
```

---

## 8. Limpar campo antes de preencher

```js
// Limpar e preencher (quando o campo já tem valor)
await page.getByLabel('CPF').clear();
await page.getByLabel('CPF').pressSequentially(cpfLimpo, { delay: 80 });

// Ou usar triple-click para selecionar tudo + digitar
await page.getByLabel('CPF').click({ clickCount: 3 });
await page.keyboard.type(cpfLimpo);
```

---

## 9. Verificar campo após preenchimento

```js
// Confirmar valor com máscara aplicada
await expect(page.getByLabel('CPF')).toHaveValue('123.456.789-01');
await expect(page.getByLabel('CNPJ')).toHaveValue('00.000.000/0001-91');
await expect(page.getByLabel('CEP')).toHaveValue('68902-865');
```

---

## Referência rápida

| Campo | Limpar máscara? | Delay | Aguardar após |
|-------|----------------|-------|----------------|
| CPF | Sim (só dígitos) | 80ms | Não |
| CNPJ | Sim (só dígitos) | 80ms | 2s se busca automática |
| CEP | Sim (só dígitos) | 80ms | 2.5s para preench. endereço |
| Telefone | Sim (só dígitos) | 80ms | Não |
| Data (texto) | Não (incluir `/`) | 80ms | Não |
| Moeda | Sim (centavos) | 80ms | Não |
