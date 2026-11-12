# PetStay

Gestão de hotéis e creches para animais, em português de Portugal.

## 🌐 [ABRIR O PETSTAY NO NAVEGADOR →](https://quiique13.github.io/PetStay/)

**[https://quiique13.github.io/PetStay/](https://quiique13.github.io/PetStay/)**

Use no computador ou telemóvel, diretamente no navegador. Também pode instalar a aplicação no Android ou iPhone e usá-la offline após a primeira abertura e a confirmação de que está pronta.

| Como pretende usar? | Acesso direto |
| --- | --- |
| No navegador, Android ou iPhone | **[Abrir a aplicação web](https://quiique13.github.io/PetStay/)** |
| No Windows, sem instalação | **[Descarregar o executável portátil](https://github.com/Quiique13/PetStay/releases/download/v1.7.1/PetStay-1.7.1-windows-x64-portable.exe)** |
| No Windows, com instalação | **[Descarregar o instalador](https://github.com/Quiique13/PetStay/releases/download/v1.7.1/PetStay-1.7.1-windows-x64-setup.exe)** |
| Android, APK de teste | [Descarregar o APK](https://github.com/Quiique13/PetStay/releases/download/v1.7.0/PetStay-1.7.0-android-debug.apk) |
| Todas as versões e checksums | [GitHub Releases](https://github.com/Quiique13/PetStay/releases) |

No Windows, coloque o `.exe` numa pasta onde possa guardar dados e abra-o com um duplo clique. Não precisa de instalar Node.js ou npm. O hotel fica na pasta `data/` junto do executável; mantenha essa pasta ao atualizar.

Na versão portátil 1.6.1, o início de sessão com Google abre no navegador
predefinido e regressa à aplicação. Para atualizar, feche o PetStay e coloque o
novo executável junto da mesma pasta `data/`.

- Organize hóspedes, tutores, reservas e pagamentos.
- Consulte o calendário, defina épocas altas por dia e mês e simule receitas.
- Sincronize os dados com a sua conta e exporte cópias de segurança.

**A partir da versão 1.7.0, os dados são sincronizados com a sua conta.** Entre com a mesma conta Google em todos os dispositivos e aguarde a indicação **Sincronizado**. Publique primeiro as [regras do Firestore](docs/firestore-sync.md). As alterações sem ligação ficam guardadas neste dispositivo até serem sincronizadas.

[Abrir a aplicação web](https://quiique13.github.io/PetStay/) · [Descarregar para Windows](https://github.com/Quiique13/PetStay/releases/latest) · [Consultar o guia completo](docs/guide.md)

## Desenvolvimento

Para compilar a aplicação Android (`com.app.petstay`), consulte a
[configuração de Android e Firebase](docs/android.md).

O acesso usa Firebase Authentication com Google ou email e palavra-passe. Cada
conta tem o seu próprio hotel no Cloud Firestore. Consulte a
[configuração do Firebase e migração dos dados existentes](docs/firebase-auth.md)
para ativar os métodos de acesso e autorizar os domínios da aplicação.

Requer Node.js e npm.

```sh
npm ci
npm run dev
```

Consulte o [guia completo](docs/guide.md) para instalação, cópias de segurança, compilação e testes.
