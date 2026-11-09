import { Capacitor } from "@capacitor/core";
import {
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";
import type { Auth } from "firebase/auth";

export async function loginWithGoogle(auth: Auth) {
  if (window.petStayDesktop) {
    const result = await window.petStayDesktop.signInWithGoogle();
    if (result.errorCode || !result.idToken) {
      throw Object.assign(new Error("Desktop sign-in did not complete."), {
        code: result.errorCode || "auth/invalid-credential",
      });
    }
    return signInWithCredential(auth, GoogleAuthProvider.credential(result.idToken));
  }
  if (Capacitor.isNativePlatform()) {
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    const result = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
    const idToken = result.credential?.idToken;
    if (!idToken) throw new Error("Google sign-in did not return an ID token.");
    return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  // Load the browser OAuth iframe only when sign-in is requested.
  return signInWithPopup(auth, provider, browserPopupRedirectResolver);
}
