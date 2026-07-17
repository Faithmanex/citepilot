# Incident Response Plan

This document establishes the incident management framework, escalation paths, communication strategies, and post-mortem procedures for CitePilot.

---

## 1. Incident Classification Framework

When an operational incident occurs, the on-call engineer classifies it into one of four severity levels:

| Severity | Definition | Examples | Response SLA |
|---|---|---|---|
| **SEV 1 (Critical)** | Core service is completely down or user data is exposed. | Database unreachable, payment pipeline failure, active data breach. | 15 mins (24/7) |
| **SEV 2 (High)** | Major features are disabled, degradation affects multiple users. | AI processing failing, document uploads failing, PDF export disabled. | 30 mins (24/7) |
| **SEV 3 (Medium)** | Non-critical functionality is degraded, workarounds exist. | Stripe dashboard stats slow, formatting style preview failing. | 4 hours (Biz hours)|
| **SEV 4 (Low)** | Small cosmetic or minor functional issues. | Typo in help page, support widget button misalignment. | Next business day |

---

## 2. On-Call Incident Response Checklist

When a SEV 1 or SEV 2 alert triggers, follow this sequence:

```
[ALERT TRIGGERED]
       │
       ▼
 1. Acknowledge Alert (PagerDuty)
       │
       ▼
 2. Appoint Incident Commander (IC)
       │
       ▼
 3. Open Slack Channel #inc-yyyy-mm-dd-name
       │
       ▼
 4. Diagnose and Apply Workarounds / Rollbacks
       │
       ▼
 5. Post Status Updates (Statuspage.io every 30 mins)
       │
       ▼
 6. Resolve Incident and Schedule Post-Mortem
```

---

## 3. Communication Templates

### 3.1 Statuspage.io Notification (SEV 1 - Outage)
> **Title**: Identifying Document Processing Issues
> **Message**: We are currently investigating reports of document processing failures. Uploads are failing or timing out. Our engineering team is actively diagnosing the root cause. Further updates will be posted here as they become available.
> **Affected Systems**: Document Processing, AI Analysis.

### 3.2 Resolution Update
> **Title**: Document Processing Restored
> **Message**: The issue causing document processing failures has been resolved. The processing queue backlog has cleared, and system performance is back to normal baseline operations. We apologize for the inconvenience.

---

## 4. Post-Mortem Process

Every SEV 1 or SEV 2 incident requires a blameless post-mortem review within **48 hours** of resolution.

### 4.1 Post-Mortem Action Template
1. **Summary**: Describe what happened, how users were affected, and the final resolution.
2. **Timeline**: Exact times of detection, response, mitigation, and resolution (with logs).
3. **Root Cause**: Five-Whys analysis of the failure source.
4. **Action Items**: Preventative measures to ensure this specific failure pattern cannot reoccur. Include Jira tickets and assignments.
5. **Lessons Learned**: What went well, what went poorly, and where our alerts/runbooks failed.
