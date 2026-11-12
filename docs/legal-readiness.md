# PetStay: Google login and Portuguese/EU privacy readiness

Prepared 12 November 2026. This is an implementation and launch checklist, not
confirmation of legal compliance or Google approval. The service currently has
one private user. The intended future operator is the developer personally, not
the current user by default. Do not publish the user's identity as the operator.

## What is implemented

The Vite build emits standalone, script-free HTML pages, available without an
account in web, desktop and Android builds:

- `legal/index.html`: product description and operator information.
- `legal/privacy.html`: privacy notice for accounts and hosted records.
- `legal/terms.html`: terms of use.
- `legal/cookies.html`: authentication, preferences, caches and local copies.
- `legal/rights.html`: rights requests and assisted account/data deletion.

Links appear before Google/email authentication, in the desktop browser helper,
and in the signed-in account bar. Page content is currently Portuguese; UI link
labels follow the app language. No blanket GDPR consent checkbox or advertising
cookie banner is added. The inspected app has no analytics/advertising SDK.
Reassess before adding any tracking or changing suppliers.

## Complete the operator information

Edit [`legal/operator.json`](../legal/operator.json), then rebuild. All values in
this file are public. Do not put secrets or unnecessary personal data here.

- `name`: the actual full legal name of the individual operating the service.
- `address`: a valid contact/service address meeting applicable disclosure rules.
- `privacyEmail`, `supportEmail`: monitored addresses; they can be the same.
- `publicUrl`: final public HTTPS application URL, including any subdirectory.
- `hostingProvider`: actual public host and relevant processing role, verified
  against deployment (do not assume that a Firebase app uses Firebase Hosting).
- `firestoreLocation`: actual database region from the Firebase console.
- `retentionPolicy`: concrete retention periods/criteria for account data,
  records, security logs, recovery versions, orphaned uploads and backups, plus
  request/closure deletion times. Do not promise an automated purge that is not
  implemented. Establish and test the manual process first.
- `updated`: policy version date; change it with substantive policy changes.
- `status`: keep `draft` until all operational and legal decisions are reviewed;
  only then set `published`. Missing required fields keep the draft banner even
  if status is changed. The banner is a publication safeguard, not certification.

Private/family use does not automatically exempt a hotel business's customer
records from GDPR. Before opening the service to others, confirm the controller
and processor roles with Portuguese legal advice. The hotel normally controls
its tutor/booking records; the SaaS operator normally processes these on its
instructions, while controlling service account and security data.

## Google Auth Platform / Firebase setup

1. Deploy the pages at a public HTTPS origin you control. Verify the ownership
   required by Google (normally Search Console). Existing GitHub Pages hosting
   must be checked for verification eligibility; a domain you own is preferable
   for a public service. A local desktop URL is not the public policy URL.
2. Confirm the pages return HTTP 200 without login, cookies, geofencing or an
   app installation. Check mobile and desktop. Do not submit draft pages.
3. In Google Cloud **Google Auth Platform → Branding**, configure PetStay's name,
   support email, homepage (`<publicUrl>/legal/index.html`), privacy policy
   (`<publicUrl>/legal/privacy.html`) and terms
   (`<publicUrl>/legal/terms.html`). Avoid duplicate slashes if publicUrl ends `/`.
   Add the production domain to Authorized Domains and verify it as requested.
4. Configure **Audience** appropriately. During testing, add the current user's
   Google account as an allowed test user where required. Choose the production
   audience and publishing state when ready. Branding verification and sensitive
   scope verification are different processes; do not assume a basic login needs
   restricted-scope review or that publishing guarantees approval.
5. Keep **Data Access** to the default Google sign-in identity scopes
   (`openid`, `email`, `profile`). The current code adds no Gmail/Drive scopes.
   Reassess verification and policy disclosures before adding Google APIs.
6. Configure the Firebase Google provider, authorized web domains, OAuth clients
   and Android package/signing fingerprints as described in
   [Firebase authentication](firebase-auth.md) and [Android](android.md).
   Keep development and production projects separated where practical.
7. Test real sign-in on the public origin and packaged platforms with the
   current test user. Automated tests mock Firebase and cannot prove approval.

## GDPR work required before public launch

- Confirm the processing purposes, lawful bases and controller contact notice
  under Articles 13/14. Do not treat reading a notice as consent. If relying on
  legitimate interests, document the balancing assessment. Assess whether a DPO
  or DPIA is required; neither is automatic just because Google login exists.
- Review/accept the applicable Google/Firebase and hosting data-processing terms.
  Confirm subprocessors, actual regions, support access and transfer mechanisms.
  An EU Firestore region alone does not mean all Firebase processing stays in EU.
- Execute an Article 28 agreement with each independent hotel before processing
  its records. Use the [working draft](data-processing-agreement.md) as a starting
  point for legal review, not as an executed agreement.
- Maintain processing records (Article 30 where applicable): activity, parties,
  purposes, categories of people/data, bases, recipients, transfers, deletion
  schedule and security measures. The small-business exception is conditional;
  regular hosted processing should be assessed rather than assumed exempt.
- Operate monitored rights and security channels. Track request date, identity
  checks, scope, outcome and statutory deadline; normally respond within one
  month. Record permitted extensions/reasons and communicate them in time.
- Establish a breach procedure: triage, containment, evidence, impact and risk
  assessment. Notify the authority within 72 hours of awareness when required;
  communicate to affected people where required. As processor, notify the hotel
  without undue delay. Keep a breach record even when notification is not needed.
- Protect production administration: MFA, least privilege, separate staff access,
  tested Firestore rules, secret management, secured backups, updates and an
  incident contact. Review local caches and OS profiles on shared devices.
- Define and test retention/deletion, including the procedure below. Exporting
  a hotel JSON is useful but not a complete account-data access response.
- Review public-service terms, identity/trader disclosures, tax/business status,
  consumer information and dispute-resolution requirements for the eventual
  free/paid business model. If charging, add the applicable price, renewal,
  cancellation and withdrawal disclosures before accepting orders. Assess
  Portuguese complaints-book/ADR duties where applicable. These depend on the
  business model and cannot be finalized by the sign-in implementation.
- For Google Play distribution, separately review current Data safety,
  privacy-policy and account-deletion requirements. A manual email process alone
  should not be assumed sufficient for store distribution. Do not claim an
  in-app deletion feature that is not present.

## Assisted deletion runbook (implement and rehearse before public use)

The app has no automatic account-deletion button. Do not delete production data
without the account holder's authorized request and appropriate identity checks.

1. Locate the Firebase UID from the verified requester. For hotel records,
   establish the hotel's instructions and any lawful retention restrictions.
   Offer an export and explain consequences without obstructing the request.
2. Coordinate other devices and pending offline edits. Prevent the closing
   account from re-uploading old snapshots. Revoke sessions/disable access as
   appropriate before deleting cloud data; do not reopen an emptied account.
3. Remove the complete Firestore `owners/<uid>` hierarchy with a trusted admin
   process, including nested collections, current/previous/recovery snapshot
   pieces and orphaned pieces. Deleting only the parent document is insufficient.
   Inspect the current storage schema; do not rely on this document as a script.
4. Delete the Firebase Authentication user and handle provider retention under
   the current applicable terms. This does not remove their Google account.
5. Cover operator-held desktop account files, migration sources, recovery files,
   backups, support correspondence and logs according to the verified request,
   applicable obligations and documented schedule. Inform users how to clear
   local IndexedDB, browser/PWA data, Android data and exported files they control.
6. Record completion, any justified retained subset and expiry, and tell the
   requester what was done. Test that the closed UID cannot restore records.

## Official sources checked

- [Google OAuth policies](https://developers.google.com/identity/protocols/oauth2/policies)
- [Google app branding](https://support.google.com/cloud/answer/15549049?hl=en)
- [GDPR text](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679)
- [CNPD rights](https://www.cnpd.pt/cidadaos/direitos/)
- [CNPD cookie notice](https://www.cnpd.pt/media/x2zdus50/nota-informativa-cnpd_cookies_20210625.pdf)
- [Firebase privacy and security](https://firebase.google.com/support/privacy)
- [Firebase data-processing terms](https://firebase.google.com/terms/data-processing-terms/)
- [Google Play account-deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)

Recheck the actual console configuration, laws and provider policies at launch.
