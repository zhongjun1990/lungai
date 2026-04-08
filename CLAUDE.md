# LungAI — AI Medical Imaging SaaS

## Deploy Configuration

**INCOMPLETE** — Production URL and Vercel credentials needed. See Section below.

### Platform: Vercel (frontend) + AWS ECS (backend)

**Frontend** (`src/web/`):
- Platform: Vercel
- Config: `vercel.json` (framework: vite, routes to `/src/web/dist/$1`)
- Build: `cd src/web && npm install && npm run build`
- Auto-deploy on push to `main` branch (if GitHub integration is connected)
- GitHub repo: `github.com/zhongjun1990/lungai`
- **Production URL**: `https://lungai.vercel.app`
- **Nice-to-have**: Vercel API token (for redeploy triggers via CLI)

**Backend** (`src/api/`, `src/ai/`):
- Platform: AWS ECS (Docker)
- Workflow: `.github/workflows/deploy.yml` (triggers on release or manual dispatch)
- Needs secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- Health check: `scripts/healthcheck.js`

## Email Infrastructure (SendGrid)

**Status**: Code implemented, not in active use (Postfix SMTP relay confirmed working per CEO).

- Service: `src/api/src/services/email.ts` (SendGrid `@sendgrid/mail`)
- Routes: `src/api/src/routes/email.ts`
- Endpoints:
  - `POST /v1/email/send` — Send plain HTML/text email
  - `POST /v1/email/outreach` — Send single B2B cold outreach email
  - `POST /v1/email/outreach/batch` — Batch outreach (max 100)
  - `POST /v1/email/test` — Send test email
  - `GET /v1/email/status` — Check service status
- Env vars needed:
  - `SENDGRID_API_KEY` (required)
  - `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`, `EMAIL_REPLY_TO`
- See `src/api/.env.example` for all env var names

## Project Structure

```
src/
├── web/          # Vite + React frontend (Vercel)
├── api/          # Express API (AWS ECS)
└── ai/           # AI inference service (AWS ECS)
```

## Key Commands

```bash
# Frontend
cd src/web && npm install && npm run build

# Backend (local dev)
npm run dev:api    # API on :3000
npm run dev:ai     # AI service on :3001
npm run dev:services  # Docker services (Postgres, Redis, MongoDB, MinIO, RabbitMQ, ES, Kibana)
```

## Skill Routing

See parent company CLAUDE.md for agent skill routing rules.
