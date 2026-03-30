# AI 医疗影像分析 SaaS - Makefile
# 便捷的开发和部署命令

.PHONY: help up down restart logs clean build test lint

# 颜色输出
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

# 默认目标
help: ## 显示帮助信息
	@echo "AI 医疗影像分析 SaaS - 开发命令"
	@echo ""
	@echo "可用命令:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

# ========== 开发环境命令 ==========

up: ## 启动开发环境
	@echo "$(GREEN)启动开发环境...$(NC)"
	@docker-compose up -d
	@echo ""
	@echo "$(GREEN)开发环境已启动!$(NC)"
	@echo "  - PostgreSQL:     localhost:5432"
	@echo "  - Redis:          localhost:6379"
	@echo "  - MinIO:          localhost:9000 (console: 9001)"
	@echo "  - MongoDB:        localhost:27017"
	@echo "  - Elasticsearch:  localhost:9200"
	@echo "  - Kibana:         localhost:5601"
	@echo "  - RabbitMQ:       localhost:5672 (console: 15672)"
	@echo "  - pgAdmin:        localhost:5050"
	@echo "  - Mongo Express:  localhost:8081"
	@echo ""
	@echo "$(YELLOW)运行 'make logs' 查看服务日志$(NC)"

up-minimal: ## 启动最小开发环境 (PostgreSQL + Redis + MinIO)
	@echo "$(GREEN)启动最小开发环境...$(NC)"
	@docker-compose up -d postgres redis minio
	@echo ""
	@echo "$(GREEN)最小开发环境已启动!$(NC)"
	@echo "  - PostgreSQL:     localhost:5432"
	@echo "  - Redis:          localhost:6379"
	@echo "  - MinIO:          localhost:9000 (console: 9001)"

down: ## 停止开发环境
	@echo "$(YELLOW)停止开发环境...$(NC)"
	@docker-compose down

restart: ## 重启开发环境
	@echo "$(YELLOW)重启开发环境...$(NC)"
	@docker-compose restart

logs: ## 查看服务日志
	@docker-compose logs -f

logs-postgres: ## 查看 PostgreSQL 日志
	@docker-compose logs -f postgres

logs-minio: ## 查看 MinIO 日志
	@docker-compose logs -f minio

ps: ## 查看运行状态
	@docker-compose ps

healthcheck: ## 健康检查
	@echo "$(GREEN)执行健康检查...$(NC)"
	@scripts/healthcheck.sh

# ========== 数据管理命令 ==========

init-minio: ## 初始化 MinIO 存储桶
	@echo "$(GREEN)初始化 MinIO 存储桶...$(NC)"
	@docker-compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin123 || true
	@docker-compose exec minio mc mb local/dicom-storage || true
	@docker-compose exec minio mc mb local/reports || true
	@docker-compose exec minio mc mb local/models || true
	@docker-compose exec minio mc mb local/thumbnails || true
	@echo "$(GREEN)MinIO 存储桶已创建!$(NC)"

reset-db: ## 重置数据库 (警告: 会删除所有数据!)
	@echo "$(RED)警告: 这将删除所有数据库数据!$(NC)"
	@read -p "确认继续? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "$(YELLOW)重置数据库...$(NC)"; \
		docker-compose down -v postgres; \
		docker-compose up -d postgres; \
		echo "$(GREEN)数据库已重置!$(NC)"; \
	else \
		echo "$(YELLOW)操作已取消$(NC)"; \
	fi

backup-db: ## 备份数据库
	@echo "$(GREEN)备份数据库...$(NC)"
	@mkdir -p backups
	@docker-compose exec -T postgres pg_dump -U admin -d medical_db | gzip > backups/medical_db_$(shell date +%Y%m%d_%H%M%S).sql.gz
	@echo "$(GREEN)数据库备份已保存到 backups/$(NC)"

# ========== 清理命令 ==========

clean: ## 清理所有数据和容器 (警告: 不可逆!)
	@echo "$(RED)警告: 这将删除所有数据和容器!$(NC)"
	@read -p "确认继续? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "$(YELLOW)清理所有资源...$(NC)"; \
		docker-compose down -v --remove-orphans; \
		echo "$(GREEN)清理完成!$(NC)"; \
	else \
		echo "$(YELLOW)操作已取消$(NC)"; \
	fi

clean-volumes: ## 只清理数据卷 (保留镜像)
	@echo "$(YELLOW)清理数据卷...$(NC)"
	@docker-compose down -v

# ========== 构建和测试 ==========

build: ## 构建所有服务
	@echo "$(GREEN)构建服务...$(NC)"
	@docker-compose build

test: ## 运行测试
	@echo "$(GREEN)运行测试...$(NC)"
	@npm test

lint: ## 代码检查
	@echo "$(GREEN)代码检查...$(NC)"
	@npm run lint

# ========== 工具命令 ==========

pgcli: ## 连接到 PostgreSQL
	@docker-compose exec postgres psql -U admin -d medical_db

mongo-cli: ## 连接到 MongoDB
	@docker-compose exec mongodb mongosh -u admin -p password123 --authenticationDatabase admin

redis-cli: ## 连接到 Redis
	@docker-compose exec redis redis-cli

minio-cli: ## 进入 MinIO 客户端
	@docker-compose exec minio mc

# ========== 安装和配置 ==========

setup: ## 完整安装和配置 (首次使用)
	@echo "$(GREEN)开始设置开发环境...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(YELLOW)已创建 .env 文件，请根据需要修改$(NC)"; \
	fi
	@$(MAKE) up
	@echo "$(YELLOW)等待服务启动...$(NC)"
	@sleep 15
	@$(MAKE) init-minio
	@echo ""
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)开发环境设置完成!$(NC)"
	@echo "$(GREEN)========================================$(NC)"
	@echo ""
	@echo "下一步:"
	@echo "  1. 检查并修改 .env 配置"
	@echo "  2. 运行 'make logs' 查看服务状态"
	@echo "  3. 运行 'make healthcheck' 验证服务"
	@echo ""

status: ## 显示开发环境状态
	@echo "$(GREEN)开发环境状态$(NC)"
	@echo "=================="
	@docker-compose ps
	@echo ""
	@echo "$(GREEN)服务地址$(NC)"
	@echo "==========="
	@echo "  PostgreSQL:     localhost:5432"
	@echo "  Redis:          localhost:6379"
	@echo "  MinIO:          localhost:9000 (console: 9001)"
	@echo "  MongoDB:        localhost:27017"
	@echo "  Elasticsearch:  localhost:9200"
	@echo "  Kibana:         localhost:5601"
	@echo "  RabbitMQ:       localhost:5672 (console: 15672)"
	@echo "  pgAdmin:        localhost:5050"
	@echo "  Mongo Express:  localhost:8081"
