# API Testing Guide

This document provides guidelines and examples for testing the AI Medical Imaging Analysis API.

## Table of Contents

- [Testing Tools](#testing-tools)
- [Setup](#setup)
- [Test Environment](#test-environment)
- [Test Categories](#test-categories)
- [Example Tests](#example-tests)
- [Running Tests](#running-tests)
- [Performance Testing](#performance-testing)

## Testing Tools

- **Unit Tests**: Jest / Mocha
- **Integration Tests**: Supertest / Chai
- **E2E Tests**: Cypress / Playwright
- **Load Testing**: k6 / Artillery
- **API Client**: Postman / curl / httpie

## Setup

### Environment Variables

```bash
# Create a .env file for testing
API_BASE_URL=http://localhost:8000/v1
API_TEST_USER=doctor@hospital.com
API_TEST_PASSWORD=test-password
API_TEST_TENANT_ID=7c9e6679-7425-40de-944b-e07fc1f90ae7
```

### Dependencies

```bash
npm install --save-dev jest supertest
```

## Test Environment

### Local Development

```bash
# Start local services
docker-compose up -d postgres redis minio

# Start API server in test mode
NODE_ENV=test npm run dev
```

### Test Database

```bash
# Create test database
docker-compose exec postgres createdb -U admin medical_db_test
```

## Test Categories

### 1. Authentication Tests

```javascript
// tests/api/auth.test.js

describe('Authentication', () => {
  describe('POST /auth/login', () => {
    test('should return access token with valid credentials', async () => {
      const response = await request(API_BASE_URL)
        .post('/auth/login')
        .send({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
          tenant_id: TEST_TENANT_ID
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('refresh_token');
      expect(response.body.data.token_type).toBe('Bearer');
    });

    test('should return 401 with invalid credentials', async () => {
      const response = await request(API_BASE_URL)
        .post('/auth/login')
        .send({
          email: TEST_USER_EMAIL,
          password: 'wrong-password',
          tenant_id: TEST_TENANT_ID
        })
        .expect(401);

      expect(response.body.error.code).toBe('invalid_credentials');
    });

    test('should return 400 with missing parameters', async () => {
      await request(API_BASE_URL)
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });
});
```

### 2. Patient Management Tests

```javascript
// tests/api/patients.test.js

describe('Patients', () => {
  let authToken;

  beforeAll(async () => {
    const response = await request(API_BASE_URL)
      .post('/auth/login')
      .send({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        tenant_id: TEST_TENANT_ID
      });
    authToken = response.body.data.access_token;
  });

  describe('GET /patients', () => {
    test('should return paginated patient list', async () => {
      const response = await request(API_BASE_URL)
        .get('/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, per_page: 20 })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('per_page');
    });

    test('should filter patients by search query', async () => {
      const response = await request(API_BASE_URL)
        .get('/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'zhang' })
        .expect(200);

      response.body.data.forEach(patient => {
        const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
        expect(fullName).toContain('zhang');
      });
    });

    test('should return 401 without authentication', async () => {
      await request(API_BASE_URL)
        .get('/patients')
        .expect(401);
    });
  });

  describe('POST /patients', () => {
    test('should create a new patient', async () => {
      const newPatient = {
        mrn: 'PAT-TEST-001',
        first_name: 'Test',
        last_name: 'Patient',
        birth_date: '1990-01-01',
        gender: 'male'
      };

      const response = await request(API_BASE_URL)
        .post('/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newPatient)
        .expect(201);

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.mrn).toBe(newPatient.mrn);
      expect(response.headers.location).toBeDefined();
    });

    test('should validate required fields', async () => {
      const response = await request(API_BASE_URL)
        .post('/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error.code).toBe('invalid_parameter');
    });
  });

  describe('GET /patients/{id}', () => {
    test('should return patient details', async () => {
      const listResponse = await request(API_BASE_URL)
        .get('/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ per_page: 1 });

      const patientId = listResponse.body.data[0].id;

      const response = await request(API_BASE_URL)
        .get(`/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(patientId);
      expect(response.body.data).toHaveProperty('mrn');
      expect(response.body.data).toHaveProperty('first_name');
    });

    test('should return 404 for non-existent patient', async () => {
      await request(API_BASE_URL)
        .get('/patients/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
```

### 3. Study Management Tests

```javascript
// tests/api/studies.test.js

describe('Studies', () => {
  let authToken;
  let testPatientId;

  beforeAll(async () => {
    const loginResponse = await request(API_BASE_URL)
      .post('/auth/login')
      .send({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        tenant_id: TEST_TENANT_ID
      });
    authToken = loginResponse.body.data.access_token;

    const patientResponse = await request(API_BASE_URL)
      .post('/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        mrn: 'PAT-STUDY-001',
        first_name: 'Study',
        last_name: 'Patient',
        birth_date: '1985-05-15',
        gender: 'female'
      });
    testPatientId = patientResponse.body.data.id;
  });

  describe('POST /studies', () => {
    test('should create a new study', async () => {
      const newStudy = {
        patient_id: testPatientId,
        study_date: '2024-01-15',
        modality: 'CT',
        body_part: 'Brain',
        description: 'Head CT scan'
      };

      const response = await request(API_BASE_URL)
        .post('/studies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newStudy)
        .expect(201);

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.patient_id).toBe(testPatientId);
    });
  });

  describe('GET /studies', () => {
    test('should filter by modality', async () => {
      const response = await request(API_BASE_URL)
        .get('/studies')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ modality: 'CT' })
        .expect(200);

      response.body.data.forEach(study => {
        expect(study.modality).toBe('CT');
      });
    });
  });
});
```

### 4. Analysis Task Tests

```javascript
// tests/api/analysis.test.js

describe('Analysis Tasks', () => {
  let authToken;
  let testStudyId;

  beforeAll(async () => {
    const loginResponse = await request(API_BASE_URL)
      .post('/auth/login')
      .send({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        tenant_id: TEST_TENANT_ID
      });
    authToken = loginResponse.body.data.access_token;

    const patientResponse = await request(API_BASE_URL)
      .post('/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        mrn: 'PAT-ANALYSIS-001',
        first_name: 'Analysis',
        last_name: 'Patient',
        birth_date: '1975-08-20',
        gender: 'male'
      });

    const studyResponse = await request(API_BASE_URL)
      .post('/studies')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patient_id: patientResponse.body.data.id,
        study_date: '2024-01-15',
        modality: 'CT'
      });
    testStudyId = studyResponse.body.data.id;
  });

  describe('POST /analysis-tasks', () => {
    test('should submit an analysis task', async () => {
      const task = {
        study_id: testStudyId,
        model_id: 'brain-tumor-detection',
        model_version: '1.0.0',
        priority: 5
      };

      const response = await request(API_BASE_URL)
        .post('/analysis-tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(task)
        .expect(202);

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.status).toBe('pending');
    });

    test('should reject invalid model ID', async () => {
      const task = {
        study_id: testStudyId,
        model_id: 'invalid-model',
        model_version: '1.0.0'
      };

      await request(API_BASE_URL)
        .post('/analysis-tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(task)
        .expect(400);
    });
  });

  describe('GET /analysis-tasks/{taskId}/status', () => {
    test('should return task status', async () => {
      const task = {
        study_id: testStudyId,
        model_id: 'brain-tumor-detection',
        model_version: '1.0.0'
      };

      const submitResponse = await request(API_BASE_URL)
        .post('/analysis-tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(task);

      const taskId = submitResponse.body.data.id;

      const response = await request(API_BASE_URL)
        .get(`/analysis-tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(taskId);
      expect(response.body.data.status).toBeDefined();
    });
  });
});
```

### 5. Health Check Tests

```javascript
// tests/api/health.test.js

describe('System Health', () => {
  let authToken;

  beforeAll(async () => {
    const response = await request(API_BASE_URL)
      .post('/auth/login')
      .send({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        tenant_id: TEST_TENANT_ID
      });
    authToken = response.body.data.access_token;
  });

  describe('GET /system/status', () => {
    test('should return system health status', async () => {
      const response = await request(API_BASE_URL)
        .get('/system/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.version).toBeDefined();
      expect(response.body.data.uptime).toBeDefined();
    });
  });
});
```

## Load Testing

### k6 Load Test

```javascript
// tests/load/analysis-tasks.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8000/v1';
const AUTH_TOKEN = __ENV.AUTH_TOKEN;
const TEST_STUDY_ID = __ENV.TEST_STUDY_ID;

export default function () {
  const params = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  const payload = JSON.stringify({
    study_id: TEST_STUDY_ID,
    model_id: 'brain-tumor-detection',
    model_version: '1.0.0',
    priority: 5
  });

  const response = http.post(`${API_BASE_URL}/analysis-tasks`, payload, params);

  check(response, {
    'status is 202': (r) => r.status === 202,
    'response has task id': (r) => JSON.parse(r.body).data.id !== undefined,
  });

  sleep(1);
}
```

### Run Load Test

```bash
API_BASE_URL=http://localhost:8000/v1 \
AUTH_TOKEN=your-token \
TEST_STUDY_ID=your-study-id \
k6 run tests/load/analysis-tasks.js
```

## Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# API tests
npm run test:api

# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## CI/CD Pipeline

The tests are automatically run in CI/CD:

1. Unit tests on every push
2. Integration tests on PRs
3. E2E tests on staging deployment
4. Performance tests weekly

## Best Practices

1. **Isolate tests**: Each test should be independent
2. **Use fixtures**: Reuse test data setup
3. **Cleanup**: Reset test state between tests
4. **Mock external services**: Use mocks for AI inference
5. **Performance targets**: < 100ms for read ops, < 500ms for write ops

## Troubleshooting

Common issues and solutions:

1. **Database connection errors**: Verify test database is running
2. **Authentication errors**: Check auth token is valid and not expired
3. **Rate limiting**: Use rate limiting in tests or increase limits
4. **Test data conflicts**: Use unique identifiers for test data
