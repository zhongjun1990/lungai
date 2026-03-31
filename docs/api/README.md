# AI Medical Imaging Analysis API Documentation

## Overview

This repository contains the API documentation for the AI Medical Imaging Analysis SaaS platform. The API provides RESTful endpoints for managing patients, studies, imaging data, AI analysis tasks, and reports.

## Getting Started

### API Reference

- **OpenAPI 3.0 Specification**: [openapi.yml](./openapi.yml)
- **Interactive Documentation**: Swagger UI or Redoc (see below)
- **API Design Document**: [API_DESIGN.md](../../API_DESIGN.md)

### Authentication

All API requests (except the login endpoint) require authentication using Bearer tokens obtained via the `/v1/auth/login` endpoint.

Include the token in the Authorization header:
```http
Authorization: Bearer <access_token>
```

### Base URLs

- **Production**: `https://api.medical-imaging.example.com/v1`
- **Staging**: `https://staging-api.medical-imaging.example.com/v1`
- **Local Development**: `http://localhost:8000/v1`

### Response Format

All successful responses follow this format:
```json
{
  "data": { /* response data */ },
  "meta": { /* pagination and metadata */ },
  "links": { /* pagination links */ }
}
```

Error responses follow this format:
```json
{
  "error": {
    "code": "error_code",
    "message": "Human readable error message",
    "details": "Additional details (optional)",
    "request_id": "request-uuid"
  }
}
```

## Authentication

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "doctor@hospital.com",
  "password": "secure-password-123",
  "tenant_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

### Token Refresh

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

## API Modules

### 1. User Management

```http
GET /users/me
Authorization: Bearer <access_token>
```

```http
PATCH /users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "full_name": "Dr. Zhang Wei"
}
```

### 2. Patient Management

```http
GET /patients?query=zhang&page=1&per_page=20
Authorization: Bearer <access_token>
```

```http
POST /patients
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "mrn": "PAT12345",
  "first_name": "张",
  "last_name": "伟",
  "birth_date": "1985-03-15",
  "gender": "male"
}
```

```http
GET /patients/{patient_id}
Authorization: Bearer <access_token>
```

### 3. Study Management

```http
GET /studies?patient_id={patient_id}&modality=CT
Authorization: Bearer <access_token>
```

```http
POST /studies
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patient_id": "{patient_id}",
  "study_date": "2024-01-15",
  "modality": "CT",
  "body_part": "Brain",
  "description": "Head CT scan",
  "physician_name": "Dr. Li"
}
```

```http
GET /studies/{study_id}?include_series=true
Authorization: Bearer <access_token>
```

### 4. Imaging Management

```http
POST /instances/upload-url
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "study_instance_uid": "1.2.840.113619.2.55.3.11111111111111111111111111111111",
  "series_instance_uid": "1.2.840.113619.2.55.3.22222222222222222222222222222222",
  "sop_instance_uid": "1.2.840.113619.2.55.3.33333333333333333333333333333333",
  "filename": "IM00001.dcm",
  "content_type": "application/dicom"
}
```

```http
GET /instances/{instance_id}/thumbnail?width=256&height=256
Authorization: Bearer <access_token>
Accept: image/jpeg
```

### 5. Analysis Tasks

```http
POST /analysis-tasks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "study_id": "{study_id}",
  "model_id": "brain-tumor-detection",
  "model_version": "1.0.0",
  "parameters": {
    "threshold": 0.7,
    "use_tta": true
  },
  "priority": 5
}
```

```http
GET /analysis-tasks/{task_id}/status
Authorization: Bearer <access_token>
```

```http
GET /analysis-tasks/{task_id}/results
Authorization: Bearer <access_token>
```

### 6. Reports

```http
POST /reports
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "analysis_task_id": "{task_id}",
  "template_id": "ct-brain-report"
}
```

```http
GET /reports/{report_id}.pdf
Authorization: Bearer <access_token>
Accept: application/pdf
```

### 7. System Status

```http
GET /system/status
Authorization: Bearer <access_token>
```

## FHIR Integration

The API provides FHIR (Fast Healthcare Interoperability Resources) endpoints:

```http
GET /fhir/Patient/{id}
Authorization: Bearer <access_token>
Accept: application/fhir+json
```

```http
GET /fhir/DiagnosticReport/{id}
Authorization: Bearer <access_token>
Accept: application/fhir+json
```

## Testing the API

### Prerequisites

- Node.js >= 18
- npm or yarn
- Postman or HTTP client of choice

### Running Tests

```bash
npm run test:api
```

### Sample Requests with curl

```bash
# Login
curl -X POST https://api.medical-imaging.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "secure-password-123",
    "tenant_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
  }'

# Get patients (replace <token> with your access token)
curl -X GET "https://api.medical-imaging.example.com/v1/patients?query=zhang" \
  -H "Authorization: Bearer <token>"
```

## API Versioning

API version is included in the URL path (v1). Breaking changes will increment the version number.

## Rate Limiting

- **Standard endpoints**: 1000 requests/minute
- **File operations**: 100 requests/minute

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| invalid_parameter | 400 | Invalid or missing parameters |
| invalid_credentials | 401 | Authentication failed |
| insufficient_permissions | 403 | Insufficient permissions |
| resource_not_found | 404 | Resource not found |
| duplicate_resource | 409 | Resource already exists |
| rate_limit_exceeded | 429 | Rate limit exceeded |
| server_error | 500 | Internal server error |

## Change Management

API changes follow semantic versioning:

1. **PATCH**: Bug fixes, backwards-compatible changes
2. **MINOR**: New features, backwards-compatible
3. **MAJOR**: Breaking changes

## Support

- **API Documentation**: https://api.medical-imaging.example.com/docs
- **API Reference**: https://api.medical-imaging.example.com/reference
- **Support**: api-support@medical-imaging.example.com
- **Status**: https://status.medical-imaging.example.com

## Terms of Service

https://medical-imaging.example.com/terms
