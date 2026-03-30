#!/bin/bash

# AI 医疗影像分析系统 - 健康检查脚本

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 超时设置 (秒)
TIMEOUT=30
DELAY=5

# 健康检查函数
healthcheck() {
    local name="$1"
    local command="$2"
    local timeout="$3"
    local delay="$4"

    echo -n "Checking $name..."

    local start_time=$(date +%s)
    local end_time=$((start_time + timeout))

    while [ $(date +%s) -lt $end_time ]; do
        if eval "$command" >/dev/null 2>&1; then
            echo -e " ${GREEN}✅${NC}"
            return 0
        fi
        sleep "$delay"
    done

    echo -e " ${RED}❌${NC}"
    return 1
}

# 服务状态检查
services=(
    "PostgreSQL" "docker exec ai-medical-postgres pg_isready -U admin -d medical_db"
    "Redis" "docker exec ai-medical-redis redis-cli ping"
    "MinIO" "curl -sf http://localhost:9000/minio/health/live"
    "MongoDB" "docker exec ai-medical-mongodb mongosh --eval 'db.runCommand(\"ping\").ok' --username admin --password password123 --authenticationDatabase admin"
    "Elasticsearch" "curl -sf http://localhost:9200/_cat/health"
    "Kibana" "curl -sf http://localhost:5601/api/status"
    "RabbitMQ" "curl -sf -u admin:password123 http://localhost:15672/api/aliveness-test/medical-vhost"
    "pgAdmin" "curl -sf http://localhost:5050/login"
    "Mongo Express" "curl -sf http://localhost:8081"
)

echo "AI 医疗影像分析系统健康检查"
echo "============================="

all_ok=1

for ((i=0; i<${#services[@]}; i+=2)); do
    name="${services[$i]}"
    command="${services[$i+1]}"

    if ! healthcheck "$name" "$command" "$TIMEOUT" "$DELAY"; then
        all_ok=0
        continue
    fi
done

echo ""

# 数据库连接测试
echo -n "Testing database connections..."

# 测试 PostgreSQL 连接
if docker exec ai-medical-postgres psql -U admin -d medical_db -c "SELECT 1" >/dev/null 2>&1; then
    echo -e " ${GREEN}✅${NC}"
else
    echo -e " ${RED}❌${NC}"
    all_ok=0
fi

echo ""

# 显示服务地址
echo -e "${YELLOW}服务访问地址:${NC}"
echo "  - PostgreSQL:     localhost:5432"
echo "  - Redis:          localhost:6379"
echo "  - MinIO:          localhost:9000 (console: 9001)"
echo "  - MongoDB:        localhost:27017"
echo "  - Elasticsearch:  localhost:9200"
echo "  - Kibana:         localhost:5601"
echo "  - RabbitMQ:       localhost:5672 (console: 15672)"
echo "  - pgAdmin:        localhost:5050"
echo "  - Mongo Express:  localhost:8081"

echo ""

# 显示系统状态
echo "系统状态: $(if [ $all_ok -eq 1 ]; then echo -e "${GREEN}✅ 健康${NC}"; else echo -e "${RED}❌ 有服务故障${NC}"; fi)"

exit $all_ok
