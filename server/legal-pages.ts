import { readFileSync } from "node:fs";
import type { Plugin } from "vite";

export interface LegalOperator {
  status: string;
  name: string;
  address: string;
  privacyEmail: string;
  supportEmail: string;
  publicUrl: string;
  hostingProvider: string;
  firestoreLocation: string;
  retentionPolicy: string;
  updated: string;
}

const escape = (value: string) => value.replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]!);

export function renderLegalPages(operator: LegalOperator): Record<string, string> {
  const required = [operator.name, operator.address, operator.privacyEmail, operator.supportEmail,
    operator.publicUrl, operator.hostingProvider, operator.firestoreLocation, operator.retentionPolicy];
  const draft = operator.status !== "published" || required.some(value => !value.trim());
  const field = (value: string) => value.trim() ? escape(value) : '<mark>Por preencher antes da abertura ao público</mark>';
  const contact = `<p>Responsável pelo serviço e pelos dados de conta: ${field(operator.name)} (pessoa singular). Morada de contacto: ${field(operator.address)}. Privacidade: ${field(operator.privacyEmail)}. Apoio: ${field(operator.supportEmail)}.</p>`;
  const links = '<nav aria-label="Informação legal"><a href="index.html">Sobre o PetStay</a><a href="privacy.html">Privacidade</a><a href="terms.html">Termos de utilização</a><a href="cookies.html">Cookies e armazenamento</a><a href="rights.html">Direitos e pedidos</a></nav>';
  const content: Record<string, [string, string]> = {
    "index.html": ["PetStay — gestão de hotéis para animais", `
      <p>O PetStay ajuda a organizar hóspedes e tutores, reservas, preços sazonais e estados de pagamento de hotéis para animais. As contas podem iniciar sessão com Google ou email e palavra-passe. Os registos são sincronizados através do Firebase e podem ser exportados para cópia de segurança.</p>
      <p>O serviço destina-se a adultos que gerem alojamento ou creche de animais. Atualmente encontra-se em utilização privada; a abertura a outros utilizadores depende da conclusão da preparação jurídica e operacional.</p>
      ${contact}<p>Endereço público do serviço: ${field(operator.publicUrl)}.</p>
      <p>Leia a política de privacidade antes de criar uma conta ou escolher iniciar sessão com Google.</p><p><a href="../">Abrir aplicação</a></p>`],
    "privacy.html": ["Política de privacidade", `
      <h2>1. Quem trata os dados</h2>${contact}
      <p>Para dados de conta e funcionamento do serviço, o operador do PetStay atua como responsável pelo tratamento. Para dados de tutores e reservas introduzidos por um hotel independente, o hotel determina as finalidades e fundamentos e atua como responsável; o operador do serviço atua, em regra, como subcontratante segundo um acordo de tratamento de dados. O hotel deve prestar a sua própria informação aos tutores.</p>
      <h2>2. Dados e origem</h2><p>Na autenticação Google recebemos identificadores de conta, email e informação básica de perfil disponibilizada pelo Google (como nome e fotografia), além dos tokens necessários à sessão. Não pedimos acesso ao Gmail, contactos, calendário ou Google Drive. O PetStay não recebe a palavra-passe da sua conta Google. Com email e palavra-passe, as credenciais são geridas pelo Firebase Authentication.</p>
      <p>Tratamos os dados que introduzir: identidade e imagem do hotel; nomes dos tutores e dos animais; raça, nascimento, fotografia e outras características do animal; datas e tipo de estadia; preços e estado de pagamento. Uma fotografia de um animal pode incluir pessoas: evite carregá-las sem fundamento adequado. O PetStay não recolhe dados de cartão nem processa pagamentos.</p>
      <p>Os fornecedores de autenticação e alojamento podem tratar endereços IP, dados técnicos do dispositivo, pedidos de rede e registos de segurança. As preferências de idioma e aparência e os rascunhos offline ficam no dispositivo.</p>
      <h2>3. Finalidades e fundamentos</h2><p>Gerir a conta, autenticar, sincronizar e permitir exportações é necessário para prestar o serviço solicitado (artigo 6.º, n.º 1, alínea b), RGPD). Proteger contas e prevenir acessos indevidos pode basear-se no interesse legítimo na segurança, após avaliação dos direitos dos titulares (alínea f)). Cumprir obrigações legais aplica-se quando exista uma obrigação concreta (alínea c)). O tratamento de registos de um hotel segue as instruções documentadas desse hotel.</p>
      <p>O início de sessão Google é opcional; existe acesso por email. Não usamos a aceitação da política como consentimento genérico. Qualquer futura finalidade opcional que necessite de consentimento deve ser apresentada separadamente, com possibilidade de recusa e retirada.</p>
      <h2>4. Destinatários e transferências</h2><p>Usamos Google/Firebase para autenticação e Cloud Firestore para os registos. O fornecedor de alojamento da versão pública é: ${field(operator.hostingProvider)}. A localização configurada do Firestore é: ${field(operator.firestoreLocation)}. A configuração regional do Firestore não garante que todos os dados de autenticação e suporte permaneçam na UE.</p>
      <p>Os fornecedores podem tratar dados fora do Espaço Económico Europeu. O operador deve assegurar um mecanismo válido para cada transferência, como decisão de adequação aplicável ou cláusulas contratuais-tipo e medidas complementares quando necessárias. Consulte a <a href="https://firebase.google.com/support/privacy">informação de privacidade Firebase</a> e os <a href="https://firebase.google.com/terms/data-processing-terms/">termos de tratamento</a>. Pode pedir informação sobre destinatários e salvaguardas através do contacto de privacidade. O Google também trata dados da conta Google segundo a sua <a href="https://policies.google.com/privacy">política de privacidade</a>.</p>
      <h2>5. Conservação e eliminação</h2><p>Política de conservação do operador, incluindo prazos e critérios para contas, registos, cópias e logs: ${field(operator.retentionPolicy)}</p>
      <p>A versão atual não elimina automaticamente contas inativas. Fechar a sessão ou remover o acesso nas definições Google não apaga os dados PetStay. A eliminação da conta de autenticação também não elimina por si só os registos Firestore, versões anteriores, rascunhos ou cópias locais. Esses locais têm de ser abrangidos pelo processo de eliminação. Os backups exportados pelo utilizador ficam sob o seu controlo.</p>
      <h2>6. Direitos</h2><p>Pode pedir acesso, retificação, apagamento, limitação e, quando aplicável, portabilidade ou oposição. Quando o fundamento for consentimento, pode retirá-lo sem afetar o tratamento anterior. Responderemos em regra no prazo de um mês; uma extensão legalmente permitida será comunicada e fundamentada. Pedimos apenas os elementos proporcionais necessários para verificar a identidade.</p>
      <p>Use o contacto de privacidade acima. Se os seus dados foram registados por um hotel, dirija-se primeiro a esse hotel; o operador auxilia-o no âmbito do acordo de tratamento. Pode apresentar reclamação à <a href="https://www.cnpd.pt/cidadaos/participacoes/">CNPD</a> ou à autoridade de controlo competente, sem ter de nos contactar previamente. Consulte <a href="rights.html">Direitos e pedidos</a>.</p>
      <h2>7. Segurança e limites</h2><p>O serviço usa autenticação e regras de acesso por conta. As cópias no navegador e os ficheiros locais não são cifrados individualmente por utilizador. Use um dispositivo e perfil de sistema fiáveis. Não partilhe credenciais. Exporte cópias apenas para locais privados. Não introduza dados pessoais sensíveis nem documentos de identidade.</p>
      <p>Não fazemos decisões exclusivamente automatizadas com efeitos jurídicos ou semelhantes, nem perfis de publicidade. O serviço não é dirigido a crianças. Os dados de conta são necessários para autenticar e sincronizar; a fotografia do animal é opcional.</p>
      <h2>8. Alterações e legislação</h2><p>Esta política enquadra-se no Regulamento (UE) 2016/679 (RGPD), na Lei n.º 58/2019 e, quanto ao armazenamento no dispositivo, na Lei n.º 41/2004, nas redações aplicáveis. Alterações materiais serão comunicadas de modo adequado antes de produzir efeitos quando necessário. A data de versão encontra-se no topo desta página.</p>`],
    "terms.html": ["Termos de utilização", `
      <h2>1. Serviço e contacto</h2>${contact}<p>O PetStay é uma ferramenta de gestão de hotéis para animais. Estes termos regulam o acesso ao software; não substituem os contratos entre um hotel e os tutores. A versão atual não constitui um serviço de faturação certificada nem de processamento de pagamentos.</p>
      <h2>2. Conta e utilização</h2><p>O utilizador deve ser adulto e estar autorizado a gerir os registos que introduz. Deve manter as credenciais seguras, fornecer informação correta e comunicar acessos suspeitos. Não pode usar o serviço para fins ilícitos, aceder a contas alheias ou comprometer a segurança. Cada conta autentica o acesso ao respetivo hotel; não partilhe a conta para contornar controlos de acesso.</p>
      <h2>3. Dados do hotel</h2><p>O utilizador mantém os direitos sobre os conteúdos e autoriza o tratamento técnico necessário para guardar, sincronizar, apresentar e exportar os dados. É responsável por ter fundamento para tratar os dados dos tutores e publicar fotografias. Quando exista uma relação responsável/subcontratante, deve ser celebrado o acordo previsto no artigo 28.º do RGPD antes desse tratamento.</p>
      <h2>4. Disponibilidade e cópias</h2><p>O acesso inicial e a sincronização exigem internet. Alterações offline podem aguardar sincronização; confirme o estado antes de trocar de dispositivo. Conserve cópias privadas dos dados importantes e verifique os cálculos de reservas. Manutenção, falhas de rede e fornecedores podem afetar a disponibilidade. Não se promete disponibilidade ininterrupta.</p>
      <h2>5. Encerramento e responsabilidades</h2><p>Pode pedir o encerramento e a eliminação através do contacto de privacidade, sem prejuízo de retenções legalmente exigidas. Exporte os dados antes de encerrar. Acesso abusivo pode ser restringido proporcionalmente para proteger o serviço, com informação ao utilizador quando possível. O operador responde nos termos da lei; estes termos não excluem direitos ou responsabilidades que legalmente não possam ser afastados.</p>
      <h2>6. Condições futuras e lei aplicável</h2><p>Qualquer oferta comercial futura deve indicar previamente preço, duração, renovação, cancelamento e direitos aplicáveis; estes termos não autorizam cobranças nem renovações automáticas. Alterações materiais serão comunicadas adequadamente. Aplica-se a lei portuguesa, sem afastar normas imperativas e direitos dos consumidores aplicáveis, incluindo quanto à lei e ao tribunal competentes.</p>
      <p>A <a href="privacy.html">política de privacidade</a> explica o tratamento de dados. A abertura comercial depende da identificação completa do prestador e da avaliação das obrigações fiscais, de informação e de resolução de litígios aplicáveis ao modelo escolhido.</p>`],
    "cookies.html": ["Cookies e armazenamento no dispositivo", `
      <p>O PetStay utiliza armazenamento local para autenticação, preferências escolhidas e funcionamento offline. A versão atual não integra Google Analytics nem publicidade. Não carregamos o fluxo OAuth Google até o utilizador pedir esse início de sessão.</p>
      <table><thead><tr><th>Tecnologia</th><th>Finalidade e duração</th></tr></thead><tbody>
      <tr><td>Firebase Authentication / localStorage ou IndexedDB</td><td>Manter a sessão solicitada. Persiste entre visitas até terminar a sessão ou limpar os dados; os tokens são renovados pelo fornecedor.</td></tr>
      <tr><td>IndexedDB por conta</td><td>Rascunhos, cópias de recuperação e dados offline. Pode permanecer após terminar sessão, até limpeza explícita dos dados do dispositivo.</td></tr>
      <tr><td>localStorage de idioma e aparência</td><td>Guardar as preferências escolhidas, até alteração ou limpeza do armazenamento.</td></tr>
      <tr><td>Cache Storage / service worker (PWA)</td><td>Guardar a aplicação para uso offline; substituído nas atualizações ou removido ao limpar os dados do site.</td></tr>
      <tr><td>Ficheiros na versão de computador e exportações</td><td>Dados locais e backups sob controlo do utilizador; permanecem até remoção explícita.</td></tr>
      </tbody></table>
      <p>O armazenamento estritamente necessário ao serviço expressamente solicitado beneficia da exceção de consentimento do artigo 5.º da Lei n.º 41/2004. Esta exceção não permite analítica, publicidade ou outras finalidades opcionais. Se forem introduzidas, devem ser avaliadas e, quando exigido, bloqueadas até consentimento livre e específico, com recusa e retirada igualmente acessíveis.</p>
      <p>Ao escolher Google, interage com os serviços de autenticação desse fornecedor e os seus mecanismos de sessão. Consulte as <a href="https://policies.google.com/technologies/cookies">informações Google sobre cookies</a>. A utilização do Google para autenticação não autoriza o PetStay a utilizar rastreadores de publicidade.</p>
      <p>Pode terminar sessão e limpar dados nas definições do navegador ou da aplicação. Exporte alterações e confirme a sincronização antes: limpar armazenamento pode perder rascunhos offline e não elimina os dados guardados na nuvem. Consulte a <a href="privacy.html">política de privacidade</a> para pedir eliminação completa.</p>`],
    "rights.html": ["Direitos e pedidos de privacidade", `
      ${contact}<p>Para pedir acesso, correção, exportação, limitação, oposição ou eliminação, contacte o responsável através do email de privacidade indicado acima. Indique o email da conta, o pedido e os dados necessários para o localizar. Não envie palavras-passe, tokens, cópias completas de documentos de identificação ou dados desnecessários.</p>
      <p>Se é tutor e um hotel registou os seus dados, contacte esse hotel. O operador do PetStay deve encaminhar e apoiar os pedidos relativos aos dados tratados por conta do hotel.</p>
      <h2>Exportar e corrigir</h2><p>Na aplicação, use «Dados e cópias» para exportar os registos do hotel. Corrija os dados de hóspedes e reservas nos respetivos editores. A exportação do hotel não inclui todos os dados de autenticação ou logs do fornecedor: peça-os ao contacto de privacidade quando necessário.</p>
      <h2>Eliminar conta e dados</h2><p>A eliminação completa é atualmente um processo assistido pelo operador. Peça expressamente a eliminação da conta e dos dados associados. O processo deve abranger Firebase Authentication, registos e versões no Firestore, cópias de recuperação e caches sob controlo do operador. Será informado de qualquer retenção legal necessária e do respetivo prazo. As cópias em dispositivos e exportações sob o seu controlo devem ser apagadas por si.</p>
      <p>Não existe atualmente um botão de eliminação automática da conta. Terminar sessão, cancelar reservas ou revogar a ligação Google não equivale a eliminar todos os dados. Pode rever as ligações na <a href="https://myaccount.google.com/connections">sua conta Google</a>.</p>
      <p>A resposta é devida em regra no prazo de um mês, com as exceções e extensões previstas no RGPD. Pode reclamar à <a href="https://www.cnpd.pt/">CNPD</a>. Durante a fase de rascunho, o canal de pedidos ainda necessita de configuração antes de aceitar utilizadores externos.</p>`],
  };
  return Object.fromEntries(Object.entries(content).map(([filename, [title, body]]) => [
    `legal/${filename}`,
    `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer">${draft ? '<meta name="robots" content="noindex">' : ''}<title>${title} | PetStay</title><link rel="stylesheet" href="legal.css"></head><body><main><header><a href="index.html">PetStay</a>${links}</header><h1>${title}</h1><p class="version">Versão: ${escape(operator.updated)}</p>${draft ? '<aside role="note"><strong>Rascunho — serviço em utilização privada.</strong> Estes documentos ainda não estão prontos para lançamento público ou submissão final à Google. Faltam identificação, contactos ou decisões operacionais do prestador.</aside>' : ''}${body}<footer>${links}<p><a href="../">Voltar à aplicação</a></p></footer></main></body></html>`,
  ]).concat([["legal/legal.css", `:root{font-family:system-ui,sans-serif;color:#263426;background:#f8f9f5}*{box-sizing:border-box}body{margin:0}main{max-width:850px;margin:auto;padding:28px 22px;line-height:1.75;overflow-wrap:anywhere}h1{line-height:1.2;font-size:2rem}h2{font-size:1.25rem;margin-top:2rem}a{color:#365a2d;text-underline-offset:3px}nav{display:flex;flex-wrap:wrap;gap:8px 20px;margin:16px 0}aside{padding:18px;border:1px solid #b57a22;border-radius:12px;background:#fff2d8}mark{background:#fff2d8}table{width:100%;border-collapse:collapse}td,th{text-align:left;border:1px solid #c9d2c6;padding:10px;vertical-align:top}footer{border-top:1px solid #c9d2c6;margin-top:36px}.version{color:#586453}a:focus-visible{outline:3px solid #365a2d;outline-offset:4px}@media print{nav,footer{display:none}main{max-width:none}}`]]));
}

export function legalPagesPlugin(): Plugin {
  const pages = () => renderLegalPages(JSON.parse(readFileSync(new URL("../legal/operator.json", import.meta.url), "utf8")) as LegalOperator);
  return {
    name: "petstay-legal-pages",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = new URL(request.url ?? "/", "http://localhost").pathname;
        const key = path.slice(path.lastIndexOf("/legal/") + 1);
        if (!path.includes("/legal/") || !Object.hasOwn(pages(), key)) return next();
        response.setHeader("Content-Type", key.endsWith(".css") ? "text/css; charset=utf-8" : "text/html; charset=utf-8");
        response.end(pages()[key]);
      });
    },
    generateBundle() {
      for (const [fileName, source] of Object.entries(pages())) this.emitFile({ type: "asset", fileName, source });
    },
  };
}
