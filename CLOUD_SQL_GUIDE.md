# Google Cloud SQL Deployment & Cloud Build Guide

This document provides step-by-step commands to build the container image via Google Cloud Build, push it to Artifact Registry, and deploy to Cloud Run with Direct VPC Egress, `INSTANCE_CONNECTION_NAME`, and `DB_SSLMODE="require"`.

---

## 1. Cloud SQL SSL Requirement (`FATAL: pg_hba.conf rejects connection ... no encryption`)

Google Cloud SQL PostgreSQL instances enforce TLS encryption by default. Unencrypted connections (`DB_SSLMODE="disable"`) trigger:
`FATAL: pg_hba.conf rejects connection for host "...", user "postgres", database "scriptures", no encryption`

To fix this, set **`DB_SSLMODE="require"`** in your environment variables.

---

## 2. Deploy Command for Cloud Run

Re-deploy your service with `DB_SSLMODE="require"`:

```bash
gcloud run deploy bible-go-htmx-postgres-cloudsql-aistudio \
  --image us-central1-docker.pkg.dev/gkecluster-423317/scriptures-repo/scriptures-api:v2 \
  --region us-central1 \
  --allow-unauthenticated \
  --network default \
  --subnet default \
  --vpc-egress all-traffic \
  --set-env-vars \
DB_HOST="172.18.160.3",\
DB_PORT="5432",\
DB_USER="postgres",\
DB_PASSWORD="indy",\
DB_NAME="scriptures",\
DB_SSLMODE="require",\
INSTANCE_CONNECTION_NAME="gkecluster-423317:us-central1:indy"
```
