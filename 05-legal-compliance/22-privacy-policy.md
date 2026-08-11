# Privacy Policy

**CitePilot — AI-Powered Citation Consistency Checker**

**Effective Date:** July 14, 2026
**Last Updated:** August 11, 2026

---

CitePilot Ltd ("Company," "we," "us," or "our") is committed to protecting the privacy of our users. This Privacy Policy explains what personal data we collect, how we use it, who we share it with, and what rights you have regarding your data when you use the CitePilot platform ("the Service") available at citepilot.com.

This policy applies to all users of the Service worldwide and is designed to comply with the UK General Data Protection Regulation (UK GDPR), the EU General Data Protection Regulation (EU GDPR, Regulation 2016/679), the California Consumer Privacy Act as amended by the California Privacy Rights Act (CCPA/CPRA), and other applicable data protection laws.

A design note up front: **the Service is anonymous by design.** In the current version you do not need an account, we do not store your uploaded documents, and we do not use advertising or marketing analytics. This minimises the personal data we process.

---

## 1. Data Controller

The data controller responsible for your personal data is:

**CitePilot Ltd**
Registered in England and Wales
Email: privacy@citepilot.com
Data Protection Officer: dpo@citepilot.com

If you are located in the European Economic Area (EEA) and have concerns about our data processing that we cannot resolve, you have the right to lodge a complaint with your local data protection supervisory authority.

## 2. Data We Collect

### 2.1. Account Information

**We do not offer accounts in the current version of the Service.** You can use CitePilot without registering, providing an email address, or choosing a password. Analysis results are secured with an unguessable token generated on your device and are not linked to any personal identifier.

If we introduce accounts (e.g. for an institutional tier), this policy will be updated before they launch.

### 2.2. Uploaded Documents

When you use the Service, we temporarily process in memory:

- **Document content**: The text of `.docx`, `.pdf`, `.txt`, `.rtf`, or `.bib` documents you upload for citation analysis.
- **Document metadata**: File name, file size, file type, upload timestamp, and the citation style selected for analysis.
- **Analysis results**: The extracted citations, reference list entries, matching results, validation statuses, confidence scores, and suggested corrections produced by processing your document.

**We do not store your documents.** Document content exists only in the memory of our processing servers while the analysis runs, is never written to disk or database, and is purged when the analysis completes — with a hard cap of 36 hours from upload. Only the citation metadata in your result report (bibliographic facts such as authors, titles, years, and DOIs — generally not personal data) is persisted so you can re-open your report with your token.

### 2.3. Usage Data

We automatically collect the minimum necessary for operation and abuse prevention:

| Data Point | Purpose | Legal Basis |
|------------|---------|-------------|
| IP address | Rate limiting, abuse prevention | Legitimate interest |
| Browser type and version | Compatibility, debugging | Legitimate interest |
| Operating system | Compatibility, debugging | Legitimate interest |
| Timestamps of requests | Audit logging, rate limiting | Legitimate interest |
| Error logs and crash reports | Debugging and service stability | Legitimate interest |

We do **not** collect browsing behaviour, "pages visited" analytics, device identifiers for advertising, or use any marketing analytics tools in the current version. If we ever introduce product analytics, it will be privacy-preserving and consent-gated, and this policy will be updated first.

### 2.4. Payment Information

Subscriptions are processed entirely by **PayPal** on PayPal's own checkout pages. We never see, store, or process credit/debit card numbers.

When you subscribe to a paid plan, PayPal shares with us:

- Your email address (used solely for billing receipts and support correspondence)
- A PayPal order/subscription ID
- Plan and status information (for entitlement checks)

We do not store your billing address or card details.

### 2.5. Communications Data

When you contact us via email or the support form:

- Email address
- Message content
- Attachments you send
- Timestamps
- Support ticket metadata

### 2.6. Cookies

We set no authentication cookies (the Service has no sessions) and no advertising or analytics cookies. A single first-party consent-preference cookie may be stored if you interact with a cookie notice. See our [Cookie Policy](/cookie-policy) for details.

## 3. Purpose of Data Collection and Legal Bases

Under the GDPR, we must have a legal basis for processing your personal data. The table below summarises our purposes and their corresponding legal bases:

| Purpose | Legal Basis (GDPR) | Details |
|---------|-------------------|---------|
| Providing the Service | Performance of contract (Art. 6(1)(b)) | Processing your documents, delivering analysis results |
| Reference validation | Performance of contract (Art. 6(1)(b)) | Querying Crossref, DOI.org, OpenAlex, and PubMed APIs with reference metadata (bibliographic data, not personal data) |
| Payment processing | Performance of contract (Art. 6(1)(b)) | Charging subscription fees via PayPal, managing billing |
| Abuse prevention and security | Legitimate interest (Art. 6(1)(f)) | Rate limiting, preventing misuse of the anonymous Service |
| Product improvement | Legitimate interest (Art. 6(1)(f)) | Analysing aggregated, anonymised usage patterns |
| Communications | Legitimate interest (Art. 6(1)(f)) / Consent (Art. 6(1)(a)) | Responding to support requests; sending product updates (with consent for marketing) |
| Legal compliance | Legal obligation (Art. 6(1)(c)) | Tax records, fraud prevention, responding to lawful requests |

**Legitimate interest assessments** have been conducted for all processing activities relying on legitimate interest. Copies are available upon request to dpo@citepilot.com.

## 4. Data Retention Periods

| Data Category | Retention Period | Justification |
|---------------|-----------------|---------------|
| Uploaded document content | Deleted at end of analysis; hard cap 36 hours from upload | In-memory only; nothing is written to disk or database |
| Analysis result reports (citation metadata) | Indefinite, keyed by unguessable token | Allows you to re-open results; contains public bibliographic facts only |
| Payment and billing records | 7 years after transaction | UK tax and accounting regulations (Finance Act) |
| Support communications | 3 years from resolution | Dispute resolution and service improvement |
| Server and security logs | 90 days | Security monitoring and incident investigation |

After the applicable retention period expires, data is permanently deleted or irreversibly anonymised within 30 days.

## 5. Third Parties We Share Data With

We share personal data only with the following third-party service providers, and only to the extent necessary for the stated purpose:

### 5.1. AI Processing — Google Gemini

- **Data shared:** Citation-relevant text excerpts from your document (we minimise content before any AI call)
- **Purpose:** AI-powered citation extraction, error detection, and correction generation
- **Data processing agreement:** In place; Google does not use API inputs/outputs for model training
- **Data location:** United States (Google Cloud)
- **Note:** We instruct the AI to treat references as opaque data objects and never to invent metadata. Document content is never retained by us and is not used to train any models.

### 5.2. Reference Validation — Crossref, DOI.org, OpenAlex, PubMed

- **Data shared:** Reference metadata only (author names, titles, years, DOIs, journal names). No full document text is shared.
- **Purpose:** Verifying that cited references exist in scholarly databases; retraction status comes from Crossref's `is-retracted-by` metadata
- **Data location:** United States (Crossref, OpenAlex, PubMed), international (DOI.org)
- **Note:** These are public scholarly APIs. Reference metadata is not considered personal data in most cases, but may contain author names.

### 5.3. Payment Processing — PayPal

- **Data shared:** Email address and order identifier (card details are collected directly by PayPal and never reach us)
- **Purpose:** Subscription billing and payment processing
- **Data processing agreement:** In place; PayPal is PCI DSS compliant
- **Data location:** PayPal's global processing infrastructure
- **PayPal's privacy policy:** https://www.paypal.com/privacy

### 5.4. Hosting — Vercel and Railway

- **Data shared:** Technical data that passes through or is stored on our hosting platforms (web assets, database contents, service logs)
- **Purpose:** Hosting the website, API, AI processing service, and PostgreSQL database
- **Status:** Sub-processors under GDPR; platform-managed security (TLS, disk encryption, patching)
- **Data location:** Vercel and Railway operate in EU and US regions; our database and compute regions are documented in our internal infrastructure documentation

### 5.5. Error Monitoring — Sentry

- **Data shared:** Error stack traces, browser/OS metadata (no document content, no citation text)
- **Purpose:** Application error tracking and debugging
- **Data processing agreement:** In place
- **Data location:** United States

We do not sell your personal data. We do not share your personal data with advertisers. We do not permit our service providers to use your data for their own marketing purposes.

## 6. International Data Transfers

Our hosting platforms (Vercel, Railway) operate data centres in the European Union and the United States. Our AI provider (Google) processes data in the United States. Payment processing is handled by PayPal on their own infrastructure.

For transfers of personal data from the EEA/UK to the United States or other countries without an adequacy decision, we rely on the following safeguards:

- **EU-U.S. and UK-U.S. Data Privacy Framework:** For providers certified under the framework (e.g. Google, PayPal where applicable)
- **Standard Contractual Clauses (SCCs):** Executed with all providers not covered by an adequacy decision or the Data Privacy Framework
- **UK International Data Transfer Agreement (IDTA):** Used for transfers from the UK where required

You may request copies of the relevant transfer safeguards by contacting dpo@citepilot.com.

## 7. Your Rights

### 7.1. Rights Under GDPR (EEA/UK Residents)

You have the following rights regarding your personal data:

| Right | Description | How to Exercise |
|-------|-------------|-----------------|
| **Access** (Art. 15) | Request a copy of the personal data we hold about you | Email dpo@citepilot.com |
| **Rectification** (Art. 16) | Request correction of inaccurate personal data | Email dpo@citepilot.com |
| **Erasure** (Art. 17) | Request deletion of your personal data ("right to be forgotten") | Email dpo@citepilot.com with your analysis token (if applicable) |
| **Restriction** (Art. 18) | Request that we limit processing of your data | Email dpo@citepilot.com |
| **Portability** (Art. 20) | Receive your data in a structured, machine-readable format (JSON) | Email dpo@citepilot.com |
| **Objection** (Art. 21) | Object to processing based on legitimate interest | Email dpo@citepilot.com |
| **Withdraw consent** (Art. 7(3)) | Withdraw consent for processing based on consent (if any) | Email dpo@citepilot.com |
| **Automated decision-making** (Art. 22) | Not be subject to decisions based solely on automated processing | Contact dpo@citepilot.com |

We will respond to all rights requests within 30 days (extendable by 60 days for complex requests, with notice). We will verify your identity before processing any request. Because the Service is anonymous, most rights can be exercised simply by discarding your analysis token — no personal data is linked to it.

### 7.2. Rights Under CCPA/CPRA (California Residents)

If you are a California resident, you have additional rights under the CCPA/CPRA:

- **Right to Know:** You may request disclosure of the categories and specific pieces of personal information we have collected, the categories of sources, the business purpose for collection, and the categories of third parties with whom we share data.
- **Right to Delete:** You may request deletion of personal information we have collected from you.
- **Right to Correct:** You may request correction of inaccurate personal information.
- **Right to Opt-Out of Sale/Sharing:** We do not sell or share your personal information for cross-context behavioural advertising.
- **Right to Non-Discrimination:** We will not discriminate against you for exercising your CCPA/CPRA rights.

To exercise your CCPA/CPRA rights, contact us at privacy@citepilot.com. We will verify your identity before processing your request.

**CCPA Categories Disclosure:**

| Category of PI Collected | Source | Business Purpose | Shared With |
|--------------------------|--------|-----------------|-------------|
| Identifiers (email) | PayPal (billing) | Billing receipts | PayPal, email provider |
| Internet activity (request logs) | Automatic collection | Security, abuse prevention | Vercel, Railway, Sentry |
| Commercial info (payment) | You via PayPal | Billing | PayPal |
| Inferences (analysis results) | AI processing | Core service delivery | Google Gemini |

## 8. Cookie Usage

The Service does not use authentication, advertising, or analytics cookies. A cookie notice may store a single first-party consent-preference cookie. For comprehensive details, including the full list of cookies and how to manage them, please refer to our [Cookie Policy](/cookie-policy).

## 9. Children's Privacy

9.1. The Service is not directed at children under the age of 13. We do not knowingly collect personal data from children under 13.

9.2. If we become aware that we have collected personal data from a child under 13 without verifiable parental consent, we will take steps to delete that data as quickly as possible.

9.3. Users between the ages of 13 and 18 may use the Service with the consent of a parent or legal guardian, as stated in our Terms of Service.

9.4. If you are a parent or guardian and believe your child under 13 has provided us with personal data, please contact us at privacy@citepilot.com.

## 10. Data Protection Officer

We have appointed a Data Protection Officer (DPO) who is responsible for overseeing our data protection strategy and ensuring compliance with applicable data protection laws.

**Contact the DPO:**

- **Email:** dpo@citepilot.com
- **Post:** Data Protection Officer, CitePilot Ltd, [Registered Office Address], United Kingdom

The DPO can be contacted directly regarding any questions, concerns, or requests related to:

- How we process your personal data
- Exercising your data protection rights
- Filing a complaint about our data handling practices
- Requesting copies of data processing agreements or transfer safeguards

## 11. Data Security

We implement technical and organisational measures to protect your personal data, including:

- **Encryption at rest:** Platform-managed AES-256 disk encryption for our hosted database (Vercel Postgres)
- **Encryption in transit:** TLS 1.2+ for all data transmission, including calls to the Google Gemini API and other providers
- **Access controls:** Single-purpose database roles; least-privilege access to production credentials
- **Infrastructure security:** Managed by our platforms (Vercel, Railway) — patching, DDoS protection, and monitoring are contracted to our hosting providers, who are SOC 2 certified
- **Secrets management:** All API keys and credentials stored as platform environment variables, rotated on a schedule; never committed to source control (CI secret scanning with trufflehog)
- **Data minimisation:** Documents held in memory only and deleted within 36 hours; no account system to compromise
- **Upload validation:** File-type and magic-byte checks before any processing
- **Vulnerability management:** Automated dependency scanning via GitHub Dependabot and npm/pip audit in CI
- **Employee access:** Limited to authorised personnel on a need-to-know basis; all access logged and auditable

## 12. Data Breach Notification

12.1. In the event of a personal data breach that is likely to result in a risk to the rights and freedoms of affected individuals, we will:

- Notify the relevant supervisory authority (the UK Information Commissioner's Office or applicable EEA authority) within 72 hours of becoming aware of the breach, as required by Article 33 of the GDPR.
- Notify affected individuals without undue delay if the breach is likely to result in a high risk to their rights and freedoms, as required by Article 34 of the GDPR.

12.2. Breach notifications to individuals will include:

- A description of the nature of the breach
- The categories and approximate number of data subjects affected
- The categories and approximate number of personal data records affected
- The likely consequences of the breach
- The measures taken or proposed to address the breach and mitigate its effects
- Contact details for the DPO or other point of contact for further information

12.3. We maintain a breach register documenting all data breaches, including those that do not require notification, in accordance with Article 33(5) of the GDPR.

12.4. For California residents, breach notification will also comply with the California Civil Code § 1798.82 requirements.

## 13. Automated Decision-Making

13.1. The Service uses AI (large language models) to perform citation analysis, including extracting citations, matching citations to references, validating references against external databases, and generating suggested corrections.

13.2. These AI processes are used to enhance the Service's analytical capabilities, but they do not produce decisions that have legal or similarly significant effects on you. The Service's outputs are advisory recommendations, not binding determinations.

13.3. You are not subject to decisions based solely on automated processing that produce legal effects concerning you or similarly significantly affect you, within the meaning of Article 22 of the GDPR.

13.4. If you have concerns about the automated processing of your data, you may contact dpo@citepilot.com to request human review of any specific analysis result.

## 14. Changes to This Privacy Policy

14.1. We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors.

14.2. For material changes, we will provide at least 30 days' advance notice through a prominent notice in the Service before the changes take effect, and by email where we hold your email address (e.g. billing).

14.3. We encourage you to review this Privacy Policy periodically. Your continued use of the Service after the effective date of a revised Privacy Policy constitutes your acceptance of the changes.

14.4. Prior versions of this Privacy Policy are available upon request by contacting privacy@citepilot.com.

## 15. Contact Us

For any questions, concerns, or requests related to this Privacy Policy or our data practices, please contact us:

- **General Privacy Inquiries:** privacy@citepilot.com
- **Data Protection Officer:** dpo@citepilot.com
- **Support:** support@citepilot.com
- **Post:** CitePilot Ltd, [Registered Office Address], United Kingdom

For complaints that we cannot resolve, EEA/UK residents may contact their local data protection supervisory authority. UK residents may contact the Information Commissioner's Office (ICO) at https://ico.org.uk.

---

*© 2026 CitePilot Ltd. All rights reserved.*