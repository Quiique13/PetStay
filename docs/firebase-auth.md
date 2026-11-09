# Firebase Authentication

For the native Android build (`com.app.petstay`), see [Android setup](android.md).

The Windows portable build from 1.6.1 uses the default system browser for Google
sign-in. Click **Continuar com Google** in PetStay, finish sign-in in the browser
tab that opens, then return to the app. A single-use local callback transfers
the Google credential to PetStay; tokens are not placed in URLs or written to
the hotel files. The browser helper uses an in-memory Firebase session and does
not open hotel records. **Cancelar** in PetStay cancels the pending request.
Google rejects the embedded sign-in popup used by the older portable build.
Email/password sign-in remains available directly in the app.

For the portable build, authorize `127.0.0.1` using the steps below. Build a new
portable executable with `npm.cmd run build:portable`; test the packaged app
with `npm.cmd run test:desktop` and the actual portable executable with
`npm.cmd run test:portable`. Outputs are in `release/v<version>/`. To replace an
older portable executable, close it and put the new executable beside the same
`data/` folder. Do not delete or move that data folder when updating.

PetStay includes Google sign-in, email/password sign-in and registration, password
reset, persistent sessions and sign-out. Every Firebase UID has its own hotel in
Cloud Firestore from version 1.7.0. Google and email sign-in resolve to the same hotel only when Firebase
resolves them to the same UID.

## Enable the providers

The public web configuration for `petstay-394ce` is included in
`src/services/firebase-config.ts`. Analytics is not needed for authentication.

1. Open [Firebase Authentication](https://console.firebase.google.com/project/petstay-394ce/authentication)
   and click **Get started** if prompted.
2. Under **Sign-in method**, enable **Email/Password**. The email-link option is
   separate and is not needed.
3. Enable **Google**, choose the project support email, and save.
4. Under **Settings → Authorized domains**, add `localhost`, `127.0.0.1`, and
   `quiique13.github.io`. Add any other production hostname you use. Enter hostnames
   without protocols, ports or `/PetStay/` paths.
5. Restart `npm run dev` and try creating an email/password account, signing out,
   signing back in and signing in with Google. The Firebase **Users** tab should
   show the accounts. Test Google on the actual hosted domain and mobile browsers.

`auth/configuration-not-found` means Authentication needs to be initialized or
the web configuration points to the wrong project. `auth/operation-not-allowed`
means the selected provider has not been enabled. `auth/unauthorized-domain`
means the current hostname is missing from Authorized domains.

To use another Firebase project, copy `.env.example` to `.env.local` and replace
the four public web values. Vite reads these values at build time, so rebuild both
targets after changing them. For a packaged desktop server using another project,
set `VITE_FIREBASE_PROJECT_ID` to that same project when starting the server.
Never put service-account keys or private credentials in `VITE_` variables.

## Account storage and existing data

From **1.7.0**, follow [Firestore synchronization setup](firestore-sync.md). The
following device stores are preserved as migration sources; they are not the
primary store for new edits.

- Browser/PWA: each UID has a separate IndexedDB database. A signed-in session and
  cached application can reopen and save offline on that device. New sign-ins,
  registration and password reset need internet.
- Desktop: requests carry a Firebase ID token. The local server verifies its
  signature, issuer, audience, expiration and identity before selecting
  `data/accounts/<sha256-of-uid>/hotel.json`. Recovery copies and revisions are
  scoped to the same account. Verification fetches Google's public signing keys
  and caches them in memory; internet is needed when keys are unavailable or expire.
- Signing out saves pending edits first and unmounts the hotel screens. Switching
  accounts mounts a new hotel provider, without showing the previous account's data.
- Existing `data/hotel.json`, `data/momo.json` and the old `petstay-mobile` database
  remain untouched. They are never assigned automatically to the first account to
  sign in. Import a previously exported backup into the intended account. Desktop
  users can also import the existing `data/hotel.json` file. To export an old browser
  database, use the prior version on that same origin before upgrading, then import
  its backup into the intended account.

Before 1.7.0, authentication alone did not synchronize hotel data. Update all
devices and publish the Firestore rules to enable account synchronization. Browser databases
and desktop files remain accessible to someone with access to that browser profile
or operating-system account; they are not encrypted per user.

## Validation

```sh
npm test
npm run test:mobile
```

Browser tests mock Firebase's HTTP responses while exercising the actual Firebase
client SDK. Server tests sign local RSA JWTs and verify rejection of forged,
expired and wrong-project tokens. No production accounts are created by tests.
Live Google OAuth and email delivery require the console setup above and a real
account to verify.

References: [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin),
[email/password](https://firebase.google.com/docs/auth/web/password-auth),
[ID token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens).
