# PetStay

Gestão de hotéis e creches para animais, em português de Portugal.

## 🌐 [ABRIR O PETSTAY NO NAVEGADOR →](https://quiique13.github.io/PetStay/)

**[https://quiique13.github.io/PetStay/](https://quiique13.github.io/PetStay/)**

Use no computador ou telemóvel, diretamente no navegador. Também pode instalar a aplicação no Android ou iPhone e usá-la offline após a primeira abertura e a confirmação de que está pronta.

| Como pretende usar? | Acesso direto |
| --- | --- |
| No navegador, Android ou iPhone | **[Abrir a aplicação web](https://quiique13.github.io/PetStay/)** |
| No Windows, sem instalação | **[Descarregar o executável portátil](https://github.com/Quiique13/PetStay/releases/download/v1.6.0/PetStay-1.6.0-windows-x64-portable.exe)** |
| Todas as versões e checksums | [GitHub Releases](https://github.com/Quiique13/PetStay/releases) |

No Windows, coloque o `.exe` numa pasta onde possa guardar dados e abra-o com um duplo clique. Não precisa de instalar Node.js ou npm. O hotel fica na pasta `data/` junto do executável; mantenha essa pasta ao atualizar.

- Organize hóspedes, tutores, reservas e pagamentos.
- Consulte o calendário, defina épocas altas por dia e mês e simule receitas.
- Guarde os dados no seu dispositivo e exporte cópias de segurança.

**Os dados ficam neste dispositivo.** Não existe sincronização automática entre dispositivos; use a exportação e importação de cópias para os transferir.

[Abrir a aplicação web](https://quiique13.github.io/PetStay/) · [Descarregar para Windows](https://github.com/Quiique13/PetStay/releases/latest) · [Consultar o guia completo](docs/guide.md)

## Desenvolvimento

O acesso usa Firebase Authentication com Google ou email e palavra-passe. Cada
conta tem o seu próprio hotel neste dispositivo. Consulte a
[configuração do Firebase e migração dos dados existentes](docs/firebase-auth.md)
para ativar os métodos de acesso e autorizar os domínios da aplicação.

Requer Node.js e npm.

```sh
npm ci
npm run dev
```

Consulte o [guia completo](docs/guide.md) para instalação, cópias de segurança, compilação e testes.
