# AI 医疗影像分析 SaaS - 数据架构设计

## 概述

医疗数据是最敏感的数据类型之一，本数据架构设计遵循以下原则：
- **隐私优先**: 符合 HIPAA、GDPR、等保三级要求
- **不可篡改**: 审计日志完整，数据操作可追溯
- **高可用性**: 数据多副本，灾难恢复预案完善
- **性能优化**: 影像数据读取延迟低，分析结果返回快

## 数据分类与合规要求

| 数据类型 | 敏感度 | 保留期 | 加密要求 | 合规标准 |
|---------|--------|--------|---------|---------|
| 用户身份数据 | 高 | 账户存续期+7年 | 静态+传输加密 | HIPAA §164.312 |
| 患者健康信息 (PHI) | 极高 | 医疗法规要求 | 端到端加密 | HIPAA Privacy Rule |
| 医学影像文件 | 高 | 7-10年 | 静态加密 | DICOM 安全标准 |
| 分析诊断结果 | 极高 | 永久归档 | 签名加密 | 医疗记录法规 |
| 审计日志 | 高 | 7年 | 写保护 | HIPAA Audit Controls |
| 系统配置数据 | 中 | 版本历史 | 静态加密 | 内部安全政策 |

## 数据存储架构

### 1. 关系型数据库 - PostgreSQL

**用途**: 用户数据、租户数据、订单数据、元数据

**Schema 设计**

```sql
-- 租户表 (多租户隔离)
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    settings JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    profile JSONB,
    mfa_enabled BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 患者表 (PHI)
CREATE TABLE patients (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    medical_record_number VARCHAR(100),
    first_name_encrypted BYTEA,
    last_name_encrypted BYTEA,
    birth_date_encrypted BYTEA,
    gender VARCHAR(20),
    deid_hash VARCHAR(64), -- 去标识化哈希
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 检查/研究表
CREATE TABLE studies (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    patient_id UUID REFERENCES patients(id),
    study_instance_uid VARCHAR(255) UNIQUE NOT NULL,
    study_date TIMESTAMPTZ,
    study_description TEXT,
    modality VARCHAR(20), -- CT, MRI, X-ray, etc.
    status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 系列表
CREATE TABLE series (
    id UUID PRIMARY KEY,
    study_id UUID REFERENCES studies(id),
    series_instance_uid VARCHAR(255) UNIQUE NOT NULL,
    series_number INTEGER,
    series_description TEXT,
    modality VARCHAR(20),
    number_of_images INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 影像实例表
CREATE TABLE instances (
    id UUID PRIMARY KEY,
    series_id UUID REFERENCES series(id),
    sop_instance_uid VARCHAR(255) UNIQUE NOT NULL,
    instance_number INTEGER,
    storage_path VARCHAR(500),
    file_size_bytes BIGINT,
    image_dimensions INTEGER[],
    pixel_spacing NUMERIC[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 分析任务表
CREATE TABLE analysis_tasks (
    id UUID PRIMARY KEY,
    study_id UUID REFERENCES studies(id),
    model_id VARCHAR(100),
    model_version VARCHAR(50),
    status VARCHAR(50),
    priority INTEGER DEFAULT 5,
    parameters JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 分析结果表
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY,
    task_id UUID REFERENCES analysis_tasks(id),
    result_type VARCHAR(100),
    findings JSONB, -- 检测到的异常
    confidence_scores JSONB,
    visualization_path VARCHAR(500),
    report_text TEXT,
    is_ai_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 审计日志表 (特殊处理)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- 按月份分区
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- ... 更多分区
```

**启用的扩展**:
- `pgcrypto`: 加密函数
- `pg_stat_statements`: 性能监控
- `timescaledb`: 时间序列优化 (审计日志)

**行级安全策略 (RLS)**:
```sql
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON patients
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### 2. 对象存储 - MinIO / AWS S3

**用途**: DICOM 文件、缩略图、报告文件、AI 可视化结果

**Bucket 结构**:
```
medical-imaging-data/
├── {tenant-id}/
│   ├── dicom/
│   │   ├── {study-uid}/
│   │   │   ├── {series-uid}/
│   │   │   │   └── {instance-uid}.dcm
│   ├── thumbnail/
│   │   └── {instance-uid}.jpg
│   ├── processed/
│   │   └── {task-id}/
│   ├── reports/
│   │   └── {report-id}.pdf
│   └── ai-visualizations/
│       └── {result-id}.png
└── audit-logs/
    └── {year}/{month}/{day}/
```

**存储策略**:
- 标准存储: 最近 6 个月数据
- 低频访问: 6 个月 - 2 年
- 归档存储: 2 年以上

**加密**:
- 服务端加密 (SSE-KMS / SSE-S3)
- 客户端加密选项

### 3. NoSQL 数据库 - MongoDB

**用途**: 非结构化元数据、报告模板、工作流状态

**Collections**:
```javascript
// 报告模板
{
  _id: ObjectId,
  tenantId: UUID,
  name: String,
  templateType: String,
  sections: [{
    id: String,
    title: String,
    type: String, // text, table, image, ai-findings
    content: Mixed
  }],
  variables: [String],
  createdAt: ISODate,
  updatedAt: ISODate
}

// 工作流状态
{
  _id: ObjectId,
  workflowId: UUID,
  instanceId: UUID,
  currentState: String,
  stateHistory: [{
    state: String,
    enteredAt: ISODate,
    userId: UUID,
    comment: String
  }],
  context: Mixed,
  createdAt: ISODate,
  updatedAt: ISODate
}

// 通知队列
{
  _id: ObjectId,
  tenantId: UUID,
  userId: UUID,
  type: String,
  priority: Number,
  status: String,
  payload: Mixed,
  deliveredAt: ISODate,
  createdAt: ISODate
}
```

### 4. 缓存 - Redis

**用途**: 会话缓存、热点数据、任务队列、限流计数器

**Key 设计**:
```
session:{tenant-id}:{user-id} → JWT token
user:{user-id}:permissions → 权限列表
study:{study-id}:meta → 研究元数据缓存
rate_limit:{api-key}:{minute} → 限流计数
queue:analysis:pending → 分析任务队列
queue:analysis:processing → 处理中任务
lock:study:{study-id} → 分布式锁
```

### 5. 搜索引擎 - Elasticsearch

**用途**: 全文搜索、病例检索、报告搜索

**索引设计**:
```
// patients 索引
{
  mappings: {
    properties: {
      tenantId: { type: "keyword" },
      mrn: { type: "keyword" },
      deidHash: { type: "keyword" },
      createdAt: { type: "date" }
    }
  }
}

// reports 索引
{
  mappings: {
    properties: {
      tenantId: { type: "keyword" },
      studyId: { type: "keyword" },
      patientId: { type: "keyword" },
      reportText: { type: "text" },
      findings: { type: "nested" },
      modality: { type: "keyword" },
      studyDate: { type: "date" },
      createdAt: { type: "date" }
    }
  }
}
```

## 数据流转设计

### 影像上传流程

```
1. 客户端 → 认证授权
2. 获取预签名上传 URL
3. 客户端 → 直接上传到对象存储 (分片上传)
4. 上传完成 → 触发 Lambda/函数计算
5. 元数据提取 → PostgreSQL
6. DICOM 验证 → 合规检查
7. 缩略图生成 → 对象存储
8. 索引更新 → Elasticsearch
9. 审计日志记录
```

### 分析流程

```
1. 创建分析任务 → PostgreSQL
2. 任务入队 → Redis
3. Worker 领取任务
4. 从对象存储读取 DICOM
5. 预处理 (格式转换、归一化)
6. AI 模型推理
7. 结果后处理 (NMS、置信度过滤)
8. 可视化生成
9. 结果写入 PostgreSQL
10. 触发通知事件
11. 审计日志记录
```

## 备份与恢复策略

### 备份策略

| 数据存储 | 备份频率 | 保留期 | 备份类型 |
|---------|---------|--------|---------|
| PostgreSQL | 每小时增量 + 每日全量 | 35天 | WAL 归档 + 快照 |
| MongoDB | 每日全量 | 35天 | 快照 + Oplog |
| 对象存储 | 版本控制 + 跨区域复制 | 永久 | 版本化存储 |
| Redis | 每 15 分钟 RDB + AOF | 7天 | RDB + AOF |
| Elasticsearch | 每日快照 | 35天 | 快照到 S3 |

### 灾难恢复 (DR)

- **RPO**: PostgreSQL < 5 分钟, 对象存储 < 15 分钟
- **RTO**: 主区域故障后 < 1 小时切换到灾备区域
- **演练**: 每季度进行一次 DR 演练

## 数据去标识化与匿名化

### 去标识化策略

```python
# DICOM 标签清理
DICOM_TAGS_TO_REMOVE = [
    (0x0010, 0x0010),  # PatientName
    (0x0010, 0x0030),  # PatientBirthDate
    (0x0010, 0x1040),  # PatientAddress
    (0x0008, 0x0080),  # InstitutionName
    # ... 更多 PHI 标签
]

# 替换为匿名化值
DICOM_TAGS_TO_ANONYMIZE = {
    (0x0010, 0x0020): lambda mrn: hash_patient_id(mrn),  # PatientID
}
```

### 差分隐私

用于数据集研究和统计分析，添加噪声保护隐私。

## 数据销毁策略

### 销毁流程

1. **软删除**: 标记为 deleted_at，不可访问但保留
2. **保留期**: 满足法律保留要求后
3. **硬删除**: 永久删除数据
4. **介质擦除**: 物理销毁时遵循 DoD 5220.22-M 标准

### 销毁验证

- 哈希校验确认数据不可恢复
- 审计日志记录销毁操作
- 第三方验证 (可选)
