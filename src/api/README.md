# AI Medical Imaging API

Backend API for the AI Medical Imaging Analysis SaaS platform.

## Setup

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
cd src/api
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
npm start
```

### API Documentation

Swagger UI is available at: http://localhost:8000/docs

## Default Users

| Email | Password | Role |
|-------|----------|------|
| admin@hospital.com | admin123 | admin |
| doctor@hospital.com | doctor123 | radiologist |

## API Endpoints

### Authentication
- `POST /v1/auth/login` - User login
- `POST /v1/auth/refresh` - Refresh token
- `POST /v1/auth/logout` - User logout

### Users
- `GET /v1/users/me` - Get current user
- `PATCH /v1/users/me` - Update current user

### Patients
- `GET /v1/patients` - List patients
- `POST /v1/patients` - Create patient
- `GET /v1/patients/:id` - Get patient
- `PATCH /v1/patients/:id` - Update patient

### Studies
- `GET /v1/studies` - List studies
- `POST /v1/studies` - Create study
- `GET /v1/studies/:id` - Get study
- `PATCH /v1/studies/:id` - Update study

### Analysis Tasks
- `GET /v1/analysis-tasks` - List analysis tasks
- `POST /v1/analysis-tasks` - Submit analysis task
- `GET /v1/analysis-tasks/:id` - Get analysis task
- `GET /v1/analysis-tasks/:id/status` - Get task status
- `GET /v1/analysis-tasks/:id/results` - Get analysis results
- `DELETE /v1/analysis-tasks/:id` - Cancel analysis task

### Reports
- `GET /v1/reports` - List reports
- `POST /v1/reports` - Generate report
- `GET /v1/reports/:id` - Get report
- `PATCH /v1/reports/:id` - Update report
- `GET /v1/reports/:id.pdf` - Download report as PDF

### System
- `GET /v1/system/status` - System status

### Health
- `GET /health` - Health check endpoint (no auth required)
