# Monitoring & Observability Plan

This document details the configuration, logging schemas, monitoring tools, tracing models, and alert escalation paths for the CitePilot platform.

---

## 1. System Logging Specifications

CitePilot uses structured JSON logging across all backend microservices.

### 1.1 Python FastAPI Logging Configuration
```python
import structlog

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)
```

### 1.2 Log Schema Schema Standard
```json
{
  "timestamp": "2026-07-15T17:45:00Z",
  "level": "info",
  "service": "ai-processing-service",
  "correlation_id": "corr_abc123xyz789",
  "user_id": "usr_9988",
  "document_id": "doc_4411",
  "message": "AI extraction process completed successfully",
  "metrics": {
    "execution_time_ms": 1420,
    "input_tokens": 1205,
    "output_tokens": 340
  }
}
```

---

## 2. Key Metrics & Observability Dashboard

### 2.1 Application Metrics (SLIs)
- **HTTP Latency**: 95th and 99th percentile response time for `GET /documents/{id}/results`. Target: $\le 1.5s$.
- **Error Rates**: Percentage of 5xx HTTP responses. Target: $\le 0.1\%$.
- **Queue Wait Time**: Time document spends in the processing queue. Target: $\le 3s$.

### 2.2 AI Layer Quality Metrics
- **Model Success Rate**: Ratio of successful AI inference calls to failed/timed-out calls.
- **Cache Hit Rate**: Hits on cached Crossref query records to limit outgoing registry requests.
- **Latency per 1k Tokens**: AI model processing speed baseline.

---

## 3. Alerts & Escalation Matrix

CitePilot defines four alert severity tiers integrated with PagerDuty:

| Severity | Alert Rule | Notification Target | SLA Response |
|---|---|---|---|
| **P1 - Critical** | HTTP 5xx error rate $\ge 3\%$ for 3 mins | On-Call PagerDuty (Phone Call) | 15 minutes |
| **P2 - High** | AI queue processing backlog $\ge 50$ docs | On-Call PagerDuty (SMS / App) | 30 minutes |
| **P3 - Warning** | External API rate limits hit (Crossref, etc.) | Slack channel `#ops-alerts` | 4 hours |
| **P4 - Info** | System deployments and scaling events | Slack channel `#ops-info` | Next business day |

---

## 4. Distributed Tracing Architecture

Distributed tracing uses OpenTelemetry to pass correlation contexts across API requests, background task processors, and the Python AI module:

```
[Browser Request]
       │ (traceparent header)
       ▼
[Next.js Frontend]
       │ (REST / Axios Call)
       ▼
[Node.js API Gateway]
       │ (HTTP context propagation)
       ▼
[FastAPI AI Processing] ─── (Trace Context) ───► [Crossref REST API]
```
- **Context Propagation**: Using W3C Trace Context standard (`traceparent` header).
- **Visualization**: Aggregate traces inside Datadog or OpenTelemetry collectors.
- **Database Tracking**: Instrument SQL queries via SQLAlchemy tracing in Python and Prisma tracing in JavaScript.
