# PetStay

Aplicação de gestão para proprietários de hotéis para animais, em português de Portugal, desenvolvida com React, TypeScript e Vite. Cada instalação tem um perfil de hotel e guarda os dados no próprio dispositivo.

## Funcionalidades

- Registo inicial do hotel com nome, nome do responsável e avatar opcional.
- Perfil do hotel editável na barra lateral ou no avatar do cabeçalho.
- Início limpo, sem hóspedes, reservas, preços ou meses de época alta predefinidos.
- Visão geral e calendário de estadias.
- Gestão de hóspedes, tutores e reservas de hotel ou creche.
- Registo do estado dos pagamentos.
- Preços por faixa etária e época do ano.
- Simulador de receita mensal por capacidade e ocupação.
- Datas e valores monetários no formato português.

O perfil e o avatar do hotel, hóspedes, tutores, reservas, pagamentos, preços e definições do simulador são guardados no ficheiro **`data/hotel.json`**, no disco deste dispositivo. O navegador apresenta os dados, mas não é o local de armazenamento.

Na primeira abertura, registe o hotel e depois adicione os hóspedes e preços manualmente. Os preços em branco significam «por definir»; uma reserva só pode ser criada depois de definir os preços relevantes. O valor zero só é usado quando for introduzido explicitamente.

A pasta `/data/` está no `.gitignore`, incluindo cópias de segurança e ficheiros temporários. Os seus dados não entram nos commits nem nos pushes habituais. Não use `git add -f data/`, pois essa opção ignora deliberadamente o `.gitignore`.

## Executar localmente

É necessário ter Node.js e npm instalados.

```sh
npm ci
npm run dev
```

Abra o endereço apresentado pelo Vite no terminal. O servidor local precisa de estar em execução para ler e guardar dados. O acesso fica limitado a este dispositivo.

### Atualizar a versão anterior

Se existir um ficheiro antigo `data/momo.json`, a aplicação apresenta o registo do hotel. Ao concluir o registo, o novo hotel começa limpo em `data/hotel.json`. O ficheiro antigo é preservado para consulta e recuperação. Se os dados sem perfil já estiverem no novo ficheiro, é criada uma cópia permanente `data/before-hotel-setup-*.json` antes de começar o hotel.

Os dados antigos do navegador não são importados automaticamente. Um hotel já registado mantém o perfil e os seus registos nas aberturas seguintes. Os navegadores neste dispositivo partilham o mesmo hotel local; não são criadas contas online ou sincronização entre dispositivos.

## Compilar

```sh
npm run build
```

A compilação verifica primeiro os tipos TypeScript. Os ficheiros de produção são gerados na pasta `dist/`.

Para executar a versão compilada com o mesmo armazenamento no dispositivo:

```sh
npm start
```

Servir apenas a pasta `dist/` num alojamento estático não fornece o armazenamento local. Execute apenas uma instância do servidor de cada vez.

## Cópias de segurança

Após cada gravação, a versão anterior fica em `data/hotel.json.bak`. A pasta `data/` não é servida como conteúdo público. Os ficheiros são gravados através de um ficheiro temporário, e gravações de janelas desatualizadas são recusadas para evitar a perda de alterações.

Para fazer uma cópia externa, pare o servidor e copie a pasta `data/` para um local seguro. Para restaurar a cópia anterior, pare o servidor, preserve uma cópia do ficheiro atual e copie `data/hotel.json.bak` para `data/hotel.json`. Volte a iniciar a aplicação.

## Verificar

```sh
npm run typecheck
npm test
```

O projeto usa TypeScript em modo estrito nos componentes React, no servidor local, na configuração do Vite e nos testes. Os testes são executados com `tsx` e o test runner do Node.js.

## Estrutura

```text
petstay/
├── index.html
├── public/                       # Ficheiros estáticos servidos diretamente
├── src/
│   ├── assets/                   # Imagens, fontes e outros recursos da aplicação
│   ├── components/
│   │   ├── Brand.tsx
│   │   ├── Dashboard.tsx
│   │   ├── EmptyState.tsx
│   │   ├── HotelAvatar.tsx
│   │   ├── HotelProfileForm.tsx
│   │   └── Onboarding.tsx
│   ├── hooks/
│   │   └── useDeviceData.ts       # Carregamento, registo e gravação automática
│   ├── context/
│   │   └── HotelContext.tsx      # Estado do hotel partilhado pelos componentes
│   ├── services/
│   │   └── device-storage.ts     # Pedidos à API do servidor local
│   ├── utils/
│   │   ├── format.ts             # Datas, valores, textos e iniciais
│   │   └── hotel-data.ts         # Estado vazio, validação e cálculo de preços
│   ├── App.tsx                   # Componente principal e seleção do ecrã
│   ├── main.tsx                  # Entrada React e configuração do provider
│   ├── types.ts                  # Tipos partilhados do hotel e armazenamento
│   ├── index.css                 # Estilos globais, fontes e variáveis
│   └── App.css                   # Estilos dos componentes e apresentação
├── server/
│   └── local-store.ts            # API e leitura/gravação no disco
├── tests/
├── data/                         # Dados privados; ignorados pelo Git
├── package.json
├── package-lock.json
├── tsconfig.json                 # Verificação TypeScript em modo estrito
├── vite.config.ts
└── README.md
```

As pastas `public/` e `src/assets/` estão preparadas para recursos públicos da aplicação. Os avatares escolhidos continuam nos dados privados do hotel, fora destas pastas.
