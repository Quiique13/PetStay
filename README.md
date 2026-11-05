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
- Aplicação móvel instalável no Android e iPhone, com funcionamento offline.
- Exportação e importação de cópias entre o computador e o telemóvel, com pré-visualização e recuperação.

No computador, o perfil e o avatar do hotel, hóspedes, tutores, reservas, pagamentos, preços e definições do simulador são guardados no ficheiro **`data/hotel.json`**, no disco deste dispositivo. A versão móvel guarda os mesmos dados em **IndexedDB**, no navegador ou aplicação instalada no telemóvel. O modo de armazenamento é escolhido na compilação; uma falha no servidor do computador nunca cria um hotel vazio no navegador.

Na primeira abertura, registe o hotel e depois adicione os hóspedes e preços manualmente. Os preços em branco significam «por definir»; uma reserva só pode ser criada depois de definir os preços relevantes. O valor zero só é usado quando for introduzido explicitamente.

A pasta `/data/` está no `.gitignore`, incluindo cópias de segurança e ficheiros temporários. Os seus dados não entram nos commits nem nos pushes habituais. Não use `git add -f data/`, pois essa opção ignora deliberadamente o `.gitignore`.

## Windows — versão portátil

Descarregue **PetStay-1.1.0-windows-x64-portable.exe** na [versão mais recente no GitHub](https://github.com/Quiique13/PetStay/releases/latest). Coloque o ficheiro numa pasta onde possa guardar dados e abra-o com um duplo clique. Não é necessário instalar a aplicação, Node.js ou npm. Esta versão destina-se ao Windows 10/11 de 64 bits (x64).

O executável cria a pasta **`data/` ao seu lado**, com os registos do hotel e uma pasta `.runtime/` para os ficheiros internos da janela. Para transportar a aplicação para outro computador, feche-a e copie **o executável e a pasta `data/` em conjunto**. Para atualizar, feche a aplicação e substitua apenas o executável, mantendo a pasta `data/`. Os downloads não incluem dados de nenhum hotel.

O executável não tem assinatura digital; o Windows poderá apresentar um aviso do SmartScreen. Os ficheiros `SHA256SUMS.txt` da versão permitem verificar a integridade do download com `Get-FileHash` no PowerShell.

Para usar os dados da versão de desenvolvimento, feche os dois servidores e copie a pasta `data/` existente para junto do executável. Preserve uma cópia de segurança antes de a mover ou substituir.

### Criar o executável

Num computador Windows com Node.js 24 e npm:

```sh
npm ci
npm test
npm run build:portable
npm run test:portable
```

O resultado fica em `release/PetStay-1.1.0-windows-x64-portable.exe`. A compilação inclui apenas os recursos de produção e o servidor local; a pasta privada `data/` fica excluída. `npm run desktop` abre a versão de desenvolvimento numa janela de aplicação.

O workflow `.github/workflows/portable.yml` também gera o executável no GitHub Actions. Pode ser iniciado manualmente para obter um artefacto ou através de uma tag `v*` para publicar uma versão no GitHub Releases. Atualize a versão em `package.json` e `package-lock.json` antes de criar uma nova tag.

## Android e iPhone — aplicação instalável

Abra [PetStay Mobile](https://quiique13.github.io/PetStay/) no telemóvel. No Android, use «Instalar aplicação» no Chrome ou no menu do navegador. No iPhone, abra no Safari e escolha **Partilhar → Adicionar ao ecrã principal**. Abra a aplicação instalada antes de importar os seus dados; o Safari e a aplicação instalada podem ter armazenamentos separados.

Depois de o aviso indicar que está pronta para uso sem ligação, a aplicação abre e permite gerir o hotel offline. Os tipos de letra e a imagem decorativa também estão incluídos na aplicação. As atualizações apresentam um botão e só são aplicadas depois de guardar as alterações.

Os dados ficam neste dispositivo, sem contas nem envio para um servidor. Limpar os dados do navegador, remover a aplicação ou usar navegação privada pode eliminar os registos. Guarde cópias externas regularmente; a cópia de recuperação interna não substitui uma exportação.

### Transferir dados entre computador e telemóvel

1. No dispositivo com os dados mais recentes, abra **Dados e cópias** no cabeçalho.
2. Toque em **Exportar cópia → Guardar ficheiro**. Em telemóveis compatíveis pode usar **Partilhar cópia**.
3. Transfira o ficheiro `.json` por AirDrop, cabo ou um serviço de ficheiros à sua escolha.
4. No outro dispositivo, abra **Dados e cópias → Escolher cópia para importar**. Na primeira abertura também pode usar **Já tem um hotel? Importar cópia**, sem criar um hotel vazio.
5. Confirme o hotel e as quantidades apresentadas. Se já existirem dados, assinale a confirmação e toque em **Importar e substituir**.

A cópia inclui todos os campos: perfil, avatar, hóspedes e tutores, reservas, estado dos pagamentos, preços, meses de época alta, capacidade e ocupação. O ficheiro **`data/hotel.json` da versão 1.0** também pode ser importado diretamente; para exportar através da interface no computador, atualize o executável para a versão 1.1 ou posterior mantendo a pasta `data/`.

A importação **substitui o hotel completo** e não junta alterações dos dois dispositivos. Para levar as alterações de volta, exporte uma nova cópia no dispositivo mais atualizado e importe-a no outro. Não existe sincronização automática.

Antes de substituir dados existentes, é preservada uma cópia que pode voltar a abrir em **Recuperar dados anteriores**. No computador fica em `data/before-import.json`; no telemóvel fica no armazenamento interno da aplicação. Gravações posteriores não apagam esta cópia; uma nova importação substitui-a pela versão imediatamente anterior. Ficheiros inválidos, incompatíveis ou acima de 10 MB são recusados antes de alterar os dados.

### Compilar e verificar a aplicação móvel

```sh
npm ci
npm run build:mobile
npm run preview:mobile
```

O resultado está em `dist-mobile/`, pronto para alojamento estático com HTTPS. O endereço local de pré-visualização é `http://127.0.0.1:4174`. Para desenvolvimento use `npm run dev:mobile`. Um telemóvel não consegue abrir o endereço `127.0.0.1` do computador; instale a partir do endereço HTTPS publicado.

```sh
npx playwright install chromium webkit
npm run test:mobile
```

Os testes compilam as duas versões e verificam o percurso computador → telemóvel → computador, confirmação de substituição, recuperação, recusa de ficheiros inválidos, gravação e reabertura offline e ecrãs de 320 e 390 píxeis em Chromium e WebKit. São testes de navegador com perfis de telemóvel; não substituem a verificação num iPhone ou Android real.

O workflow `.github/workflows/mobile.yml` executa estas verificações e publica apenas `dist-mobile/` no GitHub Pages a partir de `main`. O GitHub Pages deve estar configurado para GitHub Actions. As exportações e a pasta `data/` nunca fazem parte do site.

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

Servir apenas a pasta `dist/` num alojamento estático não fornece o armazenamento do computador. Para alojamento estático use a compilação móvel `dist-mobile/`. Execute apenas uma instância do servidor do computador de cada vez.

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
