# MOMO - Hotel & Creche

Aplicação de gestão do MOMO - Hotel & Creche, em português de Portugal, desenvolvida com React e Vite.

## Funcionalidades

- Visão geral e calendário de estadias.
- Gestão de hóspedes, tutores e reservas de hotel ou creche.
- Registo do estado dos pagamentos.
- Preços por faixa etária e época do ano.
- Simulador de receita mensal por capacidade e ocupação.
- Datas e valores monetários no formato português.

Os dados são guardados no armazenamento local do navegador (`localStorage`). A aplicação inclui dados de demonstração e não tem, atualmente, um servidor ou sincronização entre dispositivos.

## Executar localmente

É necessário ter Node.js e npm instalados.

```sh
npm ci
npm run dev
```

Abra o endereço apresentado pelo Vite no terminal.

## Compilar

```sh
npm run build
```

Os ficheiros de produção são gerados na pasta `dist/`.

## Estrutura

- `src.jsx`: interface e lógica da aplicação.
- `locale.js`: textos e formatação em português.
- `style.css`: estilos e apresentação responsiva.
- `public/momo_logo.png`: logótipo do hotel.
