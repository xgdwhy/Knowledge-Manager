#!/bin/bash
# 启动 Knowledge Manager 所有服务

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "  Knowledge Manager 启动脚本"
echo "=========================================="

cd "$PROJECT_DIR"

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "[WARN] .env 文件不存在，从模板创建..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        echo "[ERROR] 未找到 .env.example 模板文件"
        exit 1
    fi
fi

# 检查 Docker 服务
if ! systemctl is-active --quiet docker; then
    echo "[INFO] 启动 Docker 服务..."
    sudo systemctl start docker
fi

# 检查镜像是否存在
REQUIRED_IMAGES=(
    "postgres:15-alpine"
    "minio/minio:latest"
    "getmeili/meilisearch:latest"
    "quay.io/keycloak/keycloak:latest"
    "gitea/gitea:latest"
    "makeplane/plane-frontend:latest"
    "makeplane/plane-backend:latest"
    "nextcloud:latest"
    "nginx:alpine"
)

MISSING=0
for img in "${REQUIRED_IMAGES[@]}"; do
    if ! docker image inspect "$img" &> /dev/null; then
        echo "[WARN] 缺少镜像: $img"
        ((MISSING++))
    fi
done

if [ "$MISSING" -gt 0 ]; then
    echo ""
    echo "[INFO] 检测到 $MISSING 个镜像缺失"
    echo "[INFO] 正在从 images/ 目录加载镜像..."
    bash "$SCRIPT_DIR/load-images.sh"
fi

# 启动服务
echo ""
echo "[INFO] 启动 Docker Compose 服务..."
docker compose up -d

# 等待服务就绪
echo ""
echo "[INFO] 等待服务启动..."
sleep 10

# 检查服务状态
echo ""
docker compose ps

echo ""
echo "=========================================="
echo "  服务启动完成！"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  统一门户:    http://localhost:8080/"
echo "  SSO 认证:    http://localhost:8080/auth/"
echo "  代码托管:    http://localhost:8080/code/"
echo "  任务管理:    http://localhost:8080/tasks/"
echo "  试验数据:    http://localhost:8080/data/"
echo "  MinIO 控制台: http://localhost:9001/"
echo ""
echo "查看日志: docker compose logs -f"
echo "停止服务: docker compose down"
