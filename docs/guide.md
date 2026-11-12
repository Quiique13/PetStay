# Guia do PetStay

Aplicação de gestão para proprietários de hotéis para animais, em português de Portugal, desenvolvida com React, TypeScript e Vite. Desde a versão 1.7.0, cada conta tem um hotel no Cloud Firestore, sincronizado entre dispositivos, com uma cópia local para trabalho sem ligação. Consulte a [configuração de sincronização](firestore-sync.md).

Entre com Google ou email e palavra-passe. A mesma conta abre o mesmo hotel nos dispositivos com a versão 1.7.0 ou posterior e regras Firestore publicadas. Dados anteriores associados à conta são migrados; se existirem duas cópias diferentes, escolha a que pretende manter. Consulte a [configuração do acesso e migração](firebase-auth.md).

## Funcionalidades

- Um cliente pode ter vários cães: selecione um cliente existente ao adicionar um hóspede ou use «Adicionar cão a este cliente» na lista agrupada por tutor.
- Idade e faixa etária calculadas pela data de nascimento completa; as reservas usam a idade em cada noite.
- Fotografias nos hóspedes, preço total personalizado por reserva e suplemento opcional de 2 € por noite/dia para cães não castrados.

As fotografias dos cães usam um enquadramento quadrado (1:1). Ao adicionar ou
alterar uma fotografia de hóspede, arraste a imagem e ajuste o zoom no editor de
recorte; escolha **Usar fotografia** para aplicar. Pode voltar a **Recortar
fotografia** para ajustar uma imagem existente. **Cancelar** mantém a fotografia
anterior.
- Calendário mensal completo e época de Natal com datas e preços próprios.

- Registo inicial do hotel com nome, nome do responsável e avatar opcional.
- Perfil do hotel editável na barra lateral ou no avatar do cabeçalho.
- Início limpo, sem hóspedes, reservas, preços ou períodos de época alta predefinidos.
- Visão geral e calendário de estadias.
- Gestão de hóspedes, tutores e reservas de hotel ou creche.
- Registo do estado dos pagamentos.
- Preços por faixa etária e época do ano, com períodos de época alta definidos por dia e mês e repetidos anualmente. Os restantes dias usam os preços de época baixa.
- Simulador de receita mensal por capacidade e ocupação.
- Datas e valores monetários no formato português.
- Aplicação móvel instalável no Android e iPhone, com funcionamento offline.
- Exportação e importação de cópias entre o computador e o telemóvel, com pré-visualização e recuperação.

O perfil e avatar do hotel, hóspedes e tutores, fotografias, reservas, pagamentos, preços e definições do simulador são guardados no **Cloud Firestore**, separados pelo UID da conta, e numa cópia local IndexedDB. Os ficheiros anteriores em `data/accounts/<identificador-da-conta>/hotel.json` e as bases móveis por conta são preservados para migração. A aparência e o idioma continuam a ser preferências do dispositivo.

Na primeira abertura, registe o hotel e depois adicione os hóspedes e preços manualmente. Os preços em branco significam «por definir»; uma reserva só pode ser criada depois de definir os preços relevantes. O valor zero só é usado quando for introduzido explicitamente.

A pasta `/data/` está no `.gitignore`, incluindo cópias de segurança e ficheiros temporários. Os seus dados não entram nos commits nem nos pushes habituais. Não use `git add -f data/`, pois essa opção ignora deliberadamente o `.gitignore`.

## Windows — versão portátil

Descarregue o executável portátil na [versão mais recente no GitHub](https://github.com/Quiique13/PetStay/releases/latest). Para sincronizar, é necessária a versão **1.7.0 ou posterior**; se ainda não estiver publicada, compile-a com `npm run build:portable`. Coloque o ficheiro numa pasta onde possa guardar dados e abra-o com um duplo clique. Não é necessário instalar a aplicação, Node.js ou npm para usar o executável. Esta versão destina-se ao Windows 10/11 de 64 bits (x64).

Na versão 1.6.1, o botão **Continuar com Google** abre o navegador predefinido.
Conclua o início de sessão nesse navegador e volte à aplicação. Pode cancelar o
pedido na janela do PetStay.

O executável cria a pasta **`data/` ao seu lado**, com os registos do hotel e uma pasta `.runtime/` para os ficheiros internos da janela. Para transportar a aplicação para outro computador, feche-a e copie **o executável e a pasta `data/` em conjunto**. Para atualizar, feche a aplicação e substitua apenas o executável, mantendo a pasta `data/`. Os downloads não incluem dados de nenhum hotel.

O executável não tem assinatura digital; o Windows poderá apresentar um aviso do SmartScreen. Os ficheiros `SHA256SUMS.txt` da versão permitem verificar a integridade do download com `Get-FileHash` no PowerShell.

Para usar o hotel da versão de desenvolvimento, aguarde **Sincronizado** e entre na mesma conta no executável atualizado. Preserve as pastas `data/` anteriores: contêm os dados de migração e a cópia offline.

### Windows — instalador

Também pode descarregar **PetStay-1.7.1-windows-x64-setup.exe** na [versão 1.7.1 no GitHub](https://github.com/Quiique13/PetStay/releases/tag/v1.7.1). O assistente instala a aplicação para o utilizador atual e cria atalhos no ambiente de trabalho e no menu Iniciar. Para compilar ambos os executáveis Windows, use `npm run build:windows`.

A versão instalada guarda a cópia local em **%APPDATA%\PetStay\data**, separada da pasta da aplicação. Entre na mesma conta da versão portátil para usar o hotel sincronizado. As atualizações e a desinstalação preservam os dados.

Os executáveis portáteis, instaladores e respetivos checksums são distribuídos apenas através de GitHub Releases. O código de empacotamento Windows encontra-se em `desktop/` e `scripts/`; os ficheiros gerados ficam em `release/`, fora dos commits.

## Android e iPhone — aplicação instalável

Abra [PetStay Mobile](https://quiique13.github.io/PetStay/) no telemóvel. No Android, use «Instalar aplicação» no Chrome ou no menu do navegador. No iPhone, abra no Safari e escolha **Partilhar → Adicionar ao ecrã principal**. Abra a aplicação instalada antes de importar os seus dados; o Safari e a aplicação instalada podem ter armazenamentos separados.

Depois de o aviso indicar que está pronta para uso sem ligação, a aplicação abre e permite gerir o hotel offline. Os tipos de letra e a imagem decorativa também estão incluídos na aplicação. As atualizações apresentam um botão e só são aplicadas depois de guardar as alterações.

Os registos sincronizados ficam na conta Firebase. Alterações sem ligação ficam pendentes neste dispositivo: aguarde **Sincronizado** antes de mudar de dispositivo. Limpar os dados do navegador ou remover a aplicação pode eliminar alterações ainda não sincronizadas. Guarde cópias externas regularmente.

### Transferir dados entre computador e telemóvel

1. No dispositivo com os dados mais recentes, abra **Dados e cópias** no cabeçalho.
2. Toque em **Exportar cópia → Guardar ficheiro**. Em telemóveis compatíveis pode usar **Partilhar cópia**.
3. Transfira o ficheiro `.json` por AirDrop, cabo ou um serviço de ficheiros à sua escolha.
4. No outro dispositivo, abra **Dados e cópias → Escolher cópia para importar**. Na primeira abertura também pode usar **Já tem um hotel? Importar cópia**, sem criar um hotel vazio.
5. Confirme o hotel e as quantidades apresentadas. Se já existirem dados, assinale a confirmação e toque em **Importar e substituir**.

A cópia inclui todos os campos: perfil, avatar, hóspedes e tutores, reservas, estado dos pagamentos, preços, períodos de época alta, capacidade e ocupação. As seleções de meses das versões anteriores são convertidas automaticamente em períodos com os mesmos dias. O ficheiro **`data/hotel.json` da versão 1.0** também pode ser importado diretamente; para exportar através da interface no computador, atualize o executável para a versão 1.1 ou posterior mantendo a pasta `data/`.

A importação **substitui o hotel completo da conta em todos os dispositivos** e não junta alterações. Para usar o mesmo hotel noutro dispositivo com a versão 1.7.0 ou posterior, basta entrar na mesma conta; não é necessário importar uma cópia.

Antes de substituir dados existentes, é preservada uma cópia que pode voltar a abrir em **Recuperar dados anteriores**. Desde a versão 1.7.0, existe uma cópia local por conta e, após sincronizar a importação, uma cópia de recuperação no Firestore. Gravações posteriores não apagam esta cópia; uma nova importação substitui-a pela versão imediatamente anterior. Ficheiros inválidos, incompatíveis ou acima de 10 MB são recusados antes de alterar os dados.

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

Os dados antigos sem conta não são importados automaticamente. Os dados associados ao UID são migrados na primeira ligação ao Firestore. Um hotel já sincronizado mantém o perfil e os seus registos ao entrar com a mesma conta noutro dispositivo atualizado.

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
