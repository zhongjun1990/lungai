# AI 医疗影像分析 SaaS

AI 驱动的医疗影像分析 SaaS 平台，支持 DICOM 影像处理、AI 辅助诊断、报告生成等功能。

## 项目状态

**开发中** - 已完成后端 API 数据库层和 AI 推理服务骨架实现。

## 技术架构

详见技术文档:
- [系统架构设计](./ARCHITECTURE.md)
- [技术选型报告](./TECH_STACK.md)
- [AI 架构设计](./AI_ARCHITECTURE.md)
- [API 设计文档](./API_DESIGN.md)
- [数据架构设计](./DATA_ARCHITECTURE.md)
- [安全设计文档](./SECURITY.md)

## 已实现功能

### 后端 API 服务 (`src/api/`)

- 多数据库架构 (PostgreSQL + MongoDB + Redis)
- 用户认证与授权 (JWT)
- 患者、检查管理
- Repository 模式数据访问层
- 内存/数据库切换支持

### AI 推理服务 (`src/ai/`)

- Express REST API 服务
- RabbitMQ 消息队列集成
- MinIO 对象存储服务
- TensorFlow.js 模型服务骨架
- 多模型 Worker 支持 (肺结节检测、胸部X光分类)
- 分析任务异步处理
- 结果存储与报告生成

## 快速开始

### 前置要求

- Docker 24.0+
- Docker Compose 2.20+
- Node.js 18+
- Git 2.30+

### 环境配置

1. 克隆仓库:

```bash
git clone <repository-url>
cd ai-medical-imaging-saas
```

2. 配置环境变量:

```bash
# 配置 API 服务
cd src/api
cp .env.example .env

# 配置 AI 服务
cd ../ai
cp .env.example .env
```

3. 启动数据服务:

```bash
# 回到项目根目录
cd ../..

# 启动数据服务
npm run dev:services
```

4. 安装依赖并启动服务:

```bash
# 安装根依赖
npm install

# 安装并启动 API 服务 (新终端)
npm run dev:api

# 安装并启动 AI 服务 (新终端)
npm run dev:ai
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
| API Service | 3000 | localhost:3000 | 后端 API |
| AI Service | 3001 | localhost:3001 | AI 推理服务 |

### 默认凭据

开发环境默认凭据 (仅供开发使用):

| 服务 | 用户名 | 密码 |
|------|--------|------|
| PostgreSQL | admin | password123 |
| MongoDB | admin | password123 |
| MinIO | minioadmin | minioadmin123 |
| RabbitMQ | admin | password123 |
| pgAdmin | admin@example.com | password123 |

## 开发命令

```bash
# 启动数据服务
npm run dev:services

# 启动 API 服务
npm run dev:api

# 启动 AI 服务
npm run dev:ai

# 构建所有服务
npm run build

# 停止服务
docker-compose down

# 查看服务日志
docker-compose logs -f

# 清理数据 (注意: 会删除所有数据!)
npm run compose:clean

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
│   │   ├── src/
│   │   │   ├── config/     # 环境配置
│   │   │   ├── database/   # PostgreSQL/MongoDB/Redis 连接
│   │   │   ├── models/     # MongoDB 模型
│   │   │   ├── repositories/# 数据访问层
│   │   │   ├── routes/     # API 路由
│   │   │   ├── middleware/ # 中间件
│   │   │   ├── store/      # 内存存储
│   │   │   ├── utils/      # 工具函数
│   │   │   ├── types/      # TypeScript 类型
│   │   │   └── index.ts    # 服务入口
│   │   └── package.json
│   ├── ai/                 # AI 推理服务
│   │   ├── src/
│   │   │   ├── config/     # 环境配置
│   │   │   ├── database/   # MongoDB 连接
│   │   │   ├── models/     # MongoDB 模型
│   │   │   ├── repositories/# 数据访问层
│   │   │   ├── services/   # 业务服务 (MQ/Storage/Model)
│   │   │   ├── workers/    # 分析任务 Worker
│   │   │   ├── routes/     # API 路由
│   │   │   ├── utils/      # 工具函数
│   │   │   ├── types/      # TypeScript 类型
│   │   │   └── index.ts    # 服务入口
│   │   └── package.json
│   ├── web/                # Web 前端应用 (待实现)
│   └── mobile/             # 移动端应用 (待实现)
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
- **MongoDB**: DICOM 元数据、分析结果、报告模板、工作流状态
- **Redis**: 缓存、会话、任务队列
- **Elasticsearch**: 全文搜索、数据分析

### 存储

- **MinIO/S3**: DICOM 文件、缩略图、报告文件、AI 可视化结果

## API 端点

### API 服务 (端口 3000)

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/users/me` - 获取当前用户信息
- `GET /api/patients` - 获取患者列表
- `POST /api/patients` - 创建患者
- `GET /api/studies` - 获取检查列表
- `POST /api/studies` - 创建检查
- `GET /health` - 健康检查

### AI 服务 (端口 3001)

- `POST /api/analysis/tasks` - 创建分析任务
- `GET /api/analysis/results/:taskId` - 获取分析结果
- `GET /health` - 健康检查
- `GET /api/analysis/health` - AI 服务健康检查

## 安全与合规

- 数据传输加密 (TLS 1.3)
- 数据静态加密
- JWT 认证
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
