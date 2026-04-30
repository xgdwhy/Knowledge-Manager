#!/bin/bash
# 加载 images 目录下的 Docker 镜像

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
IMAGES_DIR="$PROJECT_DIR/images"

echo "=========================================="
echo "  Docker 镜像加载脚本"
echo "=========================================="

# 检查 images 目录
if [ ! -d "$IMAGES_DIR" ]; then
    echo "[ERROR] images 目录不存在: $IMAGES_DIR"
    exit 1
fi

# 统计镜像数量
IMAGE_COUNT=$(ls -1 "$IMAGES_DIR"/*.tar.gz 2>/dev/null | wc -l)
if [ "$IMAGE_COUNT" -eq 0 ]; then
    echo "[WARN] 未找到镜像文件 (*.tar.gz)"
    exit 0
fi

echo "[INFO] 找到 $IMAGE_COUNT 个镜像文件"
echo ""

# 加载镜像
LOADED=0
SKIPPED=0

for img_file in "$IMAGES_DIR"/*.tar.gz; do
    filename=$(basename "$img_file")
    imagename="${filename%.tar.gz}"

    echo -n "加载 $filename ... "

    if docker load < "$img_file" 2>&1 | grep -q "Loaded image"; then
        echo "✓ 成功"
        ((LOADED++))
    else
        echo "✗ 失败"
        ((SKIPPED++))
    fi
done

echo ""
echo "=========================================="
echo "  加载完成: $LOADED 成功, $SKIPPED 跳过"
echo "=========================================="

# 显示已加载的镜像
echo ""
echo "已加载的镜像列表:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -20
