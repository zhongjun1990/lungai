# AI 医疗影像分析 SaaS - 安全架构

## 概述

医疗数据是最敏感的数据类型之一，本安全架构遵循 HIPAA、GDPR、等保三级等合规要求，确保数据安全、可追溯、可审计。

## 安全架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               边界安全                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  DDoS 防护  │  WAF  │  API 限流  │  流量分析  │  恶意 IP 阻止              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               身份与访问控制                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  MFA 认证  │  OAuth2 / OIDC  │  权限管理  │  会话管理  │  证书管理            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               数据安全                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  传输加密  │  静态加密  │  密钥管理  │  数据脱敏  │  去标识化                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               网络与基础设施安全                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  VPC 隔离  │  安全组  │  网络 ACL  │  服务网格  │  零信任网络              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               监控与审计                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  安全监控  │  日志聚合  │  审计日志  │  入侵检测  │  异常检测                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 身份认证与访问控制

### 认证方式

1. **多因素认证 (MFA)**
   - TOTP (Google Authenticator, Authy)
   - SMS (可选)
   - 生物识别 (移动端)

2. **单点登录 (SSO)**
   - 支持 SAML 2.0 / OAuth 2.0
   - 集成 Azure AD, Okta, OneLogin
   - 医院现有 AD 集成

3. **密码策略**
   - 最小长度: 12 字符
   - 要求大小写、数字、特殊字符
   - 密码历史: 最近 5 次
   - 过期时间: 90 天
   - 禁止常见密码

### 权限模型

**RBAC (基于角色的访问控制) + 细粒度权限**

```
超级管理员 (Super Admin)
├── 系统配置
├── 用户管理
├── 租户管理
└── 安全审计

租户管理员 (Tenant Admin)
├── 租户用户管理
├── 租户配置
└── 数据访问配置

医生 (Doctor)
├── 查看患者数据
├── 上传影像
├── 发起分析
└── 审核报告

技师 (Technician)
├── 上传影像
└── 管理检查

放射科医生 (Radiologist)
├── 查看患者数据
├── 审核 AI 结果
├── 撰写报告
└── 签署报告

数据科学家 (Data Scientist)
├── 去标识化数据访问
└── 模型训练 (受限)

审计员 (Auditor)
├── 审计日志查看
└── 合规报告生成
```

### 会话管理

- **会话超时**: 15 分钟无活动自动登出
- **会话固定保护**: 登录后重新生成会话 ID
- **并发会话限制**: 同一用户最多 3 个活跃会话
- **设备绑定**: 检测异常设备登录需要二次验证
- **JWT 签名**: RS256 非对称签名

## 数据安全

### 加密策略

| 数据类型 | 传输加密 | 静态加密 | 密钥类型 |
|---------|---------|---------|---------|
| 网络流量 | TLS 1.2+ | - | ECDHE-RSA-AES256-GCM-SHA384 |
| 数据库 | TLS 1.2+ | AES-256-GCM | AES-256 密钥 |
| 对象存储 | TLS 1.2+ | SSE-KMS/SSE-S3 | KMS 管理密钥 |
| 密码 | - | bcrypt | 工作因子 12 |
| 患者身份 | TLS 1.2+ | AES-256-GCM | 租户级别密钥 |
| 审计日志 | TLS 1.2+ | 写保护 | 签名验证 |

### 密钥管理

**HashiCorp Vault / AWS KMS**

- **密钥轮换**:
  - 数据加密密钥 (DEK): 90 天自动轮换
  - 密钥加密密钥 (KEK): 1 年自动轮换
  - 主密钥 (CMK): 2 年轮换

- **访问控制**:
  - IAM 策略控制 KMS 访问
  - 密钥使用审计日志
  - 紧急访问流程 (Break-Glass)

### 数据去标识化

```python
def deidentify_dicom(input_path, output_path, tenant_id):
    """DICOM 文件去标识化"""
    import pydicom
    from hashlib import sha256

    ds = pydicom.dcmread(input_path)

    # 移除 PHI 标签
    tags_to_remove = [
        (0x0010, 0x0010),  # PatientName
        (0x0010, 0x0030),  # PatientBirthDate
        (0x0010, 0x1000),  # OtherPatientIDs
        (0x0010, 0x1001),  # OtherPatientNames
        (0x0010, 0x1010),  # PatientAge
        (0x0010, 0x1040),  # PatientAddress
        (0x0010, 0x2154),  # PatientTelephoneNumbers
        (0x0008, 0x0080),  # InstitutionName
        (0x0008, 0x0081),  # InstitutionAddress
        (0x0008, 0x0090),  # ReferringPhysicianName
        (0x0008, 0x0092),  # ReferringPhysicianAddress
        (0x0008, 0x0094),  # ReferringPhysicianTelephoneNumbers
        (0x0008, 0x1030),  # StudyDescription
        (0x0008, 0x103E),  # SeriesDescription
        (0x0020, 0x4000),  # ImageComments
    ]

    for tag in tags_to_remove:
        if tag in ds:
            del ds[tag]

    # 替换为去标识化 ID
    if (0x0010, 0x0020) in ds:
        original_mrn = ds.PatientID
        deid_hash = sha256(f"{original_mrn}:{tenant_id}".encode()).hexdigest()[:16]
        ds.PatientID = f"DEID-{deid_hash}"
        ds.add_new((0x0010, 0x1005), 'LO', deid_hash)

    # 随机化日期 (保留年龄)
    if (0x0008, 0x0020) in ds:
        # 保留年，随机化月日
        original_date = ds.StudyDate
        if len(original_date) >= 4:
            import random
            year = original_date[:4]
            month = f"{random.randint(1, 12):02d}"
            day = f"{random.randint(1, 28):02d}"
            ds.StudyDate = f"{year}{month}{day}"

    ds.save_as(output_path)
    return ds
```

### 差分隐私

用于数据集研究和统计分析，添加噪声保护隐私。

```python
import numpy as np

def add_laplace_noise(data, epsilon, sensitivity):
    """添加 Laplace 噪声实现差分隐私"""
    scale = sensitivity / epsilon
    noise = np.random.laplace(0, scale, size=data.shape)
    return data + noise

def apply_differential_privacy(statistics, epsilon=0.5):
    """对统计数据应用差分隐私"""
    sensitivity = 1.0
    return add_laplace_noise(statistics, epsilon, sensitivity)
```

## 网络安全

### VPC 网络架构

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  公共子网 (Public Subnet)                                        │
│  - ALB / NLB (HTTPS: 443)                                      │
│  - Bastion Host (SSH: 22, 仅限白名单)                          │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  应用子网 (Application Subnet)                                  │
│  - API Gateway, 微服务                                           │
│  - 入站: 仅来自 ALB                                              │
│  - 出站: 仅到数据库、对象存储                                    │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  数据子网 (Data Subnet)                                         │
│  - PostgreSQL, MongoDB                                           │
│  - Redis, Elasticsearch                                          │
│  - 入站: 仅来自应用子网                                          │
│  - 出站: 仅必要的外部连接                                        │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  GPU 子网 (GPU Subnet)                                          │
│  - 推理服务器                                                    │
│  - 入站: 仅来自应用子网                                          │
│  - 出站: 仅到对象存储                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 服务网格安全

**Istio 安全策略**

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: medical-imaging
spec:
  mtls:
    mode: STRICT  # 强制 mTLS
---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: user-service-policy
  namespace: medical-imaging
spec:
  selector:
    matchLabels:
      app: user-service
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/medical-imaging/sa/api-gateway"]
    to:
    - operation:
        methods: ["GET", "POST"]
        paths: ["/v1/users/*"]
```

## 应用安全

### 输入验证

```python
from pydantic import BaseModel, validator, Field
import re

class CreatePatientRequest(BaseModel):
    mrn: str = Field(..., max_length=100)
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    birth_date: str = Field(...)

    @validator('mrn')
    def validate_mrn(cls, v):
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('MRN contains invalid characters')
        return v

    @validator('first_name', 'last_name')
    def validate_name(cls, v):
        # 防止 XSS
        if '<' in v or '>' in v or '&' in v:
            raise ValueError('Invalid characters in name')
        return v

    @validator('birth_date')
    def validate_date(cls, v):
        # YYYY-MM-DD
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', v):
            raise ValueError('Invalid date format')
        return v
```

### SQL 注入防护

```sql
-- 使用参数化查询
PREPARE get_patient(UUID) AS
    SELECT id, mrn FROM patients WHERE id = $1;
EXECUTE get_patient('123e4567-e89b-12d3-a456-426614174000');

-- 使用存储过程
CREATE OR REPLACE FUNCTION get_patient_by_id(p_id UUID)
RETURNS TABLE (id UUID, mrn VARCHAR)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT id, mrn FROM patients WHERE patients.id = p_id;
END;
$$;
```

### XSS 防护

```javascript
// 前端: 使用 DOMPurify 净化
import DOMPurify from 'dompurify';

const sanitized = DOMPurify.sanitize(userInput, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
});

// 后端: 转义输出
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 内容安全策略 (CSP)
Content-Security-Policy: default-src 'self';
                          script-src 'self' 'unsafe-inline' 'unsafe-eval';
                          style-src 'self' 'unsafe-inline';
                          img-src 'self' data: blob:;
                          object-src 'none';
                          frame-ancestors 'none';
```

### 文件上传安全

```python
ALLOWED_CONTENT_TYPES = {
    'application/dicom',
    'image/dicom'
}

MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB

def validate_file_upload(file, filename):
    """验证上传的文件"""
    # 1. 检查文件大小
    if file.size > MAX_FILE_SIZE:
        raise ValueError('File too large')

    # 2. 检查内容类型
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError('Invalid content type')

    # 3. 验证文件扩展名
    if not filename.lower().endswith('.dcm'):
        raise ValueError('Invalid file extension')

    # 4. 检查文件名 (防止路径遍历)
    if '..' in filename or '/' in filename or '\\' in filename:
        raise ValueError('Invalid filename')

    # 5. 验证文件内容 (DICOM 魔术头)
    file.seek(128)
    dicom_prefix = file.read(4)
    if dicom_prefix != b'DICM':
        raise ValueError('Not a valid DICOM file')

    return True
```

## 安全监控与审计

### 审计日志

所有数据操作必须记录审计日志：

```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID,
    user_id UUID,
    session_id UUID,
    request_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    geo_location JSONB,
    risk_score INTEGER,
    anomaly_detected BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- 分区索引
CREATE INDEX ON audit_logs (tenant_id, created_at);
CREATE INDEX ON audit_logs (user_id, created_at);
CREATE INDEX ON audit_logs (resource_type, resource_id, created_at);
CREATE INDEX ON audit_logs (action, created_at);
```

### 审计事件类型

| 事件类型 | 描述 |
|---------|------|
| LOGIN_SUCCESS | 登录成功 |
| LOGIN_FAILURE | 登录失败 |
| LOGOUT | 登出 |
| VIEW_PATIENT | 查看患者数据 |
| VIEW_STUDY | 查看影像检查 |
| UPLOAD_IMAGE | 上传影像 |
| DOWNLOAD_IMAGE | 下载影像 |
| SUBMIT_ANALYSIS | 提交分析 |
| VIEW_REPORT | 查看报告 |
| GENERATE_REPORT | 生成报告 |
| SIGN_REPORT | 签署报告 |
| EXPORT_DATA | 导出数据 |
| DELETE_DATA | 删除数据 |
| MODIFY_PERMISSION | 修改权限 |
| MODIFY_USER | 修改用户 |
| API_KEY_CREATE | 创建 API Key |
| API_KEY_REVOKE | 撤销 API Key |

### 安全告警

| 告警级别 | 触发条件 | 响应 |
|---------|---------|------|
| 紧急 | 多次登录失败、数据导出异常 | 立即阻止、通知安全团队 |
| 高 | 非工作时间访问、地理异常 | 二次验证、审计员审核 |
| 中 | 权限变更、敏感操作 | 记录审计、管理员审核 |
| 低 | 常规操作异常 | 系统分析、趋势观察 |

### 入侵检测

**检测规则示例 (Suricata / Snort)**:

```yaml
alert tcp any any -> $HOME_NET 443 (
    msg: "Suspicious DICOM upload from unknown IP";
    flow: to_server, established;
    content:"DICM"; offset:128; depth:4;
    threshold: type both, track by_src, count 5, seconds 300;
    sid: 1000001;
    rev: 1;
)
```

## 合规性

### HIPAA 合规检查清单

- [ ] 数据传输加密 (TLS 1.2+)
- [ ] 数据静态加密
- [ ] 访问控制 (最小权限)
- [ ] 完整的审计日志
- [ ] 定期安全评估
- [ ] 业务连续性计划
- [ ] 灾难恢复计划
- [ ] 员工安全培训
- [ ] 第三方供应商评估 (BAA)
- [ ] 违规通知流程
- [ ] PHI 访问授权记录
- [ ] 设备和介质控制
- [ ] 安全事件响应计划

### GDPR 数据主体权利

1. **访问权**: 用户可请求查看自己的数据
2. **更正权**: 用户可请求更正不准确的数据
3. **删除权**: 用户可请求删除自己的数据 (被遗忘权)
4. **限制处理权**: 用户可请求限制数据处理
5. **数据可携带权**: 用户可获取结构化、机器可读的数据副本
6. **反对权**: 用户可反对数据处理
7. **自动化决策反对权**: 用户可反对仅基于自动化的决策

## 安全事件响应

### 事件响应流程

```
1. 检测与报告
   ├── 安全告警触发
   ├── 员工或用户报告
   └── 自动检测系统

2. 评估与分类
   ├── 确定事件范围
   ├── 评估影响程度
   └── 分配优先级

3. 遏制
   ├── 立即阻止恶意活动
   ├── 隔离受影响系统
   └── 保护证据

4. 根除
   ├── 移除恶意代码
   ├── 修复漏洞
   └── 加强安全控制

5. 恢复
   ├── 恢复系统正常运行
   ├── 验证系统完整性
   └── 监控后续活动

6. 事后分析
   ├── 根本原因分析
   ├── 改进安全措施
   ├── 更新响应计划
   └── 培训与意识提升
```

### 合规通知时间

- **HIPAA**: 60 天内通知受影响个人
- **GDPR**: 72 小时内通知监管机构
- **等保三级**: 24 小时内报告上级主管部门

## 安全测试

### 定期安全测试

| 测试类型 | 频率 | 执行者 |
|---------|------|-------|
| 渗透测试 | 每季度 | 第三方安全公司 |
| 漏洞扫描 | 每周 | 自动扫描 + 人工验证 |
| 代码审查 | 每次提交 | 开发团队 + 自动化工具 |
| 依赖检查 | 每周 | Snyk / Dependabot |
| 红队演练 | 每半年 | 专业红队 |

### 安全测试工具

- **DAST (动态应用安全测试)**: OWASP ZAP, Burp Suite
- **SAST (静态应用安全测试)**: SonarQube, Fortify
- **SCA (软件组成分析)**: Snyk, Dependabot
- **容器安全**: Clair, Trivy
- **基础设施安全**: Checkov, Terrascan
