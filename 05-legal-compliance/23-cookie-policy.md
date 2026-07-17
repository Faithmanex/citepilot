# Cookie Policy

**CitePilot — AI-Powered Citation Consistency Checker**

**Effective Date:** July 14, 2026
**Last Updated:** July 14, 2026

---

This Cookie Policy explains how CitePilot Ltd ("Company," "we," "us," or "our") uses cookies and similar tracking technologies when you visit and use the CitePilot platform ("the Service") at citepilot.com. This policy should be read alongside our [Privacy Policy](/privacy-policy).

---

## 1. What Are Cookies?

Cookies are small text files placed on your device (computer, tablet, or mobile phone) by websites you visit. They are widely used to make websites work efficiently, provide a better user experience, and supply information to site operators.

Cookies can be "first-party" (set by the website you are visiting) or "third-party" (set by a service used by that website). Cookies can also be "session" cookies (deleted when you close your browser) or "persistent" cookies (remaining on your device for a set period or until you delete them).

In addition to cookies, we may use similar technologies including local storage (localStorage/sessionStorage), pixel tags, and web beacons. References to "cookies" in this policy include all such technologies.

## 2. Cookie Consent

When you first visit citepilot.com, you will be presented with a cookie consent banner that allows you to:

- **Accept all cookies** — enables all cookie categories described below
- **Reject non-essential cookies** — enables only strictly necessary cookies
- **Customise preferences** — choose which categories of cookies to enable

Your consent preferences are stored in a first-party cookie (`cp_consent`) and can be changed at any time through the "Cookie Settings" link in the website footer or in your account settings.

We do not set any non-essential cookies until you have provided consent. Strictly necessary cookies do not require consent and are always active.

## 3. Cookie Categories

### 3.1. Strictly Necessary Cookies

These cookies are essential for the Service to function. They enable core features such as authentication, security, and session management. Without these cookies, the Service cannot operate. These cookies do not require your consent.

| Cookie Name | Provider | Purpose | Type | Duration |
|-------------|----------|---------|------|----------|
| `cp_session` | citepilot.com | Maintains your authenticated session. Contains a cryptographically signed session identifier. | First-party, HTTP-only, Secure | Session (expires on browser close) |
| `cp_csrf` | citepilot.com | Protects against cross-site request forgery (CSRF) attacks by embedding a unique token in each form submission. | First-party, HTTP-only, Secure | Session |
| `cp_consent` | citepilot.com | Stores your cookie consent preferences so we can respect your choices across visits. | First-party | 1 year |
| `__Host-next-auth.csrf-token` | citepilot.com | NextAuth.js CSRF protection token used during the authentication flow. | First-party, Secure | Session |
| `__Secure-next-auth.session-token` | citepilot.com | NextAuth.js session token that identifies your authenticated session. Encrypted and HTTP-only. | First-party, HTTP-only, Secure | 30 days |
| `__Secure-next-auth.callback-url` | citepilot.com | Stores the callback URL during OAuth authentication redirects (Google, Microsoft). | First-party, Secure | Session |
| `cp_rate_limit` | citepilot.com | Tracks upload count for free-tier rate limiting (3 uploads/day). | First-party | 24 hours |

### 3.2. Functional Cookies

These cookies enable enhanced functionality and personalisation. They remember your preferences and settings so you don't have to re-enter them on each visit. These cookies are set only with your consent.

| Cookie Name | Provider | Purpose | Type | Duration |
|-------------|----------|---------|------|----------|
| `cp_style_pref` | citepilot.com | Remembers your preferred citation style (e.g., APA 7, Harvard) so it is pre-selected on your next upload. | First-party | 1 year |
| `cp_view_pref` | citepilot.com | Remembers your preferred results view mode (single-column, split-window, annotated). | First-party | 1 year |
| `cp_theme` | citepilot.com | Stores your interface theme preference (light, dark, system). | First-party | 1 year |
| `cp_locale` | citepilot.com | Stores your language/locale preference for the interface. | First-party | 1 year |
| `cp_filter_state` | citepilot.com | Remembers your last-used filter settings in the results view (e.g., "show only issues," "filter by author"). | First-party, localStorage | Persistent (until cleared) |
| `cp_onboarding` | citepilot.com | Tracks whether you have completed the onboarding walkthrough so it is not shown again. | First-party | 1 year |

### 3.3. Analytics Cookies

These cookies help us understand how visitors interact with the Service. They collect information about page visits, feature usage, and user flows. All analytics data is processed by PostHog (hosted in the EU). These cookies are set only with your consent.

| Cookie Name | Provider | Purpose | Type | Duration |
|-------------|----------|---------|------|----------|
| `ph_phc_*` | PostHog (EU) | PostHog analytics identifier. Tracks anonymised usage events such as page views, button clicks, feature interactions, and conversion funnels. | First-party (set via PostHog JS SDK) | 1 year |
| `ph_*_posthog` | PostHog (EU) | PostHog session and device identification for analytics continuity across sessions. | First-party | 1 year |
| `cp_ab_group` | citepilot.com | Assigns you to an A/B test group for feature experiments (e.g., testing a new results layout). | First-party | 90 days |

**What PostHog collects (when consented):**
- Page URLs visited (without document content)
- Feature interactions (e.g., "clicked export PDF," "selected APA 7 style")
- Session duration and flow
- Device type, browser, and screen resolution
- Approximate geolocation (country/city level from IP, which is then discarded)
- Conversion events (e.g., free-to-paid upgrade, first upload completed)

**What PostHog does NOT collect:**
- Document content or any text from uploaded files
- Citation analysis results
- Personal identifiers (name, email) — users are identified by anonymised IDs
- Payment information

### 3.4. Marketing Cookies

We currently do not use marketing or advertising cookies. We do not run third-party advertising on the Service, and we do not participate in ad networks or retargeting platforms.

If we introduce marketing cookies in the future, this policy will be updated, and you will be asked for consent before any marketing cookies are set.

**Reserved for future use:**

| Cookie Name | Provider | Purpose | Type | Duration |
|-------------|----------|---------|------|----------|
| *None currently in use* | — | — | — | — |

## 4. Third-Party Cookies

### 4.1. Stripe (Payment Processing)

When you access payment-related pages (subscription management, checkout), Stripe may set cookies for fraud detection and payment security. These cookies are classified as strictly necessary for payment functionality.

| Cookie Name | Provider | Purpose | Type | Duration |
|-------------|----------|---------|------|----------|
| `__stripe_mid` | Stripe | Stripe fraud detection — uniquely identifies the device across payment sessions for fraud prevention. | Third-party | 1 year |
| `__stripe_sid` | Stripe | Stripe session identifier for the current payment session. | Third-party | 30 minutes |
| `m` | m.stripe.com | Stripe fraud prevention and bot detection. | Third-party | 2 years |

Stripe's cookie usage is governed by Stripe's privacy policy: https://stripe.com/privacy

### 4.2. OAuth Providers

During the authentication flow with Google or Microsoft, these providers may set their own cookies on their domains. We do not control these cookies. Refer to:

- Google's privacy policy: https://policies.google.com/privacy
- Microsoft's privacy policy: https://privacy.microsoft.com/privacystatement

## 5. How to Manage Cookies

### 5.1. Through Our Cookie Settings

You can change your cookie preferences at any time by clicking the **"Cookie Settings"** link in the footer of any page on citepilot.com, or by navigating to **Account Settings → Privacy → Cookie Preferences**.

### 5.2. Through Your Browser

Most web browsers allow you to control cookies through their settings. Below are links to cookie management instructions for common browsers:

| Browser | Instructions |
|---------|-------------|
| Google Chrome | chrome://settings/cookies — or Settings → Privacy and Security → Cookies |
| Mozilla Firefox | about:preferences#privacy — or Settings → Privacy & Security |
| Safari | Preferences → Privacy → Manage Website Data |
| Microsoft Edge | edge://settings/content/cookies — or Settings → Cookies and site permissions |
| Brave | brave://settings/cookies — or Settings → Shields → Cookies |

### 5.3. Impact of Disabling Cookies

| Cookie Category | Impact of Disabling |
|----------------|-------------------|
| Strictly necessary | The Service will not function. You will be unable to log in, upload documents, or use any features. |
| Functional | Your preferences (citation style, view mode, theme) will not be remembered between sessions. You will need to re-select them each time. |
| Analytics | No impact on Service functionality. We will have less insight into how the Service is used, which may affect our ability to improve it. |

### 5.4. Do Not Track (DNT)

Some browsers offer a "Do Not Track" (DNT) signal. There is currently no universal standard for how websites should respond to DNT signals. We treat DNT signals as equivalent to rejecting analytics cookies — if your browser sends a DNT signal and you have not otherwise provided cookie consent, we will not set analytics cookies.

## 6. Local Storage and Session Storage

In addition to cookies, the Service uses browser local storage and session storage for the following purposes:

| Key | Storage Type | Purpose | Category |
|-----|-------------|---------|----------|
| `cp_draft_text` | sessionStorage | Temporarily stores pasted text content during the upload flow so it is not lost if you navigate away and return. Cleared when the browser tab is closed. | Strictly necessary |
| `cp_filter_state` | localStorage | Stores your results filter preferences (see Functional Cookies above). | Functional |
| `cp_recent_uploads` | localStorage | Stores metadata (not content) of your recent uploads for quick access. Maximum 10 entries. | Functional |
| `cp_dismiss_banners` | localStorage | Records which informational banners you have dismissed. | Functional |

Local storage and session storage data is stored only in your browser and is never transmitted to our servers.

## 7. Cookie Retention

We review our cookie usage quarterly to ensure:

- All cookies listed in this policy are still in active use
- No unnecessary cookies have been introduced
- Cookie durations are proportionate to their purpose
- Cookie descriptions remain accurate

## 8. Changes to This Cookie Policy

We may update this Cookie Policy to reflect changes in the cookies we use or for other operational, legal, or regulatory reasons. When we make material changes, we will:

- Update the "Last Updated" date at the top of this page
- Display a notice in the cookie consent banner prompting you to review the updated policy
- Re-request your consent if we introduce new cookie categories

## 9. Contact Us

If you have questions about our use of cookies, please contact us:

- **Email:** privacy@citepilot.com
- **Data Protection Officer:** dpo@citepilot.com
- **Post:** CitePilot Ltd, [Registered Office Address], United Kingdom

---

*© 2026 CitePilot Ltd. All rights reserved.*
