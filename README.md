# AI 医疗影像分析 SaaS

AI 驱动的医疗影像分析 SaaS 平台，支持 DICOM 影像处理、AI 辅助诊断、报告生成等功能。

## 技术架构

详见技术文档:
- [系统架构设计](./ARCHITECTURE.md)
- [技术选型报告](./TECH_STACK.md)
- [AI 架构设计](./AI_ARCHITECTURE.md)
- [API 设计文档](./API_DESIGN.md)
- [数据架构设计](./DATA_ARCHITECTURE.md)
- [安全设计文档](./SECURITY.md)

## 快速开始

### 前置要求

- Docker 24.0+
- Docker Compose 2.20+
- Node.js 18+
- Python 3.11+
- Git 2.30+

### 环境配置

1. 克隆仓库:

```bash
git clone <repository-url>
cd ai-medical-imaging-saas
```

2. 配置环境变量:

```bash
cp .env.example .env
# 编辑 .env 文件，根据需要修改配置
```

3. 启动开发环境:

```bash
# 启动所有服务
docker-compose up -d

# 或者只启动数据服务
npm run dev:services
```

4. 初始化数据库:

```bash
# 数据库会通过 docker-compose 自动初始化
# 如需手动初始化，可执行:
docker-compose exec postgres psql -U admin -d medical_db -f /docker-entrypoint-initdb.d/init.sql
```

### 开发服务访问

开发环境启动后，以下服务可用:

| 服务 | 端口 | 地址 | 说明 |
|------|------|------|------|
| PostgreSQL | 5432 | localhost:5432 | 数据库 |
| Redis | 6379 | localhost:6379 | 缓存 |
| MinIO | 9000/9001 | localhost:9000 / localhost:9001 | 对象存储 |
| MongoDB | 27017 | localhost:27017 | 文档数据库 |
| Elasticsearch | 9200/9300 | localhost:9200 | 搜索引擎 |
| Kibana | 5601 | localhost:5601 | ES 可视化 |
| RabbitMQ | 5672/15672 | localhost:5672 / localhost:15672 | 消息队列 |
| pgAdmin | 5050 | localhost:5050 | Postgres 管理 |
| Mongo Express | 8081 | localhost:8081 | MongoDB 管理 |

### 默认凭据

开发环境默认凭据 (仅供开发使用):

| 服务 | 用户名 | 密码 |
|------|--------|------|
| PostgreSQL | admin | password123 |
| MongoDB | admin | password123 |
| MinIO | minioadmin | minioadmin123 |
| RabbitMQ | admin | password123 |
| pgAdmin | admin@example.com | password123 |
| 应用用户 | admin@example.com | admin123 |

## 开发命令

```bash
# 启动所有服务
npm run dev

# 只启动数据服务
npm run dev:services

# 停止服务
docker-compose down

# 查看服务日志
docker-compose logs -f

# 清理数据 (注意: 会删除所有数据!)
npm run compose:clean

# 运行测试
npm test
npm run test:unit
npm run test:integration

# 代码检查
npm run lint
npm run lint:fix

# 代码格式化
npm run format
```

## 项目结构

```
.
├── .github/
│   └── workflows/          # GitHub Actions 工作流
├── src/
│   ├── api/                # 后端 API 服务
│   ├── web/                # Web 前端应用
│   ├── mobile/             # 移动端应用
│   └── ai/                 # AI 模型和推理服务
├── infrastructure/
│   ├── terraform/          # 基础设施即代码
│   ├── helm/               # Kubernetes Helm charts
│   └── postgres/           # 数据库初始化脚本
├── tests/
│   ├── unit/               # 单元测试
│   ├── integration/        # 集成测试
│   └── e2e/                # 端到端测试
├── docs/                   # 文档
├── docker-compose.yml      # 开发环境配置
├── package.json            # NPM 包配置
└── README.md               # 本文件
```

## 数据架构

### 数据库

- **PostgreSQL**: 用户数据、患者数据、检查记录等关系型数据
- **MongoDB**: 非结构化元数据、报告模板、工作流状态
- **Redis**: 缓存、会话、任务队列
- **Elasticsearch**: 全文搜索、数据分析

### 存储

- **MinIO/S3**: DICOM 文件、缩略图、报告文件、AI 可视化结果

## 安全与合规

- 数据传输加密 (TLS 1.3)
- 数据静态加密
- 行级安全策略 (RLS)
- 完整的审计日志
- HIPAA 合规框架

详见 [SECURITY.md](./SECURITY.md)

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 联系方式

如有问题，请通过以下方式联系:
- 创建 Issue
- 发送邮件至: team@medical-imaging-ai.com
