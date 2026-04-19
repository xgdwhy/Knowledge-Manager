#!/bin/bash
# scripts/start.sh

set -e

echo "Starting Knowledge Management Platform..."

# 检查 .env 文件
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please copy .env.example to .env and configure."
  exit 1
fi

# 加载环境变量
source .env

# 创建网络
docker network create knowledge-network 2>/dev/null || true

# 启动服务
docker-compose up -d

echo "Waiting for services to start..."
sleep 30

# 初始化 MinIO
echo "Initializing MinIO buckets..."
./scripts/setup-minio.sh

# 初始化 Keycloak
echo "Initializing Keycloak..."
./scripts/setup-keycloak.sh

echo "Platform started successfully!"
echo "Access the portal at: https://${DOMAIN}"
