#!/bin/bash
# 保存 Docker 镜像到 images 目录

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
IMAGES_DIR="$PROJECT_DIR/images"

echo "=========================================="
echo "  Docker 镜像保存脚本"
echo "=========================================="

# 创建 images 目录
mkdir -p "$IMAGES_DIR"

# 定义需要保存的镜像
IMAGES=(
    "postgres:15-alpine"
    "minio/minio:latest"
    "getmeili/meilisearch:latest"
    "quay.io/keycloak/keycloak:latest"
    "gitea/gitea:latest"
    "makeplane/plane-frontend:latest"
    "makeplane/plane-admin:latest"
    "makeplane/plane-space:latest"
    "makeplane/plane-backend:latest"
    "makeplane/plane-live:latest"
    "makeplane/plane-proxy:latest"
    "nextcloud:latest"
    "nginx:alpine"
    "valkey/valkey:7.2-alpine"
    "rabbitmq:3.13-alpine"
    "ghcr.io/linuxserver/dokuwiki:latest"
)

SAVED=0
SKIPPED=0

echo "[INFO] 将保存 ${#IMAGES[@]} 个镜像到 $IMAGES_DIR"
echo ""

for img in "${IMAGES[@]}"; do
    # 生成文件名
    filename=$(echo "$img" | sed 's/[\/:]/-/g' | sed 's/^ghcr-io-//' | sed 's/^quay-io-//')
    filepath="$IMAGES_DIR/${filename}.tar.gz"

    echo -n "保存 $img ... "

    if ! docker image inspect "$img" &> /dev/null; then
        echo "✗ 镜像不存在"
        ((SKIPPED++))
        continue
    fi

    if docker save "$img" | gzip > "$filepath"; then
        SIZE=$(du -h "$filepath" | cut -f1)
        echo "✓ $SIZE"
        ((SAVED++))
    else
        echo "✗ 保存失败"
        rm -f "$filepath"
        ((SKIPPED++))
    fi
done

echo ""
echo "=========================================="
echo "  保存完成: $SAVED 成功, $SKIPPED 跳过"
echo "=========================================="

# 显示目录大小
TOTAL_SIZE=$(du -sh "$IMAGES_DIR" | cut -f1)
echo ""
echo "镜像目录大小: $TOTAL_SIZE"
ls -lh "$IMAGES_DIR"
