# Privacy Policy

**CitePilot — AI-Powered Citation Consistency Checker**

**Effective Date:** July 14, 2026
**Last Updated:** July 14, 2026

---

CitePilot Ltd ("Company," "we," "us," or "our") is committed to protecting the privacy of our users. This Privacy Policy explains what personal data we collect, how we use it, who we share it with, and what rights you have regarding your data when you use the CitePilot platform ("the Service") available at citepilot.com.

This policy applies to all users of the Service worldwide and is designed to comply with the UK General Data Protection Regulation (UK GDPR), the EU General Data Protection Regulation (EU GDPR, Regulation 2016/679), the California Consumer Privacy Act as amended by the California Privacy Rights Act (CCPA/CPRA), and other applicable data protection laws.

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

When you create an account, we collect:

| Data Point | Purpose | Collected From |
|------------|---------|----------------|
| Email address | Account identification, authentication, communications | You (directly or via OAuth) |
| Full name | Display name, personalisation | You (directly or via OAuth) |
| OAuth provider ID | Authentication via Google or Microsoft | Google/Microsoft OAuth |
| Profile picture URL | Display in the application | Google/Microsoft OAuth |
| Password hash | Authentication (email/password accounts only) | You |
| Organisation/institution name | Institutional account management | You (institutional users) |
| Role/position | Institutional access control | Institutional administrator |

### 2.2. Uploaded Documents

When you use the Service, we temporarily process:

- **Document content**: The full text of .docx, .pdf, or plain-text documents you upload for citation analysis. Document content is encrypted at rest using AES-256 and in transit using TLS 1.2+.
- **Document metadata**: File name, file size, file type, upload timestamp, and the citation style selected for analysis.
- **Analysis results**: The extracted citations, reference list entries, matching results, AI-generated explanations, confidence scores, and suggested corrections produced by processing your document.

**Document content is automatically and permanently deleted within 36 hours of upload.** Analysis results (without the original document text) may be retained for up to 30 days to allow you to access your results, after which they are also permanently deleted.

### 2.3. Usage Data

We automatically collect:

| Data Point | Purpose | Legal Basis |
|------------|---------|-------------|
| IP address | Security, abuse prevention, approximate geolocation | Legitimate interest |
| Browser type and version | Compatibility, debugging | Legitimate interest |
| Operating system | Compatibility, debugging | Legitimate interest |
| Pages visited and features used | Product improvement, analytics | Legitimate interest / Consent |
| Timestamps of interactions | Audit logging, session management | Legitimate interest |
| Referring URL | Marketing attribution | Consent |
| Device identifiers | Session management | Legitimate interest |
| Error logs and crash reports | Debugging and service stability | Legitimate interest |

### 2.4. Payment Information

When you subscribe to a paid plan, Stripe (our payment processor) collects:

- Credit/debit card number (we never see or store the full number)
- Card expiration date
- Billing address
- Card brand and last four digits (shared with us for display and support purposes)

We store the following payment-related data on our own systems:

- Stripe customer ID
- Subscription plan and status
- Billing cycle dates
- Invoice history and amounts
- Payment failure records

### 2.5. Communications Data

When you contact us via email or in-app feedback:

- Email address
- Message content
- Attachments you send
- Timestamps
- Support ticket metadata

### 2.6. Cookie and Tracking Data

See our [Cookie Policy](/cookie-policy) for detailed information on cookies and tracking technologies.

## 3. Purpose of Data Collection and Legal Bases

Under the GDPR, we must have a legal basis for processing your personal data. The table below summarises our purposes and their corresponding legal bases:

| Purpose | Legal Basis (GDPR) | Details |
|---------|-------------------|---------|
| Providing the Service | Performance of contract (Art. 6(1)(b)) | Processing your documents, delivering analysis results, managing your account |
| Authentication and security | Performance of contract / Legitimate interest (Art. 6(1)(b)/(f)) | Verifying your identity, preventing unauthorised access, detecting abuse |
| Payment processing | Performance of contract (Art. 6(1)(b)) | Charging subscription fees, managing billing |
| AI-powered citation analysis | Performance of contract (Art. 6(1)(b)) | Transmitting document content to OpenAI for analysis |
| Reference validation | Performance of contract (Art. 6(1)(b)) | Querying Crossref, OpenAlex, PubMed, and DOI.org APIs with reference metadata |
| Product improvement and analytics | Legitimate interest (Art. 6(1)(f)) | Analysing aggregated, anonymised usage patterns to improve features |
| Communications | Legitimate interest (Art. 6(1)(f)) / Consent (Art. 6(1)(a)) | Responding to support requests; sending product updates (with consent for marketing) |
| Legal compliance | Legal obligation (Art. 6(1)(c)) | Tax records, fraud prevention, responding to lawful requests |
| Marketing and analytics tracking | Consent (Art. 6(1)(a)) | PostHog analytics, conversion tracking (only with explicit consent) |

**Legitimate interest assessments** have been conducted for all processing activities relying on legitimate interest. Copies are available upon request to dpo@citepilot.com.

## 4. Data Retention Periods

| Data Category | Retention Period | Justification |
|---------------|-----------------|---------------|
| Uploaded document content | 36 hours from upload | Minimum required for processing; user expectation of deletion |
| Analysis results | 30 days from generation | Allows users to review and export results |
| Account information | Duration of account + 30 days after deletion | Service provision and grace period for reactivation |
| Payment and billing records | 7 years after transaction | UK tax and accounting regulations (Finance Act) |
| Usage and analytics data | 26 months from collection | Analytics utility; aligned with Google Analytics retention norms |
| Support communications | 3 years from resolution | Dispute resolution and service improvement |
| Server and security logs | 90 days | Security monitoring and incident investigation |
| Cookie consent records | 3 years from consent | Demonstrating GDPR consent compliance |

After the applicable retention period expires, data is permanently deleted or irreversibly anonymised within 30 days.

## 5. Third Parties We Share Data With

We share personal data only with the following categories of third-party service providers, and only to the extent necessary for the stated purpose:

### 5.1. AI Processing — OpenAI

- **Data shared:** Document text content (for citation extraction and analysis)
- **Purpose:** AI-powered citation analysis, error detection, and correction generation
- **Data processing agreement:** In place; OpenAI does not use API inputs/outputs for model training
- **Data location:** United States
- **Retention by OpenAI:** API inputs and outputs are retained for up to 30 days for abuse monitoring, then deleted. Zero-retention may be enabled for qualifying accounts.

### 5.2. Reference Validation — Crossref, OpenAlex, PubMed, DOI.org

- **Data shared:** Reference metadata only (author names, titles, years, DOIs, journal names). No full document text is shared.
- **Purpose:** Verifying that cited references exist in scholarly databases
- **Data location:** United States (Crossref, OpenAlex, PubMed), international (DOI.org)
- **Note:** These are public scholarly APIs. Reference metadata is not considered personal data in most cases, but may contain author names.

### 5.3. Retraction Detection — Retraction Watch

- **Data shared:** DOIs and reference metadata
- **Purpose:** Checking whether cited sources have been retracted
- **Data location:** United States

### 5.4. Payment Processing — Stripe

- **Data shared:** Payment card details (collected directly by Stripe), email address, billing address
- **Purpose:** Subscription billing and payment processing
- **Data processing agreement:** In place; Stripe is PCI DSS Level 1 certified
- **Data location:** United States with global processing infrastructure
- **Stripe's privacy policy:** https://stripe.com/privacy

### 5.5. Cloud Infrastructure — Amazon Web Services (AWS)

- **Data shared:** All data processed by the Service is stored on and transmitted through AWS infrastructure
- **Purpose:** Hosting, storage, compute, and content delivery
- **Data processing agreement:** In place (AWS GDPR Data Processing Addendum)
- **Data location:** Primary region: EU (eu-west-1, Ireland). Backups replicated to eu-west-2 (London).
- **Encryption:** All data encrypted at rest (AES-256) and in transit (TLS 1.2+)

### 5.6. Analytics — PostHog

- **Data shared:** Anonymised usage events, page views, feature interactions, session recordings (if consented)
- **Purpose:** Product analytics, conversion funnel tracking, user experience improvement
- **Data processing agreement:** In place
- **Data location:** European Union (PostHog Cloud EU)
- **Note:** Analytics data is only collected with user consent via our cookie consent mechanism

### 5.7. Error Monitoring — Sentry

- **Data shared:** Error stack traces, browser/OS metadata, anonymised user identifiers
- **Purpose:** Application error tracking and debugging
- **Data processing agreement:** In place
- **Data location:** United States

### 5.8. Monitoring — Datadog

- **Data shared:** Application performance metrics, infrastructure logs (no document content)
- **Purpose:** Infrastructure monitoring, alerting, and performance optimisation
- **Data processing agreement:** In place
- **Data location:** United States with EU data residency option

### 5.9. Email — Transactional Email Provider

- **Data shared:** Email address, name
- **Purpose:** Account verification, password reset, subscription notifications, product updates
- **Data processing agreement:** In place

We do not sell your personal data. We do not share your personal data with advertisers. We do not permit our service providers to use your data for their own marketing purposes.

## 6. International Data Transfers

Our primary data processing infrastructure is located in the European Union (AWS eu-west-1, Ireland). Some of our third-party service providers process data in the United States.

For transfers of personal data from the EEA/UK to the United States or other countries without an adequacy decision, we rely on the following safeguards:

- **EU-U.S. Data Privacy Framework:** For providers certified under the framework (Stripe, OpenAI)
- **Standard Contractual Clauses (SCCs):** Executed with all providers not covered by an adequacy decision or the Data Privacy Framework
- **UK International Data Transfer Agreement (IDTA):** Used for transfers from the UK where required

You may request copies of the relevant transfer safeguards by contacting dpo@citepilot.com.

## 7. Your Rights

### 7.1. Rights Under GDPR (EEA/UK Residents)

You have the following rights regarding your personal data:

| Right | Description | How to Exercise |
|-------|-------------|-----------------|
| **Access** (Art. 15) | Request a copy of the personal data we hold about you | Email dpo@citepilot.com or use account settings |
| **Rectification** (Art. 16) | Request correction of inaccurate personal data | Update in account settings or email dpo@citepilot.com |
| **Erasure** (Art. 17) | Request deletion of your personal data ("right to be forgotten") | Delete account in settings or email dpo@citepilot.com |
| **Restriction** (Art. 18) | Request that we limit processing of your data | Email dpo@citepilot.com |
| **Portability** (Art. 20) | Receive your data in a structured, machine-readable format (JSON) | Email dpo@citepilot.com or use data export in settings |
| **Objection** (Art. 21) | Object to processing based on legitimate interest | Email dpo@citepilot.com |
| **Withdraw consent** (Art. 7(3)) | Withdraw consent for processing based on consent (e.g., analytics) | Cookie settings or email dpo@citepilot.com |
| **Automated decision-making** (Art. 22) | Not be subject to decisions based solely on automated processing | Contact dpo@citepilot.com |

We will respond to all rights requests within 30 days (extendable by 60 days for complex requests, with notice). We will verify your identity before processing any request.

### 7.2. Rights Under CCPA/CPRA (California Residents)

If you are a California resident, you have additional rights under the CCPA/CPRA:

- **Right to Know:** You may request disclosure of the categories and specific pieces of personal information we have collected, the categories of sources, the business purpose for collection, and the categories of third parties with whom we share data.
- **Right to Delete:** You may request deletion of personal information we have collected from you.
- **Right to Correct:** You may request correction of inaccurate personal information.
- **Right to Opt-Out of Sale/Sharing:** We do not sell or share your personal information for cross-context behavioural advertising.
- **Right to Non-Discrimination:** We will not discriminate against you for exercising your CCPA/CPRA rights.

To exercise your CCPA/CPRA rights, contact us at privacy@citepilot.com or use the "Privacy Rights" section in your account settings. We will verify your identity using the email address associated with your account.

**CCPA Categories Disclosure:**

| Category of PI Collected | Source | Business Purpose | Shared With |
|--------------------------|--------|-----------------|-------------|
| Identifiers (name, email) | You, OAuth providers | Account management | AWS, email provider |
| Internet activity (usage logs) | Automatic collection | Analytics, security | PostHog, Sentry |
| Commercial info (payment) | You via Stripe | Billing | Stripe |
| Professional info (institution) | You, admin | Institutional features | AWS |
| Inferences (analysis results) | AI processing | Core service delivery | OpenAI |

## 8. Cookie Usage

We use cookies and similar technologies for authentication, security, functionality, and (with your consent) analytics. For comprehensive details, including a full list of cookies, their purposes, and how to manage them, please refer to our [Cookie Policy](/cookie-policy).

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

- **Encryption at rest:** AES-256 for all stored data
- **Encryption in transit:** TLS 1.2+ for all data transmission
- **Access controls:** Role-based access control (RBAC) with principle of least privilege
- **Infrastructure security:** AWS VPC with private subnets, security groups, and network ACLs
- **Authentication:** Bcrypt password hashing with per-user salts; OAuth 2.0 for third-party authentication
- **Secrets management:** All API keys and credentials stored in AWS Secrets Manager, rotated quarterly
- **Monitoring:** Real-time security event monitoring via Datadog; automated alerting on anomalies
- **Vulnerability management:** Automated dependency scanning via GitHub Dependabot; regular penetration testing
- **Employee access:** Limited to authorised personnel on a need-to-know basis; all access logged and auditable
- **Data minimisation:** Documents deleted within 36 hours; only essential data retained

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

14.2. For material changes, we will provide at least 30 days' advance notice by email and through a prominent notice in the Service before the changes take effect.

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
