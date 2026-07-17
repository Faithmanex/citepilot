# Operational Runbooks

**CitePilot — AI-Powered Citation Consistency Checker**

**Last Updated:** July 14, 2026

---

## Overview

This document contains step-by-step operational procedures for the CitePilot platform. Each runbook is a self-contained procedure that can be followed by any on-call engineer or operations team member. Procedures assume access to the AWS Console, GitHub repository, and relevant CLI tools.

**Prerequisites for all runbooks:**
- AWS CLI configured with appropriate IAM credentials
- `kubectl` configured for the ECS/Fargate cluster (if applicable)
- Access to the GitHub `citepilot` organisation
- Access to Datadog, Sentry, and PagerDuty dashboards
- 1Password vault access for secrets

---

## Table of Contents

1. [Deploy a New Release](#1-deploy-a-new-release)
2. [Rollback a Failed Deployment](#2-rollback-a-failed-deployment)
3. [Handle Database Migration](#3-handle-database-migration)
4. [Restart a Crashed Service](#4-restart-a-crashed-service)
5. [Rotate API Keys and Secrets](#5-rotate-api-keys-and-secrets)
6. [Scale Services Up or Down](#6-scale-services-up-or-down)
7. [Clear Redis Cache](#7-clear-redis-cache)
8. [Investigate Slow AI Inference](#8-investigate-slow-ai-inference)
9. [Handle Crossref API Outage](#9-handle-crossref-api-outage)
10. [Respond to User Data Deletion Request](#10-respond-to-user-data-deletion-request)
11. [Onboard a New Team Member to Infrastructure](#11-onboard-a-new-team-member-to-infrastructure)

---

## 1. Deploy a New Release

**When to use:** Deploying a new version of any CitePilot service to production.

**Estimated time:** 15–30 minutes

**Risk level:** Medium

### Pre-Deployment Checklist

- [ ] All CI checks (linting, type checking, unit tests, integration tests) pass on the `main` branch
- [ ] Code review approved by at least 2 reviewers
- [ ] Staging deployment completed and smoke-tested
- [ ] Database migrations reviewed and tested (if applicable — see [Runbook 3](#3-handle-database-migration))
- [ ] Changelog entry written
- [ ] No active SEV1/SEV2 incidents

### Procedure

**Step 1: Create a release tag**

```bash
git checkout main
git pull origin main
git tag -a v1.X.Y -m "Release v1.X.Y: <brief description>"
git push origin v1.X.Y
```

**Step 2: Monitor the GitHub Actions deployment pipeline**

The tag push triggers the production deployment workflow (`.github/workflows/deploy-production.yml`).

1. Navigate to GitHub → Actions → "Deploy to Production" workflow
2. Confirm the workflow has been triggered for the correct tag
3. Monitor the following stages:
   - **Build:** Docker images for `api-gateway` (Node.js), `ai-processor` (Python FastAPI), and `web` (Next.js) are built and pushed to Amazon ECR
   - **Migrate:** Database migrations run against the production RDS instance (if any pending)
   - **Deploy:** ECS services are updated with the new task definitions
   - **Health check:** Automated health checks verify each service is responding

**Step 3: Verify rolling deployment**

```bash
# Check ECS service deployment status
aws ecs describe-services \
  --cluster citepilot-prod \
  --services api-gateway ai-processor web \
  --query 'services[*].{name:serviceName,desired:desiredCount,running:runningCount,deployments:deployments[*].{status:status,running:runningCount,desired:desiredCount,rollout:rolloutState}}' \
  --output table
```

Wait until all services show `COMPLETED` rollout state with the new task definition revision.

**Step 4: Post-deployment smoke test**

Run the automated smoke test suite against production:

```bash
# Run smoke tests
cd tests/smoke
ENVIRONMENT=production npx playwright test smoke.spec.ts
```

Manually verify:
1. Landing page loads at citepilot.com
2. Login flow works (Google OAuth)
3. Document upload completes (use `tests/fixtures/sample-apa7.docx`)
4. Analysis results display correctly
5. API health endpoint returns `200`: `curl https://api.citepilot.com/health`

**Step 5: Monitor for 30 minutes**

1. Watch Datadog dashboard "CitePilot Production Overview" for:
   - Error rate spike (threshold: >1% of requests)
   - Latency increase (threshold: p95 >2s for web, >10s for AI processing)
   - 5xx response rate (threshold: >0.5%)
2. Check Sentry for new unhandled exceptions tagged with the new release version
3. Monitor BullMQ dashboard for queue backlog

**Step 6: Announce the deployment**

Post in Slack `#deployments`:
```
:rocket: **Production deployment complete**
Version: v1.X.Y
Services: api-gateway, ai-processor, web
Changelog: <link to changelog>
Status: All services healthy
```

### Rollback Trigger

Initiate [Runbook 2](#2-rollback-a-failed-deployment) if any of the following occur:
- Error rate exceeds 5% for more than 5 minutes
- Any service fails to reach a healthy state within 10 minutes
- Critical user-facing functionality is broken (upload, analysis, login)

---

## 2. Rollback a Failed Deployment

**When to use:** A production deployment has introduced a critical issue that cannot be hotfixed quickly.

**Estimated time:** 5–15 minutes

**Risk level:** High — act quickly, communicate clearly

### Procedure

**Step 1: Identify the previous stable version**

```bash
# List recent task definition revisions for the affected service
aws ecs describe-services \
  --cluster citepilot-prod \
  --services <service-name> \
  --query 'services[0].deployments[*].{status:status,taskDef:taskDefinition,created:createdAt}' \
  --output table
```

Note the task definition ARN of the previous `PRIMARY` deployment.

**Step 2: Roll back the ECS service**

```bash
# Update the service to use the previous task definition
aws ecs update-service \
  --cluster citepilot-prod \
  --service <service-name> \
  --task-definition <previous-task-definition-arn> \
  --force-new-deployment
```

Repeat for each affected service.

**Step 3: If database migrations were applied**

If the failed release included database migrations:

1. **Do NOT automatically roll back migrations** — assess whether the previous code version is compatible with the new schema
2. If the migration is backwards-compatible (additive only — new columns, new tables), no migration rollback is needed
3. If the migration is breaking (renamed or dropped columns), execute the down migration:

```bash
# Connect to production database via bastion
ssh -L 5432:citepilot-prod-rds.xxxx.eu-west-1.rds.amazonaws.com:5432 bastion-prod

# In a new terminal, run the down migration
DATABASE_URL="postgresql://citepilot_app:****@localhost:5432/citepilot_prod" \
  npx prisma migrate resolve --rolled-back <migration-name>
```

**Step 4: Verify rollback**

```bash
# Confirm the service is running the previous task definition
aws ecs describe-services \
  --cluster citepilot-prod \
  --services <service-name> \
  --query 'services[0].{taskDef:taskDefinition,status:status,running:runningCount}'
```

Run the smoke test suite and verify the issue is resolved.

**Step 5: Communicate**

1. Update the incident channel in Slack
2. Update status.citepilot.com if users were affected
3. Create a post-mortem issue in GitHub

```
:warning: **Production rollback executed**
Version rolled back: v1.X.Y → v1.X.(Y-1)
Services: <affected services>
Reason: <brief description>
User impact: <description>
Post-mortem: <link>
```

---

## 3. Handle Database Migration

**When to use:** A release includes schema changes to the PostgreSQL production database.

**Estimated time:** 10–60 minutes (depending on table sizes and migration complexity)

**Risk level:** High

### Pre-Migration Checklist

- [ ] Migration SQL reviewed by at least 2 engineers
- [ ] Migration tested on a staging database with production-like data volume
- [ ] Backwards compatibility verified: the current running application code works with the new schema
- [ ] Down migration (rollback) script exists and has been tested
- [ ] Database backup taken (Step 1 below)
- [ ] Maintenance window communicated if migration requires table locks on large tables

### Procedure

**Step 1: Create a pre-migration snapshot**

```bash
aws rds create-db-snapshot \
  --db-instance-identifier citepilot-prod-primary \
  --db-snapshot-identifier pre-migration-$(date +%Y%m%d-%H%M%S)
```

Wait for the snapshot to complete:

```bash
aws rds wait db-snapshot-available \
  --db-snapshot-identifier pre-migration-$(date +%Y%m%d-%H%M%S)
```

**Step 2: Check for active long-running queries**

```bash
# Connect via bastion
ssh -L 5432:citepilot-prod-rds.xxxx.eu-west-1.rds.amazonaws.com:5432 bastion-prod

# Check active queries
psql -h localhost -U citepilot_admin -d citepilot_prod -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
AND state != 'idle'
ORDER BY duration DESC;
"
```

If there are long-running queries that would conflict with the migration (e.g., holding locks on tables being altered), wait for them to complete or terminate them with `SELECT pg_terminate_backend(<pid>);`.

**Step 3: Run the migration**

```bash
# Run Prisma migration
DATABASE_URL="postgresql://citepilot_admin:****@localhost:5432/citepilot_prod" \
  npx prisma migrate deploy
```

**Step 4: Verify migration**

```bash
# Check migration status
DATABASE_URL="postgresql://citepilot_admin:****@localhost:5432/citepilot_prod" \
  npx prisma migrate status

# Verify new schema elements exist
psql -h localhost -U citepilot_admin -d citepilot_prod -c "\dt"  # list tables
psql -h localhost -U citepilot_admin -d citepilot_prod -c "\d <table_name>"  # describe specific table
```

**Step 5: Monitor application health**

Check Datadog for:
- Database connection pool exhaustion
- Query error rate increase
- Slow query alerts (queries >1s)

### Migration Rollback

If the migration causes issues:

1. Run the down migration script
2. If down migration fails, restore from the pre-migration snapshot:

```bash
# This replaces the entire database instance — last resort
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier citepilot-prod-primary-restored \
  --db-snapshot-identifier pre-migration-<timestamp>
```

3. Update the application DNS/connection string to point to the restored instance

---

## 4. Restart a Crashed Service

**When to use:** A service (api-gateway, ai-processor, or web) is unresponsive or in a crash loop.

**Estimated time:** 5–10 minutes

**Risk level:** Low-Medium

### Procedure

**Step 1: Identify the affected service and failure mode**

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster citepilot-prod \
  --services api-gateway ai-processor web \
  --query 'services[*].{name:serviceName,desired:desiredCount,running:runningCount,pending:pendingCount}' \
  --output table
```

```bash
# Check recent events for the affected service
aws ecs describe-services \
  --cluster citepilot-prod \
  --services <service-name> \
  --query 'services[0].events[:10]' \
  --output table
```

**Step 2: Check container logs**

```bash
# Fetch recent logs from CloudWatch
aws logs tail /ecs/citepilot-prod/<service-name> \
  --since 30m \
  --format short
```

Look for:
- `OutOfMemoryError` → service needs more memory (see [Runbook 6](#6-scale-services-up-or-down))
- Connection refused errors → downstream dependency issue
- Unhandled exception stack traces → application bug (hotfix or rollback needed)
- Health check failures → check health endpoint and dependencies

**Step 3: Force a new deployment (restart all tasks)**

```bash
aws ecs update-service \
  --cluster citepilot-prod \
  --service <service-name> \
  --force-new-deployment
```

This performs a rolling restart, replacing tasks one at a time to maintain availability.

**Step 4: For an immediate restart of a specific task**

```bash
# List running tasks
aws ecs list-tasks \
  --cluster citepilot-prod \
  --service-name <service-name> \
  --output text

# Stop a specific task (ECS will automatically launch a replacement)
aws ecs stop-task \
  --cluster citepilot-prod \
  --task <task-arn> \
  --reason "Manual restart: <reason>"
```

**Step 5: Verify recovery**

```bash
# Watch tasks until the new tasks are RUNNING
aws ecs describe-tasks \
  --cluster citepilot-prod \
  --tasks $(aws ecs list-tasks --cluster citepilot-prod --service-name <service-name> --output text --query 'taskArns[*]') \
  --query 'tasks[*].{id:taskArn,status:lastStatus,health:healthStatus,started:startedAt}' \
  --output table
```

Check the health endpoint:
```bash
curl -s https://api.citepilot.com/health | jq .
# Expected: {"status":"healthy","services":{"database":"connected","redis":"connected","openai":"reachable"}}
```

---

## 5. Rotate API Keys and Secrets

**When to use:** Quarterly scheduled rotation, after a suspected compromise, or when an employee with access leaves the team.

**Estimated time:** 30–60 minutes

**Risk level:** Medium — incorrect rotation causes service outage

### Secrets Inventory

| Secret | Location | Rotation Frequency |
|--------|----------|-------------------|
| OpenAI API key | AWS Secrets Manager: `citepilot/prod/openai` | Quarterly |
| Crossref API key (Polite Pool) | AWS Secrets Manager: `citepilot/prod/crossref` | Annually |
| PubMed API key (E-utilities) | AWS Secrets Manager: `citepilot/prod/pubmed` | Annually |
| Stripe secret key | AWS Secrets Manager: `citepilot/prod/stripe` | Quarterly |
| Stripe webhook signing secret | AWS Secrets Manager: `citepilot/prod/stripe-webhook` | Quarterly |
| NextAuth secret | AWS Secrets Manager: `citepilot/prod/nextauth` | Quarterly |
| Google OAuth client secret | AWS Secrets Manager: `citepilot/prod/google-oauth` | Annually |
| Microsoft OAuth client secret | AWS Secrets Manager: `citepilot/prod/microsoft-oauth` | Annually |
| Database password (app user) | AWS Secrets Manager: `citepilot/prod/db-app` | Quarterly |
| Database password (admin user) | AWS Secrets Manager: `citepilot/prod/db-admin` | Quarterly |
| Redis AUTH password | AWS Secrets Manager: `citepilot/prod/redis` | Quarterly |
| Sentry DSN | AWS Secrets Manager: `citepilot/prod/sentry` | Annually |
| Datadog API key | AWS Secrets Manager: `citepilot/prod/datadog` | Annually |

### Procedure (Example: OpenAI API Key)

**Step 1: Generate a new key**

1. Log in to https://platform.openai.com
2. Navigate to API Keys → Create new secret key
3. Name it `citepilot-prod-YYYYMMDD`
4. Copy the key immediately (it will not be shown again)

**Step 2: Update the secret in AWS Secrets Manager**

```bash
aws secretsmanager update-secret \
  --secret-id citepilot/prod/openai \
  --secret-string '{"api_key":"sk-proj-NEW_KEY_HERE"}'
```

**Step 3: Restart the service that uses this secret**

ECS tasks read secrets at launch time. Force a new deployment to pick up the new value:

```bash
aws ecs update-service \
  --cluster citepilot-prod \
  --service ai-processor \
  --force-new-deployment
```

**Step 4: Verify the new key is working**

```bash
# Check AI processor logs for successful OpenAI calls
aws logs tail /ecs/citepilot-prod/ai-processor --since 5m --format short | grep -i "openai"
```

Submit a test document and verify analysis completes successfully.

**Step 5: Revoke the old key**

1. Return to https://platform.openai.com → API Keys
2. Find the old key (`citepilot-prod-PREVIOUSDATE`) and delete it

**Step 6: Document the rotation**

Update the rotation log in 1Password:
- Date rotated
- Who performed the rotation
- Reason (scheduled/incident)
- Old key identifier (for audit trail)

### Database Password Rotation

Database password rotation is more complex because it requires updating both the RDS user and the application secret:

```bash
# 1. Connect to RDS via bastion and change the password
psql -h localhost -U citepilot_admin -d citepilot_prod -c \
  "ALTER USER citepilot_app PASSWORD 'NEW_SECURE_PASSWORD';"

# 2. Update Secrets Manager
aws secretsmanager update-secret \
  --secret-id citepilot/prod/db-app \
  --secret-string '{"username":"citepilot_app","password":"NEW_SECURE_PASSWORD","host":"citepilot-prod-rds.xxxx.eu-west-1.rds.amazonaws.com","port":"5432","dbname":"citepilot_prod"}'

# 3. Restart all services that connect to the database
aws ecs update-service --cluster citepilot-prod --service api-gateway --force-new-deployment
aws ecs update-service --cluster citepilot-prod --service ai-processor --force-new-deployment
aws ecs update-service --cluster citepilot-prod --service web --force-new-deployment
```

---

## 6. Scale Services Up or Down

**When to use:** Responding to traffic spikes, handling increased AI processing load, or reducing costs during low-traffic periods.

**Estimated time:** 5–15 minutes

**Risk level:** Low

### Current Service Configuration

| Service | Min Tasks | Max Tasks | CPU | Memory | Auto-Scaling Metric |
|---------|-----------|-----------|-----|--------|---------------------|
| web | 2 | 8 | 512 | 1024 MB | CPU >70% for 3 min |
| api-gateway | 2 | 10 | 512 | 1024 MB | Request count >1000/min |
| ai-processor | 2 | 20 | 1024 | 2048 MB | BullMQ queue depth >50 |

### Manual Scaling

**Scale up immediately (e.g., during a traffic spike):**

```bash
# Increase the desired count for a service
aws ecs update-service \
  --cluster citepilot-prod \
  --service <service-name> \
  --desired-count <new-count>
```

**Scale down (e.g., returning to normal after a spike):**

```bash
aws ecs update-service \
  --cluster citepilot-prod \
  --service <service-name> \
  --desired-count <original-count>
```

### Adjusting Auto-Scaling Policies

```bash
# View current scaling policies
aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --resource-id service/citepilot-prod/<service-name>

# Update target tracking policy (e.g., change CPU target from 70% to 60%)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/citepilot-prod/<service-name> \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-tracking \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 60.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'
```

### Vertical Scaling (Changing CPU/Memory)

To change the CPU or memory allocation, update the task definition:

1. Download the current task definition:
```bash
aws ecs describe-task-definition \
  --task-definition <task-family> \
  --query 'taskDefinition' > task-def.json
```

2. Edit `task-def.json`: update `cpu` and `memory` values
3. Register the new task definition:
```bash
aws ecs register-task-definition --cli-input-json file://task-def.json
```
4. Update the service to use the new task definition:
```bash
aws ecs update-service \
  --cluster citepilot-prod \
  --service <service-name> \
  --task-definition <new-task-def-arn>
```

---

## 7. Clear Redis Cache

**When to use:** Stale cache data is causing incorrect behaviour, after a schema change that affects cached data, or to free memory.

**Estimated time:** 2–5 minutes

**Risk level:** Low-Medium — temporary performance degradation as caches repopulate

### Redis Namespace Structure

| Namespace/Prefix | Contents | Impact of Clearing |
|-----------------|----------|-------------------|
| `session:*` | User sessions | All users will be logged out |
| `ratelimit:*` | Rate limiting counters | Rate limits reset; users can temporarily exceed limits |
| `cache:crossref:*` | Cached Crossref API responses | Increased Crossref API calls until cache repopulates |
| `cache:openalex:*` | Cached OpenAlex API responses | Increased OpenAlex API calls |
| `cache:doi:*` | Cached DOI resolution results | Increased DOI.org API calls |
| `queue:*` | BullMQ job queues | **DO NOT CLEAR** — will lose pending analysis jobs |
| `analysis:*` | In-progress analysis state | **DO NOT CLEAR** while analyses are running |

### Procedure

**Step 1: Connect to Redis**

```bash
# Connect via bastion to ElastiCache Redis
ssh -L 6379:citepilot-prod-redis.xxxx.cache.amazonaws.com:6379 bastion-prod

# In a new terminal
redis-cli -h localhost -p 6379 --tls -a <redis-password>
```

**Step 2: Clear specific namespaces (preferred)**

```bash
# Clear only Crossref cache
redis-cli -h localhost -p 6379 --tls -a <password> --scan --pattern "cache:crossref:*" | xargs -L 100 redis-cli -h localhost -p 6379 --tls -a <password> DEL

# Clear all external API caches
redis-cli -h localhost -p 6379 --tls -a <password> --scan --pattern "cache:*" | xargs -L 100 redis-cli -h localhost -p 6379 --tls -a <password> DEL

# Clear rate limit counters
redis-cli -h localhost -p 6379 --tls -a <password> --scan --pattern "ratelimit:*" | xargs -L 100 redis-cli -h localhost -p 6379 --tls -a <password> DEL
```

**Step 3: Full cache flush (last resort)**

```bash
# WARNING: This clears ALL data including sessions and rate limits
# DO NOT USE if there are pending jobs in the queue
redis-cli -h localhost -p 6379 --tls -a <password> FLUSHDB
```

**Step 4: Verify**

```bash
# Check key count
redis-cli -h localhost -p 6379 --tls -a <password> DBSIZE

# Verify queues are intact (if selective clear)
redis-cli -h localhost -p 6379 --tls -a <password> --scan --pattern "queue:*" | head -20
```

**Step 5: Monitor cache repopulation**

Watch Datadog for:
- Increased response times as caches warm up (expected, temporary)
- Elevated external API call rates (Crossref, OpenAlex)
- Redis memory usage returning to normal levels

---

## 8. Investigate Slow AI Inference

**When to use:** Users report slow document analysis, or Datadog alerts on AI processing latency exceeding thresholds (p95 >15s per document).

**Estimated time:** 15–45 minutes (investigation)

**Risk level:** Low (investigation only)

### Diagnostic Procedure

**Step 1: Check OpenAI API status**

Visit https://status.openai.com — if there is an active incident, the issue is upstream. Document it and monitor.

**Step 2: Check AI processor metrics in Datadog**

Navigate to Datadog → Dashboards → "AI Processor Performance" and check:

- `ai.inference.duration` — p50, p95, p99 latency by operation type
- `ai.inference.errors` — error rate and error types
- `ai.openai.rate_limit` — rate limit hits from OpenAI
- `ai.queue.depth` — BullMQ queue depth (pending jobs)
- `ai.queue.wait_time` — time jobs spend waiting in queue before processing

**Step 3: Check BullMQ queue health**

```bash
# Connect to Redis and check queue metrics
redis-cli -h localhost -p 6379 --tls -a <password>

# Check waiting jobs
LLEN bull:citation-analysis:wait

# Check active jobs
LLEN bull:citation-analysis:active

# Check failed jobs
ZCARD bull:citation-analysis:failed

# Check delayed jobs
ZCARD bull:citation-analysis:delayed
```

**Step 4: Identify the bottleneck**

| Symptom | Likely Cause | Remediation |
|---------|-------------|-------------|
| High queue depth, normal inference time | Insufficient ai-processor instances | Scale up ai-processor ([Runbook 6](#6-scale-services-up-or-down)) |
| High inference time, normal queue depth | OpenAI API latency | Check OpenAI status; consider enabling fallback to Claude |
| Rate limit errors from OpenAI | Exceeding OpenAI API rate limits | Reduce concurrency per worker or upgrade OpenAI tier |
| High error rate, normal latency | Application bug or prompt issue | Check Sentry for errors; review recent changes |
| High memory usage on ai-processor tasks | Large documents or memory leaks | Restart tasks; investigate memory profiling |

**Step 5: Enable AI fallback (if OpenAI is degraded)**

If OpenAI API is consistently slow or erroring, enable the Claude fallback:

```bash
# Update feature flag in AWS Systems Manager Parameter Store
aws ssm put-parameter \
  --name "/citepilot/prod/ai-provider-fallback" \
  --value "enabled" \
  --type String \
  --overwrite

# Restart ai-processor to pick up the change
aws ecs update-service --cluster citepilot-prod --service ai-processor --force-new-deployment
```

**Step 6: Investigate specific slow jobs**

```bash
# Check logs for the slowest recent jobs
aws logs filter-log-events \
  --log-group-name /ecs/citepilot-prod/ai-processor \
  --start-time $(date -d '1 hour ago' +%s000) \
  --filter-pattern '{ $.duration > 15000 }' \
  --limit 20
```

Look for patterns: specific document sizes, citation styles, or error types correlating with slow processing.

---

## 9. Handle Crossref API Outage

**When to use:** Crossref API is returning errors or is unreachable, preventing reference validation for paid-tier users.

**Estimated time:** 10–30 minutes (initial response)

**Risk level:** Medium — affects paid feature, not core functionality

### Procedure

**Step 1: Confirm the outage**

```bash
# Test Crossref API directly
curl -s -o /dev/null -w "%{http_code}" "https://api.crossref.org/works?query=test&rows=1&mailto=api@citepilot.com"
# Expected: 200
# If 503 or timeout: outage confirmed

# Check Crossref status
curl -s "https://status.crossref.org/api/v2/summary.json" | jq .
```

**Step 2: Check if it is a rate limit issue**

```bash
# Check our Crossref API call volume in Datadog
# Dashboard: External APIs → Crossref
# Look for 429 (Too Many Requests) responses
```

If 429 errors: reduce concurrency in the ai-processor Crossref validation worker.

**Step 3: Enable graceful degradation**

The api-gateway should already handle Crossref failures gracefully by returning results without validation data. Verify this is working:

```bash
# Check that analyses complete even without Crossref
aws logs filter-log-events \
  --log-group-name /ecs/citepilot-prod/ai-processor \
  --start-time $(date -d '30 minutes ago' +%s000) \
  --filter-pattern '"crossref" "fallback"' \
  --limit 10
```

If graceful degradation is not working (analyses are failing entirely), apply the feature flag:

```bash
aws ssm put-parameter \
  --name "/citepilot/prod/crossref-validation" \
  --value "disabled" \
  --type String \
  --overwrite
```

**Step 4: Update status page**

1. Go to manage.statuspage.io → CitePilot
2. Create an incident:
   - **Title:** "Reference Validation Temporarily Degraded"
   - **Component:** "Reference Validation (Crossref)"
   - **Status:** Degraded Performance
   - **Message:** "Reference validation against Crossref is temporarily unavailable due to an upstream service disruption. Citation matching and all other features continue to work normally. Analyses will complete without Crossref validation data. We will retry validation automatically once the service is restored."

**Step 5: Monitor for recovery**

Set up a Datadog monitor (or check manually every 15 minutes):

```bash
curl -s -o /dev/null -w "%{http_code}" "https://api.crossref.org/works?query=test&rows=1&mailto=api@citepilot.com"
```

**Step 6: Restore and re-validate**

When Crossref is back:

1. Re-enable Crossref validation:
```bash
aws ssm put-parameter \
  --name "/citepilot/prod/crossref-validation" \
  --value "enabled" \
  --type String \
  --overwrite
```

2. Trigger re-validation for analyses that completed during the outage (if the results are still within the 30-day retention window):
```bash
# Re-queue failed Crossref validations
cd scripts
python requeue_crossref_validations.py --since "2026-07-14T10:00:00Z"
```

3. Resolve the status page incident

---

## 10. Respond to User Data Deletion Request

**When to use:** A user requests deletion of their personal data under GDPR Article 17 (Right to Erasure), CCPA, or through the account deletion flow.

**Estimated time:** 30–60 minutes (manual process); instant (automated via account settings)

**SLA:** 30 days from receipt (GDPR requirement), target: 5 business days

### Automated Deletion (Account Settings)

Users can delete their account through Account Settings → Delete Account. This triggers an automated process that:

1. Immediately deactivates the account (prevents login)
2. Cancels any active Stripe subscription
3. Deletes all personal data within 24 hours
4. Sends a confirmation email

The automated process handles the vast majority of deletion requests. The manual procedure below is for requests received via email or for edge cases.

### Manual Deletion Procedure

**Step 1: Verify the request and identity**

1. Confirm the request was received from the email address associated with the account, or verify identity through an alternative method (e.g., confirming the last 4 digits of the payment card on file, confirming the date they created their account)
2. Log the request in the data deletion tracker (Google Sheet or internal tool):
   - Request date
   - User email
   - Request source (email, in-app, privacy form)
   - Assigned handler

**Step 2: Identify all user data**

```sql
-- Connect to production database via bastion
-- Find the user record
SELECT id, email, name, created_at, subscription_status FROM users WHERE email = 'user@example.com';

-- Find all associated data
SELECT 'analyses' AS type, COUNT(*) FROM analyses WHERE user_id = '<user_id>'
UNION ALL
SELECT 'results' AS type, COUNT(*) FROM analysis_results WHERE analysis_id IN (SELECT id FROM analyses WHERE user_id = '<user_id>')
UNION ALL
SELECT 'payments' AS type, COUNT(*) FROM payments WHERE user_id = '<user_id>'
UNION ALL
SELECT 'audit_logs' AS type, COUNT(*) FROM audit_logs WHERE user_id = '<user_id>';
```

**Step 3: Cancel active subscription**

```bash
# Get the Stripe customer ID
psql -c "SELECT stripe_customer_id FROM users WHERE email = 'user@example.com';"

# Cancel via Stripe CLI or dashboard
stripe subscriptions list --customer <cus_xxx> --status active
stripe subscriptions cancel <sub_xxx>
```

**Step 4: Delete user data from PostgreSQL**

```sql
BEGIN;

-- Delete analysis results
DELETE FROM analysis_results WHERE analysis_id IN (SELECT id FROM analyses WHERE user_id = '<user_id>');

-- Delete analyses
DELETE FROM analyses WHERE user_id = '<user_id>';

-- Delete audit logs (anonymise rather than delete for security audit trail)
UPDATE audit_logs SET user_id = NULL, user_email = 'deleted-user' WHERE user_id = '<user_id>';

-- Payment records: RETAIN for 7 years (legal requirement) but anonymise
UPDATE payments SET user_email = 'deleted-user', user_name = 'Deleted User' WHERE user_id = '<user_id>';

-- Delete the user account
DELETE FROM users WHERE id = '<user_id>';

COMMIT;
```

**Step 5: Delete data from external services**

- [ ] **Stripe:** Delete the customer record (this deletes payment methods but retains invoice records as required by financial regulations)
  ```bash
  stripe customers delete <cus_xxx>
  ```
- [ ] **PostHog:** Delete user data via PostHog API
  ```bash
  curl -X POST https://eu.posthog.com/api/person/<distinct_id>/delete/ \
    -H "Authorization: Bearer <posthog_api_key>"
  ```
- [ ] **Sentry:** User data in Sentry is anonymised (no PII stored in error reports)

**Step 6: Verify deletion**

```sql
-- Confirm no user record exists
SELECT COUNT(*) FROM users WHERE email = 'user@example.com';
-- Expected: 0

-- Confirm no analysis data exists
SELECT COUNT(*) FROM analyses WHERE user_id = '<user_id>';
-- Expected: 0
```

**Step 7: Confirm to the user**

Send a confirmation email:

> Subject: Your CitePilot data has been deleted
>
> Dear [Name],
>
> We have completed the deletion of your personal data from CitePilot, as requested on [date]. The following data has been removed:
>
> - Account information (email, name, authentication credentials)
> - Analysis results and history
> - Usage data and analytics
>
> Payment records have been anonymised and will be retained for 7 years as required by tax law, after which they will be permanently deleted.
>
> If you have any questions, please contact privacy@citepilot.com.

**Step 8: Update the deletion tracker**

- Completion date
- Data categories deleted
- Any retained data (with legal justification)
- Confirmation email sent

---

## 11. Onboard a New Team Member to Infrastructure

**When to use:** A new engineer or operations team member needs access to CitePilot infrastructure.

**Estimated time:** 1–2 hours

**Risk level:** Low

### Onboarding Checklist

**Step 1: GitHub access**

- [ ] Add to the `citepilot` GitHub organisation
- [ ] Add to the appropriate team:
  - `engineering` — read/write to all repositories
  - `infrastructure` — admin access to infra repositories
  - `security` — access to security-related repositories
- [ ] Ensure they have 2FA enabled on their GitHub account (required by org policy)

**Step 2: AWS access**

- [ ] Create an IAM user in the `citepilot-prod` AWS account
- [ ] Add to the appropriate IAM group:
  - `developers` — read-only access to production, read/write to staging
  - `operations` — read/write to production
  - `admin` — full access (restricted, requires VP approval)
- [ ] Generate access keys for AWS CLI access
- [ ] Enable MFA on the AWS IAM user (mandatory)
- [ ] Share the AWS account ID and login URL via 1Password

```bash
# Create IAM user
aws iam create-user --user-name <username>

# Add to group
aws iam add-user-to-group --user-name <username> --group-name developers

# Create access keys
aws iam create-access-key --user-name <username>
```

**Step 3: Monitoring and alerting**

- [ ] Add to Datadog organisation (role: Standard or Admin)
- [ ] Add to Sentry organisation (role: Member)
- [ ] Add to PagerDuty (add to appropriate escalation policy/schedule)
- [ ] Add to Statuspage.io team (for incident communication)

**Step 4: Communication channels**

- [ ] Add to Slack channels:
  - `#engineering` — general engineering discussion
  - `#deployments` — deployment notifications
  - `#incidents` — incident response
  - `#alerts` — automated alerting from Datadog/Sentry
  - `#on-call` — on-call coordination
- [ ] Add to relevant email distribution lists

**Step 5: Secrets and credentials**

- [ ] Add to 1Password `Engineering` vault
- [ ] Provide bastion host SSH key (or add their public key to the bastion's authorized_keys):
  ```bash
  # On the bastion host
  echo "<new-member-public-key>" >> ~/.ssh/authorized_keys
  ```
- [ ] Share the bastion connection details:
  - Host: `bastion-prod.citepilot.com`
  - User: their username
  - Key: their personal SSH key

**Step 6: Development environment**

- [ ] Share the development environment setup guide (`docs/dev-setup.md`)
- [ ] Ensure they can:
  - Clone the repository and install dependencies
  - Run the application locally (Docker Compose)
  - Connect to the staging database
  - Run the test suite
  - Deploy to the staging environment

**Step 7: Knowledge transfer**

- [ ] Schedule a 1-hour architecture walkthrough (use the architecture decision records in `docs/04-architecture/`)
- [ ] Walk through the monitoring dashboards in Datadog
- [ ] Walk through the deployment pipeline in GitHub Actions
- [ ] Review these runbooks together
- [ ] Shadow an on-call shift before being added to the on-call rotation

**Step 8: Verify access**

Have the new team member verify each access point:

- [ ] Can clone the GitHub repository
- [ ] Can log in to AWS Console
- [ ] Can run `aws ecs list-clusters` from their CLI
- [ ] Can SSH to the bastion host
- [ ] Can log in to Datadog and view dashboards
- [ ] Can log in to Sentry and view issues
- [ ] Can access 1Password Engineering vault
- [ ] Can deploy to the staging environment

### Offboarding Checklist

When a team member leaves, reverse all of the above:

- [ ] Remove from GitHub organisation
- [ ] Delete or deactivate IAM user; delete access keys
- [ ] Remove from Datadog, Sentry, PagerDuty
- [ ] Remove from Slack channels
- [ ] Remove SSH key from bastion host
- [ ] Remove from 1Password vaults
- [ ] Rotate any secrets they had direct access to ([Runbook 5](#5-rotate-api-keys-and-secrets))
- [ ] Remove from on-call rotation

---

*© 2026 CitePilot Ltd. Internal document — do not distribute externally.*
