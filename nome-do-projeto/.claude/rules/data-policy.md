# Política de Dados de Teste — faker-br

## Quando Usar faker-br

Use `faker-br` para gerar dados brasileiros realistas que variam a cada execução. Ideal para:

- CPF e CNPJ com dígitos verificadores válidos
- Nomes de empresas e pessoas
- Endereços e CEPs
- Números de telefone no padrão BR

```js
const fakerBr = require('faker-br');
```

---

## Dados Gerados por Run (variam a cada execução)

```js
// Empresa
const empresa = {
  razaoSocial: fakerBr.company.companyName() + ' LTDA',
  cnpj: fakerBr.br.cnpj(),              // '12.345.678/0001-95'
  nomeFantasia: fakerBr.company.companyName(),
};

// Pessoa
const pessoa = {
  nome: fakerBr.name.findName(),
  cpf: fakerBr.br.cpf(),               // '123.456.789-09'
  rg: String(fakerBr.random.number({ min: 1000000, max: 9999999 })),
};

// Números aleatórios
const numero = fakerBr.random.number({ min: 1, max: 9999 });
const cnes   = fakerBr.random.number({ min: 1000000, max: 9999999 });
```

---

## Dados Fixos (endereços, configurações de portal)

Use constantes fixas para dados que devem ser estáveis e reproduzíveis:

```js
// Endereço fixo (CEP válido)
const endereco = {
  uf: 'AP',
  cep: '68902865',
  logradouro: 'Av. 13 de Setembro',
  numero: '100',
  bairro: 'Buritizal',
  municipio: 'Macapá',
};
```

---

## Formatação de Campos Mascarados

Ao gerar CNPJ/CPF do faker-br, verifique o formato esperado pelo campo:

```js
// faker-br já retorna formatado: '12.345.678/0001-95'
// Para campos que aceitam só dígitos:
const cnpjSoDigitos = fakerBr.br.cnpj().replace(/\D/g, '');

// Para campos que esperam máscara, use pressSequentially:
await campo.pressSequentially(cnpjSoDigitos, { delay: 80 });
```

---

## Dados de Ambiente (credenciais e configurações)

Nunca gere credenciais com faker. Use variáveis de ambiente:

```js
const CODIGO_ASSINATURA = process.env.CODIGO_ASSINATURA || '555555';
const cpf = process.env.USER_CPF;
const senha = process.env.USER_PASSWORD;
```

---

## Regras

- Usar faker-br para dados de formulário que variam
- Usar constantes fixas para endereços e configurações de portal
- Usar variáveis de ambiente para credenciais
- Nunca hardcodar CPF/CNPJ/senha de usuário real no código
- Nunca commitar `.env` (apenas `.env.example`)
