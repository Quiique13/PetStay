import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("petStayDesktop", {
  signInWithGoogle: () => ipcRenderer.invoke("petstay:google-sign-in"),
  cancelSignIn: () => ipcRenderer.invoke("petstay:cancel-sign-in"),
});
