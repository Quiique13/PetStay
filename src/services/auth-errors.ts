export function authErrorMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error ? error.code : "";
  switch (code) {
    case "auth/invalid-email":
      return "Introduza um endereço de email válido.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email ou palavra-passe incorretos.";
    case "auth/email-already-in-use":
      return "Este email já tem uma conta. Inicie sessão ou recupere a palavra-passe.";
    case "auth/weak-password":
    case "auth/password-does-not-meet-requirements":
      return "A palavra-passe não cumpre os requisitos. Use pelo menos 6 caracteres ou uma palavra-passe mais forte.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "O início de sessão com Google foi cancelado. Pode tentar novamente.";
    case "auth/popup-blocked":
      return "O navegador bloqueou a janela do Google. Permita janelas pop-up e tente novamente.";
    case "auth/account-exists-with-different-credential":
      return "Este email usa outro método de acesso. Inicie sessão com o método original.";
    case "auth/network-request-failed":
      return "Sem ligação ao serviço de acesso. Verifique a internet e tente novamente.";
    case "auth/too-many-requests":
      return "Demasiadas tentativas. Aguarde uns minutos e tente novamente.";
    case "auth/user-disabled":
      return "Esta conta foi desativada. Contacte o responsável pelo PetStay.";
    case "auth/unauthorized-domain":
      return "Este domínio ainda não está autorizado no Firebase Authentication.";
    case "auth/operation-not-allowed":
      return "Este método de acesso ainda não está ativo no Firebase Authentication.";
    case "auth/invalid-api-key":
    case "auth/configuration-not-found":
      return "Não foi possível configurar o acesso. Verifique a configuração do Firebase Authentication.";
    default:
      return "Não foi possível concluir o acesso. Tente novamente.";
  }
}
