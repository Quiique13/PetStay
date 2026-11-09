# Account synchronization (1.7.0)

PetStay stores hotel data in Cloud Firestore, keyed by the Firebase Authentication
UID. Sign in with the same Google account in development, the portable executable,
the PWA, or Android to open the same hotel. Google credentials remain in Firebase
Authentication; hotel records are stored in the project's Firestore database, not
in Google Drive. Theme, language and installation preferences remain device settings.

## Firebase console setup

1. In project **petstay-394ce**, create **Cloud Firestore**, database **(default)**.
2. Open **Rules**, replace the editor contents with [`firestore.rules`](../firestore.rules),
   and click **Publish**. The default `allow read, write: if false` blocks sync.
3. Open PetStay **1.7.0 or newer**, sign in, and wait for **Sincronizado com a sua conta**.
   No collections need to be created manually. On the second device, use the same
   account and the same updated app version.

Alternatively, with an authenticated Firebase CLI:

```sh
npx firebase deploy --only firestore:rules,firestore:indexes --project petstay-394ce
```

The index configuration excludes snapshot contents from indexing. The rules only
allow an authenticated UID to access `/owners/<its-own-uid>/...`. They also validate
manifest revisions and keep uploaded snapshot pieces immutable. Never replace them
with a public read/write rule.

## Existing data, offline changes and recovery

- The first connection checks the old local store belonging to that UID. If the
  cloud is empty, those records are uploaded. If both copies exist and differ,
  PetStay shows the two hotels and their guest/booking counts. Export either copy
  and choose which to use. This replaces the full hotel; records are not merged.
- Old unowned `data/hotel.json`, `data/momo.json` and `petstay-mobile` databases
  remain untouched. Import a backup explicitly into the intended account.
- Every edit is saved to an account-specific IndexedDB draft before upload. A
  cloud acknowledgement is required before the app displays **Sincronizado**.
  Offline drafts survive reloads and are retried when connectivity returns.
- If another device changed the cloud revision, pending local changes are kept
  and the app asks which copy to retain. Imports and conflict decisions preserve
  a recovery copy accessible in **Dados e cópias → Recuperar dados anteriores**.
- One window per account and browser origin edits at a time. Other windows wait
  for it to close, protecting the shared offline draft. Different devices use
  live Firestore updates and revision checks.
- Signing out waits for the local draft, including offline. Wait for **Sincronizado**
  before switching devices. Clearing browser/app data can remove pending offline
  changes. Export backups regularly.
- The portable app keeps a stable localhost port in `data/.runtime/server-port` so
  its account cache and sign-in survive restarts. Preserve the complete `data/`
  folder when replacing the executable. A port conflict is reported without
  silently switching to a different browser origin.

## Storage and limits

All `HotelData` fields sync: hotel identity/avatar, guests and owners, photos,
bookings and payment state, prices/seasons, capacity and occupancy. A small
manifest points to immutable JSON pieces so photos do not exceed Firestore's
1 MiB document limit. A transaction publishes a complete snapshot only when the
expected revision still matches. Current, previous, and pre-import snapshots are
retained; older successful versions are pruned. Interrupted/conflicting uploads
may leave unreferenced pieces; these do not appear as hotel data.

The complete snapshot limit is 10 MiB. Uploading a new snapshot writes all pieces,
so large photo collections consume more Firestore bandwidth and operations.
Local caches are not encrypted per user; use a trusted browser/OS profile.

## Validation

```sh
npm test
npm run test:mobile
npm run test:cloud
npm run build:portable
npm run test:desktop
npm run test:portable
```

`test:cloud` requires Java 21+ and installed Playwright browsers. It starts a local
Firestore emulator, tests cross-account denials and stale revisions, then tests
two isolated Chromium/WebKit devices with large photos, offline restart, and
conflict resolution. No live database or production account is used. The existing
UI regression suite uses dedicated local-storage test builds; production builds
always use Firestore.

References: [Firestore rules](https://firebase.google.com/docs/firestore/security/rules-conditions),
[offline persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline),
[transactions](https://firebase.google.com/docs/firestore/manage-data/transactions).
