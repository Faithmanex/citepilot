# CitePilot — API Specification

> **Document ID:** CP-ARCH-012  
> **Version:** 1.0.0  
> **Last Updated:** 2026-07-14  
> **Status:** Approved  
> **Owner:** Engineering — API Team  
> **Classification:** Internal  
> **Base URL:** `https://api.citepilot.com/api/v1`

---

## 1. API Design Principles

| Principle | Implementation |
|---|---|
| **RESTful** | Resources identified by nouns; HTTP methods define actions |
| **JSON:API envelope** | All responses wrapped in `{ data, meta, errors }` |
| **Versioned** | URL-based versioning (`/api/v1/`); header-based versioning reserved for future |
| **Authenticated** | Bearer JWT token in `Authorization` header (except public endpoints) |
| **Paginated** | Cursor-based pagination on list endpoints (`?cursor=xxx&limit=25`) |
| **Rate-limited** | Per-tier limits enforced; rate limit headers on every response |
| **Idempotent** | PUT and DELETE operations are idempotent; POST operations use idempotency keys where applicable |

### 1.1 Standard Response Envelope

**Success:**

```json
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-07-14T18:25:00.000Z",
    "pagination": {
      "cursor": "eyJpZCI6MTAwfQ",
      "limit": 25,
      "hasMore": true
    }
  }
}
```

**Error:**

```json
{
  "data": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "File size exceeds maximum allowed (10 MB)",
      "field": "file",
      "detail": "Uploaded file is 14.2 MB. Maximum allowed size for your plan is 10 MB."
    }
  ],
  "meta": {
    "requestId": "req_def456",
    "timestamp": "2026-07-14T18:25:01.000Z"
  }
}
```

### 1.2 Standard Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1720972800
Retry-After: 30
```

### 1.3 Standard HTTP Status Codes

| Code | Meaning | Usage |
|---|---|---|
| `200` | OK | Successful read or update |
| `201` | Created | Successful resource creation |
| `202` | Accepted | Async job enqueued (document upload/analysis) |
| `204` | No Content | Successful deletion |
| `400` | Bad Request | Validation error, malformed body |
| `401` | Unauthorized | Missing or invalid JWT |
| `403` | Forbidden | Insufficient permissions (wrong tier, wrong org) |
| `404` | Not Found | Resource does not exist or not owned by user |
| `409` | Conflict | Duplicate resource (e.g., duplicate upload) |
| `413` | Payload Too Large | File exceeds size limit |
| `415` | Unsupported Media Type | File type not supported |
| `422` | Unprocessable Entity | Semantically invalid request |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server error |
| `503` | Service Unavailable | Downstream dependency failure |

---

## 2. Authentication Endpoints

### 2.1 Register with Email/Password

```
POST /auth/register
```

**Auth Required:** No  
**Rate Limit:** 5 requests/hour per IP

**Request Body:**

```json
{
  "email": "jane.doe@university.edu",
  "password": "S3cur3P@ssw0rd!",
  "name": "Jane Doe",
  "role": "student"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "user": {
      "id": "usr_a1b2c3d4e5f6",
      "email": "jane.doe@university.edu",
      "name": "Jane Doe",
      "role": "student",
      "tier": "free",
      "emailVerified": false,
      "createdAt": "2026-07-14T18:25:00.000Z"
    },
    "message": "Verification email sent to jane.doe@university.edu"
  },
  "meta": { "requestId": "req_001" }
}
```

**Error Codes:**

| Code | Condition |
|---|---|
| `VALIDATION_ERROR` | Missing required fields, password too weak, invalid email format |
| `EMAIL_ALREADY_EXISTS` | Email already registered |
| `RATE_LIMIT_EXCEEDED` | Too many registration attempts from this IP |

---

### 2.2 Login with Email/Password

```
POST /auth/login
```

**Auth Required:** No  
**Rate Limit:** 10 requests/minute per IP

**Request Body:**

```json
{
  "email": "jane.doe@university.edu",
  "password": "S3cur3P@ssw0rd!"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "rt_x7y8z9a0b1c2",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "usr_a1b2c3d4e5f6",
      "email": "jane.doe@university.edu",
      "name": "Jane Doe",
      "role": "student",
      "tier": "student",
      "organisationId": null
    }
  },
  "meta": { "requestId": "req_002" }
}
```

**Error Codes:**

| Code | Condition |
|---|---|
| `INVALID_CREDENTIALS` | Email/password combination incorrect |
| `EMAIL_NOT_VERIFIED` | Account exists but email not verified |
| `ACCOUNT_LOCKED` | Too many failed attempts (locked for 30 minutes) |

---

### 2.3 OAuth Login (Google / Microsoft)

```
GET /auth/oauth/{provider}
```

**Providers:** `google`, `microsoft`  
**Auth Required:** No

Initiates OAuth 2.0 authorization code flow. Redirects user to provider's consent screen.

**Query Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `redirect_uri` | string | Yes | Client callback URL |
| `state` | string | Yes | CSRF protection token |

**OAuth Callback:**

```
GET /auth/oauth/{provider}/callback
```

Exchanges authorization code for tokens. Returns same response shape as `POST /auth/login`.

---

### 2.4 Refresh Token

```
POST /auth/refresh
```

**Auth Required:** No (uses refresh token)  
**Rate Limit:** 30 requests/hour per user

**Request Body:**

```json
{
  "refreshToken": "rt_x7y8z9a0b1c2"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "rt_d3e4f5g6h7i8",
    "expiresIn": 900,
    "tokenType": "Bearer"
  },
  "meta": { "requestId": "req_003" }
}
```

**Error Codes:**

| Code | Condition |
|---|---|
| `INVALID_REFRESH_TOKEN` | Token expired, revoked, or invalid |
| `TOKEN_REUSE_DETECTED` | Refresh token used more than once (potential theft — all sessions revoked) |

---

### 2.5 Logout

```
POST /auth/logout
```

**Auth Required:** Yes  

**Request Body:**

```json
{
  "refreshToken": "rt_x7y8z9a0b1c2"
}
```

**Response (204 No Content)**

---

## 3. Document Endpoints

### 3.1 Upload Document

```
POST /documents/upload
```

**Auth Required:** Yes  
**Rate Limit:** Per-tier (Free: 3/day, Student: 50/day, Professional: 500/day)  
**Content-Type:** `multipart/form-data`

**Request Body (multipart):**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | Yes | `.docx` or `.pdf` file (max 10 MB free, 50 MB paid) |
| `citationStyle` | string | Yes | One of: `apa7`, `apa6`, `harvard`, `vancouver`, `chicago-author-date`, `chicago-notes`, `mla9`, `ieee`, `oscola`, `turabian` |
| `multiRefList` | boolean | No | Enable multi-reference-list detection (default: `false`) |
| `label` | string | No | User-friendly label for the document (max 200 characters) |

**Response (202 Accepted):**

```json
{
  "data": {
    "document": {
      "id": "doc_f7g8h9i0j1k2",
      "filename": "thesis_chapter_3.docx",
      "label": "Chapter 3 — Literature Review",
      "fileSize": 245760,
      "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "citationStyle": "apa7",
      "multiRefList": false,
      "status": "uploaded",
      "statusUrl": "/api/v1/documents/doc_f7g8h9i0j1k2/status",
      "createdAt": "2026-07-14T18:25:00.000Z",
      "expiresAt": "2026-07-16T06:25:00.000Z"
    }
  },
  "meta": { "requestId": "req_010" }
}
```

**Error Codes:**

| Code | Condition |
|---|---|
| `UNSUPPORTED_FILE_TYPE` | File is not `.docx` or `.pdf` |
| `FILE_TOO_LARGE` | File exceeds size limit for user's tier |
| `WORD_LIMIT_EXCEEDED` | Document exceeds word limit for tier (Free: 5,000) |
| `REFERENCE_LIMIT_EXCEEDED` | Document exceeds reference limit for tier (Free: 100) |
| `DAILY_UPLOAD_LIMIT` | Upload quota exhausted for the day |
| `STYLE_NOT_AVAILABLE` | Citation style not available on user's tier (Free: 3 styles only) |
| `MALWARE_DETECTED` | ClamAV scan flagged the file |

---

### 3.2 Paste Plain Text

```
POST /documents/paste
```

**Auth Required:** Yes  
**Rate Limit:** Same as upload

**Request Body:**

```json
{
  "text": "The full text of the document including the reference list...",
  "citationStyle": "apa7",
  "multiRefList": false,
  "label": "Quick essay check"
}
```

**Response (202 Accepted):** Same shape as upload response, with `filename: null` and `mimeType: "text/plain"`.

---

### 3.3 List Documents

```
GET /documents
```

**Auth Required:** Yes  
**Rate Limit:** 60/min (Free), 120/min (Student), 300/min (Professional)

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `cursor` | string | null | Pagination cursor |
| `limit` | integer | 25 | Results per page (max 100) |
| `status` | string | null | Filter by status: `uploaded`, `parsing`, `analysing`, `analysed`, `validating`, `validated`, `failed` |
| `sort` | string | `-createdAt` | Sort field with direction prefix (`-` for desc) |

**Response (200 OK):**

```json
{
  "data": {
    "documents": [
      {
        "id": "doc_f7g8h9i0j1k2",
        "filename": "thesis_chapter_3.docx",
        "label": "Chapter 3 — Literature Review",
        "citationStyle": "apa7",
        "status": "validated",
        "wordCount": 4250,
        "citationCount": 47,
        "referenceCount": 52,
        "issueCount": 5,
        "createdAt": "2026-07-14T18:25:00.000Z",
        "expiresAt": "2026-07-16T06:25:00.000Z"
      }
    ]
  },
  "meta": {
    "requestId": "req_011",
    "pagination": {
      "cursor": "eyJpZCI6MTAwfQ",
      "limit": 25,
      "hasMore": false
    }
  }
}
```

---

### 3.4 Get Document Details

```
GET /documents/{documentId}
```

**Auth Required:** Yes  

**Response (200 OK):**

```json
{
  "data": {
    "document": {
      "id": "doc_f7g8h9i0j1k2",
      "filename": "thesis_chapter_3.docx",
      "label": "Chapter 3 — Literature Review",
      "fileSize": 245760,
      "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "citationStyle": "apa7",
      "multiRefList": false,
      "status": "validated",
      "wordCount": 4250,
      "progress": 100,
      "stages": {
        "parsing": { "status": "complete", "completedAt": "2026-07-14T18:25:05.000Z" },
        "citationExtraction": { "status": "complete", "completedAt": "2026-07-14T18:25:12.000Z" },
        "referenceMatching": { "status": "complete", "completedAt": "2026-07-14T18:25:18.000Z" },
        "externalValidation": { "status": "complete", "completedAt": "2026-07-14T18:25:30.000Z" },
        "retractionCheck": { "status": "complete", "completedAt": "2026-07-14T18:25:32.000Z" }
      },
      "summary": {
        "totalCitations": 47,
        "totalReferences": 52,
        "matched": 42,
        "possibleMatch": 3,
        "noMatch": 2,
        "orphanedReferences": 5,
        "styleWarnings": 8,
        "retractionFlags": 0,
        "hallucinationFlags": 1,
        "externalValidationIssues": 2
      },
      "createdAt": "2026-07-14T18:25:00.000Z",
      "expiresAt": "2026-07-16T06:25:00.000Z"
    }
  },
  "meta": { "requestId": "req_012" }
}
```

---

### 3.5 Get Document Status

```
GET /documents/{documentId}/status
```

**Auth Required:** Yes  
**Purpose:** Lightweight polling endpoint during analysis.

**Response (200 OK):**

```json
{
  "data": {
    "documentId": "doc_f7g8h9i0j1k2",
    "status": "analysing",
    "progress": 65,
    "currentStage": "referenceMatching",
    "message": "Matching 35 of 47 citations against reference list...",
    "estimatedTimeRemaining": 12
  },
  "meta": { "requestId": "req_013" }
}
```

---

### 3.6 Delete Document

```
DELETE /documents/{documentId}
```

**Auth Required:** Yes  

**Response (204 No Content)**

Deletes the document, all associated results, and the S3 file immediately.

---

## 4. Results Endpoints

### 4.1 Get Citation Results

```
GET /documents/{documentId}/results/citations
```

**Auth Required:** Yes  
**Rate Limit:** 60/min (Free)

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `cursor` | string | null | Pagination cursor |
| `limit` | integer | 50 | Results per page (max 200) |
| `status` | string | null | Filter: `matched`, `possible_match`, `no_match`, `ignored` |
| `severity` | string | null | Filter: `error`, `warning`, `info` |
| `author` | string | null | Filter by author name (partial match) |
| `year` | integer | null | Filter by year |

**Response (200 OK):**

```json
{
  "data": {
    "citations": [
      {
        "id": "cit_m1n2o3p4q5r6",
        "inTextCitation": "(Smith & Johnson, 2024)",
        "rawText": "(Smith & Johnson, 2024)",
        "position": {
          "paragraphIndex": 12,
          "charStart": 245,
          "charEnd": 270,
          "context": "...recent findings suggest that AI-powered tools significantly reduce citation errors (Smith & Johnson, 2024). Furthermore, the impact..."
        },
        "extractedAuthors": ["Smith", "Johnson"],
        "extractedYear": 2024,
        "status": "matched",
        "severity": "info",
        "confidence": 0.97,
        "matchedReference": {
          "id": "ref_s1t2u3v4w5x6",
          "formattedEntry": "Smith, A. B., & Johnson, C. D. (2024). AI-powered citation verification in academic publishing. Journal of Scholarly Communication, 15(3), 112–128. https://doi.org/10.1000/jsc.2024.0045",
          "matchType": "exact",
          "matchDetails": {
            "authorMatch": 1.0,
            "yearMatch": 1.0,
            "overallScore": 0.97
          }
        },
        "issues": [],
        "ignored": false,
        "createdAt": "2026-07-14T18:25:12.000Z"
      },
      {
        "id": "cit_a2b3c4d5e6f7",
        "inTextCitation": "(Williams et al., 2023)",
        "rawText": "(Williams et al., 2023)",
        "position": {
          "paragraphIndex": 15,
          "charStart": 102,
          "charEnd": 128,
          "context": "...contradicts earlier research on manual proofreading effectiveness (Williams et al., 2023), which found that..."
        },
        "extractedAuthors": ["Williams"],
        "extractedYear": 2023,
        "status": "possible_match",
        "severity": "warning",
        "confidence": 0.72,
        "matchedReference": {
          "id": "ref_g7h8i9j0k1l2",
          "formattedEntry": "Williams, R., Chen, L., & Park, S. (2023). Manual versus automated proofreading: A meta-analysis. Editing Studies, 8(1), 45–67.",
          "matchType": "fuzzy",
          "matchDetails": {
            "authorMatch": 1.0,
            "yearMatch": 1.0,
            "overallScore": 0.72
          }
        },
        "issues": [
          {
            "type": "style_warning",
            "code": "MISSING_DOI",
            "message": "Reference entry is missing a DOI. APA 7 requires a DOI for journal articles when available.",
            "suggestion": "Add the DOI: https://doi.org/10.1000/es.2023.0012",
            "severity": "warning"
          }
        ],
        "ignored": false,
        "createdAt": "2026-07-14T18:25:12.000Z"
      },
      {
        "id": "cit_h3i4j5k6l7m8",
        "inTextCitation": "(Chen, 2022)",
        "rawText": "(Chen, 2022)",
        "position": {
          "paragraphIndex": 18,
          "charStart": 340,
          "charEnd": 353,
          "context": "...a comprehensive framework for evaluating citation quality (Chen, 2022) was later challenged by..."
        },
        "extractedAuthors": ["Chen"],
        "extractedYear": 2022,
        "status": "no_match",
        "severity": "error",
        "confidence": 0.0,
        "matchedReference": null,
        "issues": [
          {
            "type": "no_match",
            "code": "CITATION_NOT_IN_REFERENCE_LIST",
            "message": "No matching reference found for (Chen, 2022) in the reference list.",
            "suggestion": "Add the full reference for Chen (2022) to your reference list, or check for spelling errors in the author name or year.",
            "severity": "error"
          }
        ],
        "ignored": false,
        "createdAt": "2026-07-14T18:25:12.000Z"
      }
    ]
  },
  "meta": {
    "requestId": "req_020",
    "pagination": {
      "cursor": "eyJpZCI6M30",
      "limit": 50,
      "hasMore": false
    }
  }
}
```

---

### 4.2 Get Reference Results

```
GET /documents/{documentId}/results/references
```

**Auth Required:** Yes

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `cursor` | string | null | Pagination cursor |
| `limit` | integer | 50 | Results per page (max 200) |
| `status` | string | null | Filter: `cited`, `orphaned`, `retracted`, `hallucinated` |
| `type` | string | null | Filter: `journal_article`, `book`, `chapter`, `website`, `conference`, `thesis`, `report`, `other` |

**Response (200 OK):**

```json
{
  "data": {
    "references": [
      {
        "id": "ref_s1t2u3v4w5x6",
        "position": 1,
        "rawEntry": "Smith, A. B., & Johnson, C. D. (2024). AI-powered citation verification in academic publishing. Journal of Scholarly Communication, 15(3), 112–128. https://doi.org/10.1000/jsc.2024.0045",
        "parsedMetadata": {
          "authors": [
            { "family": "Smith", "given": "A. B." },
            { "family": "Johnson", "given": "C. D." }
          ],
          "year": 2024,
          "title": "AI-powered citation verification in academic publishing",
          "journal": "Journal of Scholarly Communication",
          "volume": "15",
          "issue": "3",
          "pages": "112–128",
          "doi": "10.1000/jsc.2024.0045",
          "type": "journal_article"
        },
        "citedBy": ["cit_m1n2o3p4q5r6"],
        "citationCount": 1,
        "status": "cited",
        "externalValidation": {
          "status": "verified",
          "source": "crossref",
          "verified": true,
          "discrepancies": [],
          "crossrefMetadata": {
            "title": "AI-powered citation verification in academic publishing",
            "authors": ["Smith, A. B.", "Johnson, C. D."],
            "year": 2024,
            "journal": "Journal of Scholarly Communication",
            "doi": "10.1000/jsc.2024.0045"
          }
        },
        "retractionCheck": {
          "status": "clear",
          "isRetracted": false,
          "checkedAt": "2026-07-14T18:25:30.000Z"
        },
        "hallucinationCheck": {
          "status": "verified",
          "isLikelyHallucinated": false,
          "confidence": 0.98,
          "evidence": "DOI resolves to matching publication on Crossref"
        },
        "issues": [],
        "alphabeticalOrder": {
          "expected": 15,
          "actual": 15,
          "correct": true
        }
      },
      {
        "id": "ref_y7z8a9b0c1d2",
        "position": 22,
        "rawEntry": "Thompson, K. (2021). The future of academic writing tools. TechReview Online. Retrieved from https://techreview.example.com/academic-tools",
        "parsedMetadata": {
          "authors": [{ "family": "Thompson", "given": "K." }],
          "year": 2021,
          "title": "The future of academic writing tools",
          "source": "TechReview Online",
          "url": "https://techreview.example.com/academic-tools",
          "type": "website"
        },
        "citedBy": [],
        "citationCount": 0,
        "status": "orphaned",
        "externalValidation": null,
        "retractionCheck": null,
        "hallucinationCheck": {
          "status": "suspect",
          "isLikelyHallucinated": true,
          "confidence": 0.85,
          "evidence": "URL returns 404. No matching publication found on Crossref, OpenAlex, or Google Scholar."
        },
        "issues": [
          {
            "type": "orphaned_reference",
            "code": "REFERENCE_NOT_CITED",
            "message": "This reference is not cited anywhere in the document body.",
            "suggestion": "Either add an in-text citation for Thompson (2021) or remove this reference from the list.",
            "severity": "warning"
          },
          {
            "type": "hallucination_flag",
            "code": "POSSIBLY_FABRICATED",
            "message": "This reference could not be verified in any academic database. The URL returns a 404 error.",
            "suggestion": "Verify this source exists. If using AI-generated text, this citation may be fabricated.",
            "severity": "error"
          }
        ]
      }
    ]
  },
  "meta": {
    "requestId": "req_021",
    "pagination": { "cursor": null, "limit": 50, "hasMore": false }
  }
}
```

---

### 4.3 Get Annotated Document

```
GET /documents/{documentId}/results/annotated
```

**Auth Required:** Yes  
**Purpose:** Returns the full document text with inline annotations for the colour-coded view.

**Response (200 OK):**

```json
{
  "data": {
    "annotatedDocument": {
      "documentId": "doc_f7g8h9i0j1k2",
      "paragraphs": [
        {
          "index": 0,
          "type": "heading",
          "text": "Chapter 3: Literature Review",
          "annotations": []
        },
        {
          "index": 12,
          "type": "body",
          "text": "Recent findings suggest that AI-powered tools significantly reduce citation errors (Smith & Johnson, 2024). Furthermore, the impact on academic integrity has been well-documented.",
          "annotations": [
            {
              "citationId": "cit_m1n2o3p4q5r6",
              "charStart": 83,
              "charEnd": 108,
              "text": "(Smith & Johnson, 2024)",
              "status": "matched",
              "colour": "green"
            }
          ]
        },
        {
          "index": 15,
          "type": "body",
          "text": "This contradicts earlier research on manual proofreading effectiveness (Williams et al., 2023), which found that automated systems had higher false-positive rates.",
          "annotations": [
            {
              "citationId": "cit_a2b3c4d5e6f7",
              "charStart": 71,
              "charEnd": 95,
              "text": "(Williams et al., 2023)",
              "status": "possible_match",
              "colour": "orange"
            }
          ]
        }
      ],
      "referenceSection": {
        "startParagraph": 45,
        "heading": "References",
        "entries": 52
      }
    }
  },
  "meta": { "requestId": "req_022" }
}
```

---

### 4.4 Get Results Summary

```
GET /documents/{documentId}/results/summary
```

**Auth Required:** Yes

**Response (200 OK):**

```json
{
  "data": {
    "summary": {
      "documentId": "doc_f7g8h9i0j1k2",
      "citationStyle": "apa7",
      "wordCount": 4250,
      "overallScore": 82,
      "scoreBreakdown": {
        "citationMatching": 89,
        "styleCompliance": 75,
        "referenceCompleteness": 90,
        "externalVerification": 95
      },
      "counts": {
        "totalCitations": 47,
        "totalReferences": 52,
        "matched": 42,
        "possibleMatch": 3,
        "noMatch": 2,
        "orphanedReferences": 5,
        "styleWarnings": 8,
        "retractionFlags": 0,
        "hallucinationFlags": 1,
        "externalValidationIssues": 2,
        "ignoredCitations": 0
      },
      "topIssues": [
        {
          "code": "CITATION_NOT_IN_REFERENCE_LIST",
          "count": 2,
          "severity": "error",
          "description": "2 in-text citations have no matching reference"
        },
        {
          "code": "MISSING_DOI",
          "count": 4,
          "severity": "warning",
          "description": "4 journal article references are missing DOIs"
        },
        {
          "code": "ET_AL_USAGE",
          "count": 2,
          "severity": "warning",
          "description": "2 citations use 'et al.' incorrectly per APA 7 rules"
        }
      ],
      "referencsByType": {
        "journal_article": 35,
        "book": 8,
        "chapter": 4,
        "website": 3,
        "conference": 1,
        "thesis": 1
      },
      "processingTime": {
        "totalSeconds": 32,
        "parsing": 5,
        "citationExtraction": 7,
        "referenceMatching": 6,
        "externalValidation": 12,
        "retractionCheck": 2
      }
    }
  },
  "meta": { "requestId": "req_023" }
}
```

---

### 4.5 Get Style Warnings

```
GET /documents/{documentId}/results/style-warnings
```

**Auth Required:** Yes

**Response (200 OK):**

```json
{
  "data": {
    "styleWarnings": [
      {
        "id": "sw_a1b2c3",
        "citationId": "cit_a2b3c4d5e6f7",
        "referenceId": null,
        "code": "AMPERSAND_IN_NARRATIVE",
        "category": "punctuation",
        "message": "Use 'and' instead of '&' in narrative citations. The '&' symbol should only be used in parenthetical citations.",
        "location": {
          "paragraphIndex": 20,
          "charStart": 15,
          "charEnd": 50,
          "rawText": "Williams & Chen (2023) argued that..."
        },
        "suggestion": "Change to: Williams and Chen (2023)",
        "severity": "warning",
        "ruleSource": "rule_based",
        "styleGuideReference": "APA 7, Section 8.17"
      },
      {
        "id": "sw_d4e5f6",
        "citationId": null,
        "referenceId": "ref_g7h8i9j0k1l2",
        "code": "ALPHABETICAL_ORDER",
        "category": "formatting",
        "message": "Reference list is not in alphabetical order. 'Williams' should come after 'Wang', not before.",
        "location": {
          "paragraphIndex": 50,
          "charStart": 0,
          "charEnd": 120
        },
        "suggestion": "Move this reference entry after 'Wang, Z. (2023)...'",
        "severity": "warning",
        "ruleSource": "rule_based",
        "styleGuideReference": "APA 7, Section 9.44"
      }
    ]
  },
  "meta": { "requestId": "req_024" }
}
```

---

## 5. Citation Action Endpoints

### 5.1 Ignore Citation

```
POST /documents/{documentId}/citations/{citationId}/ignore
```

**Auth Required:** Yes

**Request Body:**

```json
{
  "reason": "This is a legal case citation, not an academic reference"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "citationId": "cit_h3i4j5k6l7m8",
    "ignored": true,
    "reason": "This is a legal case citation, not an academic reference",
    "ignoredAt": "2026-07-14T18:30:00.000Z"
  },
  "meta": { "requestId": "req_030" }
}
```

### 5.2 Unignore Citation

```
DELETE /documents/{documentId}/citations/{citationId}/ignore
```

**Auth Required:** Yes  
**Response (200 OK):**

```json
{
  "data": {
    "citationId": "cit_h3i4j5k6l7m8",
    "ignored": false,
    "unignoredAt": "2026-07-14T18:31:00.000Z"
  },
  "meta": { "requestId": "req_031" }
}
```

---

### 5.3 Adjust Reference Section Boundary

```
PUT /documents/{documentId}/reference-boundary
```

**Auth Required:** Yes  
**Purpose:** Manual correction of reference section detection (equivalent to Reciteworks' "Adjust" feature).

**Request Body:**

```json
{
  "referenceSections": [
    {
      "label": "References",
      "startParagraph": 45,
      "endParagraph": 52
    }
  ]
}
```

**Response (202 Accepted):**

```json
{
  "data": {
    "documentId": "doc_f7g8h9i0j1k2",
    "message": "Reference boundary updated. Re-analysis enqueued.",
    "status": "analysing"
  },
  "meta": { "requestId": "req_032" }
}
```

---

## 6. Export Endpoints

### 6.1 Export PDF Report

```
POST /documents/{documentId}/export/pdf
```

**Auth Required:** Yes  
**Tier Required:** Student+ (not available on Free)

**Request Body:**

```json
{
  "includeAnnotatedDocument": true,
  "includeSummary": true,
  "includeCitationDetails": true,
  "includeStyleWarnings": true,
  "includeExternalValidation": true
}
```

**Response (202 Accepted):**

```json
{
  "data": {
    "exportId": "exp_n1o2p3q4r5s6",
    "format": "pdf",
    "status": "generating",
    "statusUrl": "/api/v1/exports/exp_n1o2p3q4r5s6/status"
  },
  "meta": { "requestId": "req_040" }
}
```

### 6.2 Download Export

```
GET /exports/{exportId}/download
```

**Auth Required:** Yes

**Response (200 OK):**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="citepilot-report-doc_f7g8h9i0j1k2.pdf"`
- Binary PDF data

**Response (202 Accepted):** If export is still generating:

```json
{
  "data": {
    "exportId": "exp_n1o2p3q4r5s6",
    "status": "generating",
    "progress": 60
  },
  "meta": { "requestId": "req_041" }
}
```

### 6.3 Export CSV

```
POST /documents/{documentId}/export/csv
```

**Auth Required:** Yes  
**Tier Required:** Professional+

**Response (200 OK):**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="citepilot-citations-doc_f7g8h9i0j1k2.csv"`

---

## 7. Subscription Endpoints

### 7.1 Get Current Subscription

```
GET /user/subscription
```

**Auth Required:** Yes

**Response (200 OK):**

```json
{
  "data": {
    "subscription": {
      "id": "sub_t1u2v3w4x5y6",
      "tier": "student",
      "status": "active",
      "currentPeriodStart": "2026-07-01T00:00:00.000Z",
      "currentPeriodEnd": "2026-08-01T00:00:00.000Z",
      "cancelAtPeriodEnd": false,
      "stripeCustomerId": "cus_abc123",
      "stripeSubscriptionId": "sub_xyz789",
      "features": {
        "maxUploadsPerDay": 50,
        "maxWordCount": 50000,
        "maxReferences": 1000,
        "citationStyles": ["apa7", "apa6", "harvard", "vancouver", "chicago-author-date", "chicago-notes", "mla9", "ieee", "oscola", "turabian"],
        "aiExplanations": true,
        "crossrefValidation": false,
        "retractionCheck": false,
        "pdfExport": true,
        "apiAccess": false
      },
      "usage": {
        "uploadsToday": 3,
        "uploadsThisMonth": 45
      }
    }
  },
  "meta": { "requestId": "req_050" }
}
```

### 7.2 Create Checkout Session

```
POST /user/subscription/checkout
```

**Auth Required:** Yes

**Request Body:**

```json
{
  "tier": "professional",
  "billingCycle": "monthly",
  "successUrl": "https://citepilot.com/dashboard?checkout=success",
  "cancelUrl": "https://citepilot.com/pricing?checkout=cancelled"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_live_abc123...",
    "sessionId": "cs_live_abc123"
  },
  "meta": { "requestId": "req_051" }
}
```

### 7.3 Get Customer Portal URL

```
POST /user/subscription/portal
```

**Auth Required:** Yes

**Response (200 OK):**

```json
{
  "data": {
    "portalUrl": "https://billing.stripe.com/p/session/abc123..."
  },
  "meta": { "requestId": "req_052" }
}
```

---

## 8. User Endpoints

### 8.1 Get Current User Profile

```
GET /user/profile
```

**Auth Required:** Yes

**Response (200 OK):**

```json
{
  "data": {
    "user": {
      "id": "usr_a1b2c3d4e5f6",
      "email": "jane.doe@university.edu",
      "name": "Jane Doe",
      "role": "student",
      "tier": "student",
      "organisationId": null,
      "organisationName": null,
      "preferences": {
        "defaultCitationStyle": "apa7",
        "emailNotifications": true,
        "darkMode": false
      },
      "createdAt": "2026-01-15T10:00:00.000Z",
      "lastLoginAt": "2026-07-14T18:00:00.000Z"
    }
  },
  "meta": { "requestId": "req_060" }
}
```

### 8.2 Update User Profile

```
PATCH /user/profile
```

**Auth Required:** Yes

**Request Body:**

```json
{
  "name": "Dr. Jane Doe",
  "preferences": {
    "defaultCitationStyle": "harvard",
    "emailNotifications": false
  }
}
```

**Response (200 OK):** Updated user object.

### 8.3 Delete Account

```
DELETE /user/account
```

**Auth Required:** Yes

**Request Body:**

```json
{
  "confirmEmail": "jane.doe@university.edu",
  "reason": "No longer needed"
}
```

**Response (204 No Content)**

Triggers: cancel Stripe subscription, delete all documents, anonymise user record, send confirmation email.

---

## 9. API Key Endpoints (Professional+ Tier)

### 9.1 List API Keys

```
GET /user/api-keys
```

**Auth Required:** Yes  
**Tier Required:** Professional+

**Response (200 OK):**

```json
{
  "data": {
    "apiKeys": [
      {
        "id": "key_a1b2c3d4",
        "name": "Production Integration",
        "prefix": "cp_live_a1b2",
        "lastUsedAt": "2026-07-14T15:00:00.000Z",
        "createdAt": "2026-06-01T10:00:00.000Z",
        "expiresAt": "2027-06-01T10:00:00.000Z"
      }
    ]
  },
  "meta": { "requestId": "req_070" }
}
```

### 9.2 Create API Key

```
POST /user/api-keys
```

**Auth Required:** Yes  
**Tier Required:** Professional+

**Request Body:**

```json
{
  "name": "Production Integration",
  "expiresInDays": 365
}
```

**Response (201 Created):**

```json
{
  "data": {
    "apiKey": {
      "id": "key_a1b2c3d4",
      "name": "Production Integration",
      "key": "cp_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4",
      "prefix": "cp_live_a1b2",
      "expiresAt": "2027-07-14T18:25:00.000Z",
      "createdAt": "2026-07-14T18:25:00.000Z"
    },
    "warning": "This is the only time the full API key will be shown. Store it securely."
  },
  "meta": { "requestId": "req_071" }
}
```

### 9.3 Revoke API Key

```
DELETE /user/api-keys/{keyId}
```

**Auth Required:** Yes  
**Response (204 No Content)**

---

## 10. Institutional Admin Endpoints

All endpoints in this section require the `institutional_admin` role and an active Institutional subscription.

### 10.1 List Organisation Members

```
GET /admin/organisation/members
```

**Auth Required:** Yes (institutional_admin)

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `cursor` | string | null | Pagination cursor |
| `limit` | integer | 25 | Results per page |
| `role` | string | null | Filter: `member`, `admin` |
| `status` | string | null | Filter: `active`, `suspended`, `invited` |

**Response (200 OK):**

```json
{
  "data": {
    "members": [
      {
        "id": "usr_a1b2c3d4e5f6",
        "email": "jane.doe@university.edu",
        "name": "Jane Doe",
        "role": "member",
        "status": "active",
        "usage": {
          "documentsThisMonth": 12,
          "lastActiveAt": "2026-07-14T15:00:00.000Z"
        },
        "joinedAt": "2026-03-01T10:00:00.000Z"
      }
    ],
    "seats": {
      "total": 100,
      "used": 67,
      "available": 33
    }
  },
  "meta": {
    "requestId": "req_080",
    "pagination": { "cursor": null, "limit": 25, "hasMore": true }
  }
}
```

### 10.2 Invite Members

```
POST /admin/organisation/members/invite
```

**Auth Required:** Yes (institutional_admin)

**Request Body:**

```json
{
  "emails": [
    "student1@university.edu",
    "student2@university.edu",
    "student3@university.edu"
  ],
  "role": "member"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "invitations": [
      { "email": "student1@university.edu", "status": "sent" },
      { "email": "student2@university.edu", "status": "sent" },
      { "email": "student3@university.edu", "status": "already_member" }
    ]
  },
  "meta": { "requestId": "req_081" }
}
```

### 10.3 Remove Member

```
DELETE /admin/organisation/members/{userId}
```

**Auth Required:** Yes (institutional_admin)  
**Response (204 No Content)**

### 10.4 Get Organisation Usage Analytics

```
GET /admin/organisation/analytics
```

**Auth Required:** Yes (institutional_admin)

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `startDate` | date | 30 days ago | Analytics start date |
| `endDate` | date | today | Analytics end date |
| `granularity` | string | `daily` | `daily`, `weekly`, `monthly` |

**Response (200 OK):**

```json
{
  "data": {
    "analytics": {
      "period": {
        "start": "2026-06-14",
        "end": "2026-07-14"
      },
      "summary": {
        "totalDocuments": 1250,
        "totalCitations": 45000,
        "averageIssuesPerDocument": 4.2,
        "mostUsedStyle": "apa7",
        "activeUsers": 45,
        "totalUsers": 67
      },
      "timeSeries": [
        {
          "date": "2026-07-14",
          "documentsProcessed": 42,
          "activeUsers": 18,
          "citationsChecked": 1540,
          "issuesFound": 180
        }
      ],
      "topIssues": [
        { "code": "MISSING_DOI", "count": 450 },
        { "code": "CITATION_NOT_IN_REFERENCE_LIST", "count": 230 },
        { "code": "ET_AL_USAGE", "count": 180 }
      ],
      "styleDistribution": {
        "apa7": 850,
        "harvard": 250,
        "vancouver": 100,
        "chicago-author-date": 50
      }
    }
  },
  "meta": { "requestId": "req_082" }
}
```

### 10.5 Configure Organisation SSO

```
PUT /admin/organisation/sso
```

**Auth Required:** Yes (institutional_admin)  
**Tier Required:** Institutional

**Request Body:**

```json
{
  "provider": "saml",
  "entityId": "https://idp.university.edu/saml",
  "ssoUrl": "https://idp.university.edu/saml/sso",
  "certificate": "-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----",
  "emailDomains": ["university.edu", "research.university.edu"]
}
```

**Response (200 OK):**

```json
{
  "data": {
    "sso": {
      "provider": "saml",
      "status": "active",
      "entityId": "https://idp.university.edu/saml",
      "emailDomains": ["university.edu", "research.university.edu"],
      "autoProvision": true,
      "updatedAt": "2026-07-14T18:25:00.000Z"
    }
  },
  "meta": { "requestId": "req_083" }
}
```

---

## 11. Webhook Configuration (Professional+ Tier)

### 11.1 Register Webhook

```
POST /user/webhooks
```

**Auth Required:** Yes  
**Tier Required:** Professional+

**Request Body:**

```json
{
  "url": "https://my-app.example.com/webhooks/citepilot",
  "events": ["document.analysis_complete", "document.validation_complete", "document.failed"],
  "secret": "whsec_my_signing_secret_123"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "webhook": {
      "id": "wh_a1b2c3d4",
      "url": "https://my-app.example.com/webhooks/citepilot",
      "events": ["document.analysis_complete", "document.validation_complete", "document.failed"],
      "status": "active",
      "createdAt": "2026-07-14T18:25:00.000Z"
    }
  },
  "meta": { "requestId": "req_090" }
}
```

### 11.2 Webhook Payload Format

```json
{
  "event": "document.analysis_complete",
  "timestamp": "2026-07-14T18:25:30.000Z",
  "data": {
    "documentId": "doc_f7g8h9i0j1k2",
    "status": "analysed",
    "summary": {
      "totalCitations": 47,
      "matched": 42,
      "issues": 5
    },
    "resultsUrl": "https://api.citepilot.com/api/v1/documents/doc_f7g8h9i0j1k2/results"
  },
  "signature": "sha256=abc123..."
}
```

---

## 12. Rate Limit Summary by Endpoint

| Endpoint | Free | Student | Professional | Institutional |
|---|---|---|---|---|
| `POST /auth/register` | 5/hr/IP | 5/hr/IP | 5/hr/IP | 5/hr/IP |
| `POST /auth/login` | 10/min/IP | 10/min/IP | 10/min/IP | 10/min/IP |
| `POST /documents/upload` | 3/day | 50/day | 500/day | 2000/day |
| `POST /documents/paste` | 3/day | 50/day | 500/day | 2000/day |
| `GET /documents/*` | 60/min | 120/min | 300/min | 600/min |
| `GET /results/*` | 60/min | 120/min | 300/min | 600/min |
| `POST /export/*` | — | 10/day | 100/day | 500/day |
| API key access | — | — | 1000/day | 10,000/day |
| `POST /admin/*` | — | — | — | 120/min |
