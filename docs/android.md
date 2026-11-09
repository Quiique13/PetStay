# PetStay for Android

The Android app wraps the React interface with Capacitor. Its package name and
application ID are **`com.app.petstay`**. `capacitor.config.ts` is the Capacitor
configuration; the Android application ID is also in `android/app/build.gradle`.

## Finish Firebase registration

1. Open the existing Firebase project **`petstay-394ce`**. Go to **Project settings
   → Your apps → Add app → Android**.
2. Enter package name **`com.app.petstay`**, optional nickname **PetStay Android**,
   and register the app. If it is already registered, open that entry instead.
3. Run `npm.cmd run android:fingerprints`. Add the debug **SHA-1** and **SHA-256**
   fingerprints to that Android app's settings. These identify this machine's
   debug signing certificate. Builds distributed through Google Play need the
   Play app signing certificate fingerprints too.
4. Under **Authentication → Sign-in method**, enable **Google** (select the
   support email if prompted) and **Email/Password**.
5. Download the updated **`google-services.json`** from the Android app settings
   and save it as **`android/app/google-services.json`**. It must belong to
   `petstay-394ce` and `com.app.petstay`. This file is ignored by Git; provide it
   separately to other development machines or CI. Do not use a service-account
   key here.

The Google services Gradle plugin is already configured. The authentication
plugin supplies the native Firebase SDK and Google Credential Manager libraries;
no additional Firebase dependency or Analytics installation is required for
authentication. APK builds deliberately fail when the real configuration is
missing.

## Build and run

Use Node.js 22 or later, JDK 21, Android Studio, and Android SDK 36. The current
Windows machine has a local JDK at `.android-tools/jdk21` and SDK configuration
in `android/local.properties`; both stay out of Git. Android Studio's local
Gradle JVM configuration points to that JDK. On another machine, set `JAVA_HOME`
to JDK 21 and configure the Android SDK in Android Studio or `ANDROID_HOME`.

```powershell
# Rebuild the Android web bundle and sync native plugins/assets.
npm.cmd run android:sync

# Open the generated project in Android Studio.
npm.cmd run android:open

# Build a debug APK after adding the Firebase config file.
npm.cmd run android:apk

# Build and install on a connected Android device or emulator.
npm.cmd run android:run
```

The APK is `android/app/build/outputs/apk/debug/app-debug.apk`. Release signing
is intentionally unconfigured; release keys must be supplied separately.

The `android` Vite mode builds into `dist-android`, uses device storage, and
does not register a PWA service worker. Browser installation prompts are hidden
in the native app. The browser/PWA and desktop build commands are unchanged.

## Authentication and verification

Email/password authentication and password resets continue to use the Firebase
JavaScript SDK. Native Google sign-in gets a Google ID token through
`@capacitor-firebase/authentication`, then exchanges it for the same JavaScript
Firebase session used by the rest of PetStay. Native sign-in uses
`skipNativeAuth: true` so there is only one Firebase session to sign out of.
IndexedDB persistence restores that session after reopening the Android app.

Firebase JS is on the plugin-supported 12.x version. The lockfile deduplicates
`@firebase/app`; multiple copies can prevent the Auth component from registering.

Run `npm.cmd test` and `npm.cmd run test:mobile`. The native bridge browser test
mocks Android's credential response and Firebase's token exchange to verify
session persistence and sign-out. It does not replace a device test: after
adding the real config, verify Google login, email login, logout, and reopening
on an emulator or phone. Firebase Authentication does not add cloud data sync.

References: [Firebase Android setup](https://firebase.google.com/docs/android/setup),
[Capacitor Android](https://capacitorjs.com/docs/android),
[Firebase authentication plugin](https://capawesome.io/docs/sdks/capacitor/firebase/authentication/).
