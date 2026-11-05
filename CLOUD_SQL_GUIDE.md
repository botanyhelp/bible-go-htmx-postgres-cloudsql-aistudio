# Google Cloud SQL PostgreSQL Connection & Deployment Guide

This document explains how to set up environment variables and connect this Go web server to an existing Google Cloud SQL PostgreSQL instance (`scriptures` database) via Private IP / Direct VPC Egress on port 5432.

---

## 1. Environment Variables Overview

Set the following environment variables in your deployment environment (Google Cloud Run, GKE, or Compute Engine):

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `DB_HOST` | `10.128.0.3` or `127.0.0.1` | Private IP address of the Cloud SQL instance or Localhost when using Cloud SQL Proxy. |
| `DB_PORT` | `5432` | PostgreSQL port (5432). |
| `DB_USER` | `postgres` | Cloud SQL database username. |
| `DB_PASSWORD` | `SecretPass123!` | Password for the database user. |
| `DB_NAME` | `scriptures` | Database name. |
| `DB_SSLMODE` | `disable` / `require` | SSL mode (`disable` when inside VPC, `require` if required by Cloud SQL flags). |
| `INSTANCE_CONNECTION_NAME` | `project-id:region:instance-name` | Full Cloud SQL instance connection name. |
| `PORT` | `3000` | Web server listening port. |

---

## 2. Network Connectivity Options

### Option A: Direct VPC Egress (Recommended for Google Cloud Run)
When deploying this Go container to Google Cloud Run, enable Direct VPC Egress or attach a Serverless VPC Access Connector:

```bash
gcloud run deploy scriptures-api \
  --image gcr.io/YOUR_PROJECT/scriptures-api:latest \
  --network default \
  --subnet default \
  --vpc-egress all-traffic \
  --set-env-vars DB_HOST="10.128.0.3",DB_PORT="5432",DB_USER="postgres",DB_PASSWORD="SecretPassword",DB_NAME="scriptures",DB_SSLMODE="disable"
```

### Option B: Cloud SQL Auth Proxy (Local Development & Testing)
To test locally against your Cloud SQL instance:

1. Download and start Cloud SQL Auth Proxy:
   ```bash
   ./cloud-sql-proxy --address 0.0.0.0 --port 5432 project-id:us-central1:scriptures-db
   ```
2. Set `DB_HOST="127.0.0.1"` and run the Go server:
   ```bash
   go run main.go
   ```

---

## 3. Database Schema Import

Import the LDS Scriptures schema and data using `psql`:

```bash
PGPASSWORD="SecretPassword" psql -h 10.128.0.3 -U postgres -d scriptures -f schema.postgresql.sql
```

---

## 4. Query Benchmark Test

Once running, verify the server handles the 2 key scripture queries:

1. **Query 1**:
   ```bash
   curl "http://localhost:3000/api/v1/scriptures?verse_title=John+3:16"
   ```

2. **Query 2**:
   ```bash
   curl "http://localhost:3000/api/v1/scriptures/lookup?book=John&chapter=3&verse=16"
   ```
