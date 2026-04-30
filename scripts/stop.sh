#!/bin/bash
# 停止 Knowledge Manager 所有服务

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "  Knowledge Manager 停止脚本"
echo "=========================================="

cd "$PROJECT_DIR"

echo "[INFO] 停止所有服务..."
docker compose down

echo ""
echo "=========================================="
echo "  服务已停止"
echo "=========================================="
echo ""
echo "数据卷保留，重新启动请执行: scripts/start.sh"
echo "如需清理数据卷: docker compose down -v"
