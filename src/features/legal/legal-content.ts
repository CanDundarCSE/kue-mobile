export type LegalTable = {
  headers: string[];
  rows: string[][];
};

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: LegalTable;
};

export type LegalDocumentContent = {
  label: string;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

export type LegalDocumentKey = "privacy" | "terms" | "cookies";

/**
 * Bump this whenever the Privacy Policy or Terms of Service change in a way
 * that matters. It is stored on the user row (User.TermsVersion) so we can
 * prove which version a person actually accepted. Keep it in sync with
 * `LegalVersion.Current` on the backend.
 */
export const LEGAL_VERSION = "2026-10-19";

export const PRIVACY_POLICY: LegalDocumentContent = {
  label: "Legal \u2014 Privacy",
  title: "Privacy Policy",
  lastUpdated: "19 October 2026",
  intro:
    "This Privacy Policy explains how Kue collects, uses, stores and protects your personal data, and the rights you have under Turkish Law No. 6698 on the Protection of Personal Data (\u201cKVKK\u201d). Please read it together with our Terms of Service.",
  sections: [
    {
      heading: "1. Who we are",
      paragraphs: [
        "Kue is a free, non-commercial entertainment tracking project operated by Can D\u00fcndar, an individual developer based in T\u00fcrkiye. Under the KVKK, Can D\u00fcndar is the data controller (\u201cveri sorumlusu\u201d) for the personal data described in this policy.",
        "You can reach the data controller for any question or request about your data at candundarcse@gmail.com.",
      ],
    },
    {
      heading: "2. Data we collect and why",
      paragraphs: [
        "We keep data collection to the minimum needed to run the service. Where the KVKK requires a legal basis for processing, we rely on the performance of the service you asked for, our legitimate interest in keeping the service secure, and our obligation to be able to demonstrate compliance.",
      ],
      bullets: [
        "Account data: username, email address and password hash. Your password is never stored in plain text.",
        "Profile data you choose to add: display bio, avatar selection and profile privacy setting.",
        "Content you create: library entries, statuses, progress, ratings, custom lists, reviews and mini-game results.",
        "Technical and security data: session tokens that keep you signed in, and the IP address used to issue, rotate and protect those sessions and to rate-limit abusive requests.",
        "Consent records: the fact that you accepted this Privacy Policy and the Terms of Service, the version you accepted, and the date and time (UTC).",
        "Transactional email data: your email address and the content of a password-reset message, when you request one.",
      ],
    },
    {
      heading: "3. How we use your data",
      paragraphs: [
        "We use your personal data only to run the service, and we do not sell it, rent it, or use it for advertising or profiling.",
      ],
      bullets: [
        "Authentication and account security: to create your account, sign you in, rotate sessions, and detect abuse such as credential-stuffing or refresh-token replay.",
        "Providing your profile and library: to show you your own data and, subject to your privacy settings, to show it to other users or to visitors.",
        "Communications you request: to send transactional emails such as password-reset links.",
      ],
    },
    {
      heading: "4. Cookies and sessions",
      paragraphs: [
        "Kue uses only essential and preference cookies. A short-lived access token and a longer-lived refresh token are stored in HttpOnly cookies, which means they cannot be read by client-side scripts. A single preference cookie remembers whether your sidebar is collapsed. We do not use advertising, analytics or third-party tracking cookies, so no cookie-consent banner is needed.",
        "You can clear these cookies at any time through your browser settings; doing so signs you out.",
      ],
    },
    {
      heading: "5. Sharing and transfers abroad",
      paragraphs: [
        "We do not sell your personal data and we do not share it for marketing. Limited data is processed by the providers that keep the service running:",
      ],
      bullets: [
        "Email delivery: Brevo, based in France, receives your email address and the content of the message so that password-reset emails can be sent.",
        "Hosting and database: our application and database hosting providers store your account and content data so the service can operate.",
        "Media catalogues: TMDB, AniList and IGDB provide movie, anime and game metadata. These requests are for catalogue data and are not used to build advertising profiles of you.",
      ],
    },
    {
      heading: "6. Transfers abroad and the safeguards we rely on",
      paragraphs: [
        "Some of the providers above are located outside T\u00fcrkiye. Where that is the case, the transfer takes place under Article 9 of the KVKK. Because no adequacy decision (\u201cyeterlilik karar\u0131\u201d) currently covers these providers, we rely on the transfer mechanisms Article 9 permits \u2014 such as the standard contractual commitments offered by those providers \u2014 and on your explicit consent where the law requires it.",
        "Transfers are limited to what is strictly necessary for the purpose described, and we do not transfer special-category data because we do not collect any.",
      ],
    },
    {
      heading: "7. Data security",
      paragraphs: [
        "We take the security of your data seriously:",
      ],
      bullets: [
        "Passwords are securely hashed using a salted, industry-standard password-hashing algorithm (PBKDF2 with HMAC-SHA512 via ASP.NET Core Identity). Your plain-text password is never stored, logged or recoverable.",
        "All traffic between your browser and Kue is encrypted in transit over SSL/TLS (HTTPS).",
        "Access tokens are short-lived and refresh tokens are rotated, stored only as hashes, and revoked automatically if a reused (replayed) token is detected.",
        "Administrative access is restricted and audited.",
      ],
    },
    {
      heading: "8. Data breach notification",
      paragraphs: [
        "If a breach of personal data occurs, we will notify the Personal Data Protection Authority within 72 hours of becoming aware of it, as required by Article 12 of the KVKK, and we will notify affected users without undue delay where the breach is likely to affect them.",
      ],
    },
    {
      heading: "9. Data retention and deletion",
      paragraphs: [
        "Account data and the content you create are kept for as long as your account exists. Security logs and expired session records are kept only as long as needed for abuse detection and are then deleted or anonymised. Consent records are kept for as long as the account exists, so we can demonstrate that consent was given.",
        "When you delete your account, your account and associated content are permanently removed from our active database. Some information may remain temporarily in backups or security logs and will be deleted according to our retention schedule, unless retention is required by law. Account deletion cannot be undone.",
      ],
    },
    {
      heading: "10. Your rights under the KVKK",
      paragraphs: [
        "Under Article 11 of the KVKK you have the right to:",
      ],
      bullets: [
        "learn whether your personal data is being processed, and request information about it;",
        "learn the purpose of the processing and whether it is used in line with that purpose;",
        "know the third parties to whom your data is transferred, at home or abroad;",
        "request correction of incomplete or inaccurate data;",
        "request deletion or destruction of your data, and request that this be notified to third parties who received it;",
        "object to a result that is to your detriment arising from analysis of your data exclusively by automated systems;",
        "claim compensation for damage caused by unlawful processing.",
      ],
    },
    {
      heading: "11. How to exercise your rights",
      paragraphs: [
        "You can exercise most of these rights directly in the product: update your username, email, bio, avatar and privacy settings at any time from Settings, and delete your account at any time from Settings \u2192 Delete my account.",
        "For anything else, write to candundarcse@gmail.com. We will respond within 30 days at the latest, as required by the KVKK, free of charge.",
        "If you are not satisfied with our response, you may lodge a complaint with the Personal Data Protection Authority (\u201cKi\u015fisel Verileri Koruma Kurulu\u201d) through the KVKK website, kvkk.gov.tr. You may also complain directly to the Kurul if we fail to respond within the statutory period.",
      ],
    },
    {
      heading: "12. Children",
      paragraphs: [
        "Kue is not directed to children. You must be at least 18 years old, or the age of legal majority in your country, to create an account. We do not knowingly collect personal data from children; if you believe a child has created an account, contact us and we will remove it.",
      ],
    },
    {
      heading: "13. Changes to this policy",
      paragraphs: [
        "We may update this policy to reflect changes to the service or the law. When we make a material change we will update the \u201cLast updated\u201d date above, record a new version number, and ask you to review and accept the updated policy the next time you use Kue. Continued use of Kue after a change means you accept the updated policy.",
      ],
    },
    {
      heading: "14. Contact",
      paragraphs: [
        "Questions about this policy, or any request about your data, can be sent to Can D\u00fcndar at candundarcse@gmail.com. Reports about content posted by other users can be sent to the same address and will be reviewed promptly.",
      ],
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDocumentContent = {
  label: "Legal Terms",
  title: "Terms of Service",
  lastUpdated: "19 October 2026",
  intro:
    "These Terms of Service set out the rules for using Kue, a free, non-commercial hobby project. By creating an account you agree to them, so please read them carefully before you continue.",
  sections: [
    {
      heading: "1. Acceptance of these terms",
      paragraphs: [
        "These Terms of Service (\u201cTerms\u201d) govern your access to and use of Kue. By creating an account or using the service, you confirm that you have read, understood and agree to be bound by these Terms and by our Privacy Policy. If you do not agree, you must not use Kue.",
        "Kue is provided free of charge by Can D\u00fcndar as a personal, non-commercial project. No fee is charged, no subscription is sold, and nothing in these Terms creates a commercial relationship between you and the operator.",
      ],
    },
    {
      heading: "2. Your account",
      bullets: [
        "You must be at least 18 years old, or the age of legal majority in your country, to create an account.",
        "You must provide accurate registration information and keep your password confidential.",
        "You are responsible for all activity that happens under your account. Tell us promptly if you believe it has been compromised.",
        "You may not impersonate another person, or create an account to evade a suspension or ban.",
      ],
    },
    {
      heading: "3. Acceptable use",
      paragraphs: [
        "Kue is a place for tracking and talking about the things you watch, play and read. You agree not to:",
      ],
      bullets: [
        "break the law, or infringe anyone else\u2019s rights, including copyright, defamation and privacy rights;",
        "harass, threaten, stalk, or abuse other users;",
        "post content that is unlawful, hateful, sexually exploitative, or that incites violence;",
        "attempt to access accounts or data that are not yours, or probe, scan or overload the service;",
        "scrape the service or its underlying catalogues at scale, or use automated means to abuse rate limits;",
        "upload malware or attempt to interfere with the operation of the service.",
      ],
    },
    {
      heading: "4. Your content",
      paragraphs: [
        "You keep ownership of the content you create \u2014 your library entries, lists, ratings, reviews and profile information. You grant Kue a limited, non-exclusive, royalty-free licence to store, display and process that content solely to operate and provide the service. You are responsible for ensuring you have the right to post what you post.",
        "You control who can see your profile and library through your privacy settings. Content you mark as public may be visible to other users and to visitors, and may be indexed by search engines.",
      ],
    },
    {
      heading: "5. Content posted by others",
      paragraphs: [
        "Kue hosts content uploaded by its users and does not review it before publication. Views expressed in reviews are those of their authors and not of Kue.",
        "If you believe content on Kue is unlawful, defamatory, infringing or otherwise violates these Terms, report it to candundarcse@gmail.com with a link to the content and a short explanation. We will review the report and remove or restrict content that we consider to be unlawful or in breach of these Terms, without undue delay. As a hosting provider within the meaning of Law No. 5651, we are not liable for third-party content we have not been notified about, and we will act on notices we receive.",
      ],
    },
    {
      heading: "6. Indemnity",
      paragraphs: [
        "You agree to indemnify and hold harmless the operator of Kue from any claim, loss, liability or reasonable cost (including reasonable legal fees) arising out of content you post, your use of the service, or your breach of these Terms or of any law or third-party right. This does not apply to the extent the claim results from our own unlawful conduct.",
      ],
    },
    {
      heading: "7. Third-party services and metadata",
      paragraphs: [
        "Media metadata such as covers, titles and descriptions is provided by third parties including TMDB, AniList and IGDB. Kue is not affiliated with, endorsed by, or sponsored by these services. Their terms may also apply to your use of that metadata.",
        "This product uses the TMDB API but is not endorsed or certified by TMDB.",
      ],
    },
    {
      heading: "8. Deleting your account and termination",
      bullets: [
        "You can delete your account at any time from Settings \u2192 Delete my account. Your account and associated content are permanently removed from our active database; some information may remain temporarily in backups or security logs and will be deleted according to our retention schedule unless retention is required by law. Account deletion cannot be undone.",
        "We may suspend or terminate an account that violates these Terms or that we reasonably believe creates risk for other users or for the service.",
      ],
    },
    {
      heading: "9. Availability and disclaimers",
      paragraphs: [
        "Kue is a free personal project. It is provided \u201cas is\u201d and \u201cas available\u201d, without warranties of any kind, whether express or implied, including fitness for a particular purpose. We do not warrant that the service will be uninterrupted, error-free, or that metadata will always be accurate or complete. We may change, suspend or discontinue the service, in whole or in part, at any time without notice.",
        "Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law, including liability for death or personal injury caused by negligence, for gross negligence or wilful misconduct, or under the Consumer Protection Law where it applies.",
      ],
    },
    {
      heading: "10. Limitation of liability",
      paragraphs: [
        "To the maximum extent permitted by law, the operator of Kue will not be liable for any indirect, incidental, special or consequential damages, or for any loss of data, arising out of or relating to your use of the service. Nothing in these Terms limits liability that cannot be limited by law.",
      ],
    },
    {
      heading: "11. Changes to these terms",
      paragraphs: [
        "We may update these Terms from time to time. When we do, we will update the \u201cLast updated\u201d date above and record a new version number. Where the change is material, we will ask you to review and accept the updated Terms the next time you use Kue. Your continued use of Kue after a change means you accept the updated Terms.",
      ],
    },
    {
      heading: "12. Governing law and jurisdiction",
      paragraphs: [
        "These Terms are governed by the laws of the Republic of T\u00fcrkiye. Any dispute arising out of or in connection with these Terms or the service is subject to the jurisdiction of the courts of Istanbul, T\u00fcrkiye, except where mandatory consumer protection rules give you the right to bring proceedings elsewhere.",
      ],
    },
    {
      heading: "13. General",
      paragraphs: [
        "If any provision of these Terms is found to be invalid or unenforceable, that provision will be limited or removed to the minimum extent necessary and the remaining provisions will stay in full force. Our failure to enforce a provision is not a waiver of it. These Terms, together with the Privacy Policy, are the entire agreement between you and the operator regarding the service.",
      ],
    },
    {
      heading: "14. Contact",
      paragraphs: [
        "Questions about these Terms, or reports about content, can be sent to Can D\u00fcndar at candundarcse@gmail.com.",
      ],
    },
  ],
};

export const COOKIE_POLICY: LegalDocumentContent = {
  label: "Legal \u2014 Cookies",
  title: "Cookie Policy",
  lastUpdated: "19 October 2026",
  intro:
    "This Cookie Policy explains which cookies and similar technologies Kue uses, why we use them, and how you can control them. It should be read together with our Privacy Policy and Terms of Service.",
  sections: [
    {
      heading: "1. Who we are",
      paragraphs: [
        "Kue is operated by Can D\u00fcndar, an individual developer based in T\u00fcrkiye, who is the data controller for the personal data described here. You can reach us at candundarcse@gmail.com.",
      ],
    },
    {
      heading: "2. What cookies and local storage are",
      paragraphs: [
        "A cookie is a small text file that a website stores in your browser. It can be used to keep you signed in, remember a preference, or recognise your browser on a later visit. Local storage is a similar browser feature that stores data without sending it with every request.",
        "Some cookies are essential for a service to work at all. Others are optional and are used for preferences, analytics or advertising.",
      ],
    },
    {
      heading: "3. Our approach",
      paragraphs: [
        "Kue uses only the cookies needed to keep you signed in and to remember how you like the interface. We do not use advertising, analytics or third-party tracking cookies, and we do not follow you across other websites.",
        "Because we set no optional tracking cookies, Kue does not show a cookie-consent banner. The cookies described below are either strictly necessary to provide the service you asked for, or store a display preference on your own device.",
      ],
    },
    {
      heading: "4. Cookies we set",
      paragraphs: [
        "The following first-party cookies may be stored in your browser:",
      ],
      table: {
        headers: ["Name", "Purpose", "Category", "Duration"],
        rows: [
          [
            "accessToken",
            "Keeps you signed in and authorises requests to the Kue API. Stored as HttpOnly and SameSite=Lax, and marked Secure on HTTPS.",
            "Strictly necessary",
            "15 minutes",
          ],
          [
            "refreshToken",
            "Renews your session so you do not have to sign in again. Scoped to the /api/auth path, HttpOnly, SameSite=Lax, and marked Secure on HTTPS.",
            "Strictly necessary",
            "7 days",
          ],
          [
            "kue_sidebar_collapsed",
            "Remembers whether you collapsed the sidebar. Stores only true or false \u2014 no personal data.",
            "Preference",
            "1 year",
          ],
        ],
      },
    },
    {
      heading: "5. Local storage we use",
      paragraphs: [
        "Kue also stores the following values in your browser's local storage. These are not sent with every request and are not used to identify you.",
      ],
      table: {
        headers: ["Key", "Purpose", "Category", "Duration"],
        rows: [
          [
            "kue-theme",
            "Remembers whether you chose the light or dark theme.",
            "Preference",
            "Until you clear it",
          ],
          [
            "kue_sidebar_collapsed",
            "Mirrors the sidebar preference so the layout loads in the right state. Stores only true or false \u2014 no personal data.",
            "Preference",
            "Until you clear it",
          ],
        ],
      },
    },
    {
      heading: "6. What we do not use",
      paragraphs: [
        "To be explicit, Kue does not use:",
      ],
      bullets: [
        "advertising or retargeting cookies;",
        "analytics or session-replay tools (for example Google Analytics, Plausible or Hotjar);",
        "social media pixels or share-tracking scripts;",
        "cross-site tracking, fingerprinting or profiling;",
        "cookies that sell or share your data with data brokers.",
      ],
    },
    {
      heading: "7. Third-party services",
      paragraphs: [
        "Media metadata is fetched by our server from TMDB, AniList and IGDB. Those requests are made by Kue's backend, not by your browser, so those services do not set cookies on Kue pages.",
        "Password-reset emails are delivered through Brevo, based in France, which receives your email address and the message content when you request a reset. Our hosting and database providers process data on our behalf to run the service. None of these providers set advertising or tracking cookies on Kue.",
      ],
    },
    {
      heading: "8. Legal basis",
      paragraphs: [
        "Under the KVKK, strictly necessary cookies are processed because they are required to provide the service you asked for (Art. 5/2(c)) and to keep it secure (Art. 5/2(f)). Preference values are stored on your device to remember a choice you made and are not used to track you.",
      ],
    },
    {
      heading: "9. How to control or delete cookies",
      paragraphs: [
        "You can view, block or delete cookies and local storage at any time through your browser settings. The exact steps are in your browser's help pages.",
        "If you block or delete the access and refresh cookies, you will be signed out and will need to sign in again. Clearing the preference values only resets the theme and sidebar to their defaults; the rest of Kue keeps working.",
        "You can also use a private browsing window to avoid persistent local storage between sessions.",
      ],
    },
    {
      heading: "10. Your rights",
      paragraphs: [
        "Because cookies and local storage can be linked to your account, the rights in our Privacy Policy apply. Under Article 11 of the KVKK you may ask whether your data is processed, request information, correction or deletion, and object to unlawful processing. Write to candundarcse@gmail.com and we will respond within 30 days at the latest.",
        "If you are not satisfied with our response, you may complain to the Personal Data Protection Authority (\u201cKi\u015fisel Verileri Koruma Kurulu\u201d) through kvkk.gov.tr.",
      ],
    },
    {
      heading: "11. Changes to this policy",
      paragraphs: [
        "We may update this Cookie Policy when the cookies we use or the law change. We will update the \u201cLast updated\u201d date and the version number, and ask you to review material changes the next time you use Kue.",
      ],
    },
    {
      heading: "12. Contact",
      paragraphs: [
        "Questions about cookies or this policy can be sent to Can D\u00fcndar at candundarcse@gmail.com.",
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS: Record<LegalDocumentKey, LegalDocumentContent> = {
  privacy: PRIVACY_POLICY,
  terms: TERMS_OF_SERVICE,
  cookies: COOKIE_POLICY,
};
