# Skill: Geração de Massa de Dados — faker-br

## Instalação

```bash
npm install faker-br
```

```js
const fakerBr = require('faker-br');
```

---

## Snippets Prontos

### Empresa

```js
const empresa = {
  razaoSocial: fakerBr.company.companyName() + ' LTDA',
  nomeFantasia: fakerBr.company.companyName(),
  cnpj: fakerBr.br.cnpj(),
  cnes: String(fakerBr.random.number({ min: 1000000, max: 9999999 })),
  inscricaoEstadual: String(fakerBr.random.number({ min: 100000000, max: 999999999 })),
};
```

### Pessoa

```js
const pessoa = {
  nome: fakerBr.name.findName(),
  cpf: fakerBr.br.cpf(),
  rg: String(fakerBr.random.number({ min: 1000000, max: 9999999 })),
  orgaoExpedidor: 'SSP',
  ufExpedidor: 'AP',
  celular: `(96) 9${fakerBr.random.number({ min: 1000, max: 9999 })}-${fakerBr.random.number({ min: 1000, max: 9999 })}`,
  email: fakerBr.internet.email(),
};
```

### Endereço (CEP fixo validado)

```js
const endereco = {
  cep: '68902865',
  logradouro: 'Av. 13 de Setembro',
  numero: String(fakerBr.random.number({ min: 1, max: 9999 })),
  bairro: 'Buritizal',
  municipio: 'Macapá',
  uf: 'AP',
};
```

### Contato

```js
const contato = {
  telefone: `(96) ${fakerBr.random.number({ min: 2000, max: 3999 })}-${fakerBr.random.number({ min: 1000, max: 9999 })}`,
  celular: `(96) 9${fakerBr.random.number({ min: 1000, max: 9999 })}-${fakerBr.random.number({ min: 1000, max: 9999 })}`,
  email: fakerBr.internet.email(),
};
```

---

## Formatação para Campos Mascarados

```js
const cnpjDigitos = empresa.cnpj.replace(/\D/g, '');
const cpfDigitos  = pessoa.cpf.replace(/\D/g, '');

await campo.pressSequentially(cnpjDigitos, { delay: 80 });
```

---

## Uso no Spec (geração fora dos blocos test)

```js
const fakerBr = require('faker-br');

// Gerado uma vez por run, no topo do arquivo
const empresa = {
  razaoSocial: fakerBr.company.companyName() + ' LTDA',
  cnpj: fakerBr.br.cnpj(),
};

test.describe('Cadastro', () => {
  test('fluxo completo', async ({ page }) => {
    await preencherCampoTexto(page, 'Razão Social', empresa.razaoSocial);
    await preencherCampoTexto(page, 'CNPJ', empresa.cnpj.replace(/\D/g, ''));
  });
});
```

---

## Regras

- faker-br é totalmente síncrono — sem await
- Gere todos os dados no topo do arquivo, fora dos blocos `test()`
- CEPs fixos garantem que o auto-preenchimento de endereço funcione
- Para campos mascarados, remova `.replace(/\D/g, '')` antes de usar `pressSequentially`
