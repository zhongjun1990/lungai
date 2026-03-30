# AI 医疗影像分析 SaaS - API 接口设计

## 概述

本文档定义了 AI 医疗影像分析 SaaS 的 RESTful API 接口规范，遵循 RESTful 最佳实践和 FHIR (Fast Healthcare Interoperability Resources) 标准。

## 基础规范

### 版本控制

```http
# API 版本在路径中
GET /v1/studies HTTP/1.1
Host: api.medical-imaging.example.com
```

### 认证与授权

```http
# OAuth2 Bearer Token
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 请求签名 (用于服务器到服务器)
X-Request-Signature: sha256=abc123...
X-Request-Timestamp: 1640995200
```

### 响应格式

```http
# 成功响应
HTTP/1.1 200 OK
Content-Type: application/json
X-Request-ID: 123e4567-e89b-12d3-a456-426614174000

{
  "data": {
    // 响应数据
  },
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  },
  "links": {
    "self": "/v1/studies?page=1",
    "next": "/v1/studies?page=2",
    "prev": null
  }
}

# 错误响应
HTTP/1.1 400 Bad Request
Content-Type: application/json
X-Request-ID: 123e4567-e89b-12d3-a456-426614174001

{
  "error": {
    "code": "invalid_parameter",
    "message": "The 'study_uid' parameter is required",
    "details": "Missing required query parameter",
    "request_id": "123e4567-e89b-12d3-a456-426614174001"
  }
}
```

## 端点设计

### 1. 用户管理

#### 1.1 登录

```http
POST /v1/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "user@hospital.com",
  "password": "secure-password",
  "tenant_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}

# 响应
HTTP/1.1 200 OK
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

#### 1.2 获取用户信息

```http
GET /v1/users/me HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 响应
{
  "data": {
    "id": "a1b2c3d4-5678-90ef-ghij-klmnopqrstuv",
    "email": "user@hospital.com",
    "first_name": "张",
    "last_name": "医生",
    "role": "radiologist",
    "tenant_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 2. 患者管理

#### 2.1 搜索患者

```http
GET /v1/patients?query=张&page=1&per_page=20 HTTP/1.1

# 响应
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "mrn": "PAT12345",
      "first_name": "张",
      "last_name": "小明",
      "birth_date": "1990-01-01",
      "gender": "male",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "per_page": 20
  }
}
```

#### 2.2 创建患者

```http
POST /v1/patients HTTP/1.1
Content-Type: application/json

{
  "mrn": "PAT67890",
  "first_name": "李",
  "last_name": "华",
  "birth_date": "1985-05-15",
  "gender": "female"
}

# 响应
HTTP/1.1 201 Created
Location: /v1/patients/987e6543-dcba-9876-5432-109876543210
```

### 3. 检查/研究管理

#### 3.1 获取研究列表

```http
GET /v1/studies?patient_id=123e4567-e89b-12d3-a456-426614174000 HTTP/1.1

# 响应
{
  "data": [
    {
      "id": "study-uid-123",
      "study_instance_uid": "1.2.840.113619.2.55.3.11111111111111111111111111111111",
      "patient_id": "123e4567-e89b-12d3-a456-426614174000",
      "study_date": "2024-01-05T10:30:00Z",
      "modality": "CT",
      "description": "头部 CT 平扫",
      "series_count": 5,
      "instance_count": 120
    }
  ]
}
```

#### 3.2 获取研究详情

```http
GET /v1/studies/study-uid-123 HTTP/1.1

# 响应
{
  "data": {
    "id": "study-uid-123",
    "study_instance_uid": "1.2.840.113619.2.55.3.11111111111111111111111111111111",
    "patient_id": "123e4567-e89b-12d3-a456-426614174000",
    "study_date": "2024-01-05T10:30:00Z",
    "modality": "CT",
    "description": "头部 CT 平扫",
    "series": [
      {
        "id": "series-uid-456",
        "series_instance_uid": "1.2.840.113619.2.55.3.22222222222222222222222222222222",
        "series_number": 1,
        "description": "轴向扫描",
        "modality": "CT",
        "instance_count": 24
      }
    ]
  }
}
```

### 4. 影像管理

#### 4.1 获取预签名上传 URL

```http
POST /v1/instances/upload-url HTTP/1.1
Content-Type: application/json

{
  "study_instance_uid": "1.2.840.113619.2.55.3.11111111111111111111111111111111",
  "series_instance_uid": "1.2.840.113619.2.55.3.22222222222222222222222222222222",
  "sop_instance_uid": "1.2.840.113619.2.55.3.33333333333333333333333333333333",
  "filename": "IM00001.dcm",
  "content_type": "application/dicom"
}

# 响应
{
  "data": {
    "upload_url": "https://s3.amazonaws.com/medical-imaging-data/123/456/789?AWSAccessKeyId=...",
    "upload_method": "PUT",
    "expires_in": 3600
  }
}
```

#### 4.2 直接上传影像

```http
PUT https://s3.amazonaws.com/medical-imaging-data/123/456/789?AWSAccessKeyId=... HTTP/1.1
Content-Type: application/dicom

[DICOM 文件内容]

# 响应
HTTP/1.1 200 OK
```

#### 4.3 获取缩略图

```http
GET /v1/instances/{instance-id}/thumbnail HTTP/1.1
Accept: image/jpeg

# 响应
HTTP/1.1 200 OK
Content-Type: image/jpeg

[JPEG 缩略图内容]
```

### 5. 分析任务管理

#### 5.1 提交分析任务

```http
POST /v1/analysis-tasks HTTP/1.1
Content-Type: application/json

{
  "study_id": "study-uid-123",
  "model_id": "brain-tumor-detection",
  "model_version": "1.0.0",
  "parameters": {
    "threshold": 0.7,
    "use_tta": true
  },
  "priority": 5
}

# 响应
HTTP/1.1 202 Accepted
Location: /v1/analysis-tasks/7c9e6679-7425-40de-944b-e07fc1f90ae7
X-Status-URL: /v1/analysis-tasks/7c9e6679-7425-40de-944b-e07fc1f90ae7/status

{
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "study_id": "study-uid-123",
    "model_id": "brain-tumor-detection",
    "model_version": "1.0.0",
    "status": "pending",
    "priority": 5,
    "created_at": "2024-01-05T10:30:00Z"
  }
}
```

#### 5.2 获取任务状态

```http
GET /v1/analysis-tasks/7c9e6679-7425-40de-944b-e07fc1f90ae7/status HTTP/1.1

# 响应
HTTP/1.1 200 OK
{
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "status": "processing",
    "progress": 60,
    "started_at": "2024-01-05T10:31:00Z",
    "estimated_completion": "2024-01-05T10:33:00Z"
  }
}
```

#### 5.3 获取分析结果

```http
GET /v1/analysis-tasks/7c9e6679-7425-40de-944b-e07fc1f90ae7/results HTTP/1.1

# 响应
{
  "data": {
    "id": "result-123",
    "task_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "model_id": "brain-tumor-detection",
    "model_version": "1.0.0",
    "findings": [
      {
        "type": "tumor",
        "confidence": 0.85,
        "bbox": { "x": 100, "y": 150, "width": 80, "height": 100 },
        "volume": 25.5,
        "description": "疑似胶质瘤"
      }
    ],
    "visualization_url": "/v1/analysis-tasks/7c9e6679-7425-40de-944b-e07fc1f90ae7/visualization.png",
    "report_text": "脑实质内可见多发结节状低密度影，增强扫描可见轻度强化，最大直径约 8mm，边界欠清，考虑转移瘤可能性大。",
    "metrics": {
      "inference_time_ms": 1200
    },
    "created_at": "2024-01-05T10:33:00Z"
  }
}
```

### 6. 报告管理

#### 6.1 生成报告

```http
POST /v1/reports HTTP/1.1
Content-Type: application/json

{
  "analysis_result_id": "result-123",
  "template_id": "ct-brain-report",
  "parameters": {
    "doctor_signature": "张医生",
    "report_date": "2024-01-05"
  }
}

# 响应
HTTP/1.1 201 Created
Location: /v1/reports/abc123-def456

{
  "data": {
    "id": "abc123-def456",
    "analysis_result_id": "result-123",
    "status": "generated",
    "pdf_url": "/v1/reports/abc123-def456.pdf"
  }
}
```

#### 6.2 下载报告

```http
GET /v1/reports/abc123-def456.pdf HTTP/1.1
Accept: application/pdf

# 响应
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="brain-tumor-report.pdf"

[PDF 文件内容]
```

### 7. 集成接口 (FHIR)

#### 7.1 FHIR 患者资源

```http
GET /v1/fhir/Patient/123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Accept: application/fhir+json

# 响应
HTTP/1.1 200 OK
Content-Type: application/fhir+json

{
  "resourceType": "Patient",
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "identifier": [
    {
      "system": "http://example.com/mrn",
      "value": "PAT12345"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "张",
      "given": [ "小明" ]
    }
  ],
  "birthDate": "1990-01-01",
  "gender": "male"
}
```

#### 7.2 FHIR 诊断报告资源

```http
GET /v1/fhir/DiagnosticReport/abc123-def456 HTTP/1.1
Accept: application/fhir+json

# 响应
HTTP/1.1 200 OK
Content-Type: application/fhir+json

{
  "resourceType": "DiagnosticReport",
  "id": "abc123-def456",
  "subject": {
    "reference": "Patient/123e4567-e89b-12d3-a456-426614174000"
  },
  "study": {
    "reference": "ImagingStudy/study-uid-123"
  },
  "conclusion": "脑实质内可见多发结节状低密度影，考虑转移瘤可能性大。",
  "issued": "2024-01-05T10:35:00+08:00"
}
```

### 8. 集成接口 (DICOMweb)

#### 8.1 WADO-RS - 获取 DICOM 实例

```http
GET /v1/dicomweb/studies/{study-uid}/series/{series-uid}/instances/{sop-instance-uid} HTTP/1.1
Accept: multipart/related; type="application/dicom"

# 响应
HTTP/1.1 200 OK
Content-Type: multipart/related; boundary=boundary
Content-Transfer-Encoding: binary

--boundary
Content-Type: application/dicom

[DICOM 文件内容]

--boundary--
```

#### 8.2 QIDO-RS - 查询影像

```http
GET /v1/dicomweb/studies?PatientName=张&Modality=CT HTTP/1.1
Accept: application/dicom+json

# 响应
HTTP/1.1 200 OK
Content-Type: application/dicom+json

[
  {
    "0020000D": { "Value": ["study-uid-123"], "vr": "UI" },
    "00080020": { "Value": ["20240105"], "vr": "DA" },
    "00080060": { "Value": ["CT"], "vr": "CS" }
  }
]
```

### 9. WebSocket 通知

#### 9.1 连接到任务通知通道

```javascript
// 浏览器端代码
const socket = new WebSocket('wss://api.medical-imaging.example.com/v1/notifications/ws');

socket.onopen = function() {
  console.log('Connected to notification server');
  socket.send(JSON.stringify({
    type: 'subscribe',
    channel: 'task-status',
    task_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7'
  }));
};

socket.onmessage = function(event) {
  const data = JSON.parse(event.data);
  if (data.type === 'task_status_change') {
    console.log('Task status:', data.status);
    console.log('Progress:', data.progress);
  }
};

socket.onerror = function(error) {
  console.error('WebSocket error:', error);
};

socket.onclose = function(event) {
  console.log('Connection closed:', event);
};
```

### 10. 系统管理

#### 10.1 获取系统状态

```http
GET /v1/system/status HTTP/1.1

# 响应
{
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 86400,
    "services": [
      {
        "name": "user-service",
        "status": "healthy",
        "response_time_ms": 120
      },
      {
        "name": "imaging-service",
        "status": "healthy",
        "response_time_ms": 80
      },
      {
        "name": "analysis-service",
        "status": "warning",
        "response_time_ms": 2100
      }
    ],
    "resources": {
      "cpu": 0.45,
      "memory": 0.62,
      "gpu": {
        "memory": 0.35,
        "utilization": 0.12
      }
    }
  }
}
```

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|---------|-------------|------|
| invalid_parameter | 400 | 参数验证失败 |
| missing_parameter | 400 | 缺少必填参数 |
| invalid_credentials | 401 | 认证失败 |
| insufficient_permissions | 403 | 权限不足 |
| resource_not_found | 404 | 资源不存在 |
| duplicate_resource | 409 | 资源重复 |
| resource_conflict | 409 | 资源冲突 |
| rate_limit_exceeded | 429 | 请求频率超限 |
| server_error | 500 | 服务器内部错误 |
| service_unavailable | 503 | 服务不可用 |

## API 变更日志

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2024-01-01 | 初始版本发布 |
| 1.1.0 | 2024-01-15 | 添加分析任务通知功能 |
| 1.2.0 | 2024-02-01 | 支持 FHIR 资源类型 |
| 1.3.0 | 2024-02-15 | 添加 DICOMweb 接口 |
