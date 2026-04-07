# /generate-data — Gerar Massa de Dados de Teste

Gera e exibe dados brasileiros realistas para uso em testes usando faker-br.

## Uso

```
/generate-data [tipo]
```

Tipos disponíveis: `empresa`, `pessoa`, `endereco`, `contato`, `completo`

## Comportamento

Quando invocado, gere e exiba os dados no console usando o snippet abaixo:

```js
const fakerBr = require('faker-br');

const dados = {
  empresa: {
    razaoSocial: fakerBr.company.companyName() + ' LTDA',
    nomeFantasia: fakerBr.company.companyName(),
    cnpj: fakerBr.br.cnpj(),
    cnes: String(fakerBr.random.number({ min: 1000000, max: 9999999 })),
  },
  responsavel: {
    nome: fakerBr.name.findName(),
    cpf: fakerBr.br.cpf(),
    rg: String(fakerBr.random.number({ min: 1000000, max: 9999999 })),
    celular: `(96) 9${fakerBr.random.number({ min: 1000, max: 9999 })}-${fakerBr.random.number({ min: 1000, max: 9999 })}`,
    email: fakerBr.internet.email(),
  },
  endereco: {
    cep: '68902865',
    logradouro: 'Av. 13 de Setembro',
    numero: String(fakerBr.random.number({ min: 1, max: 9999 })),
    bairro: 'Buritizal',
    municipio: 'Macapá',
    uf: 'AP',
  },
};

console.log(JSON.stringify(dados, null, 2));
```

## Após Geração

- Exiba os dados gerados formatados
- Indique quais campos usam `pressSequentially` (CPF, CNPJ, telefone)
- Lembre que CEP fixo garante auto-preenchimento de endereço
