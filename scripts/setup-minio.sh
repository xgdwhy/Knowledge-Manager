#!/bin/bash
# scripts/setup-minio.sh

# 等待 MinIO 启动
sleep 10

# 配置 mc 客户端
mc alias set local http://localhost:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}

# 创建存储桶
mc mb local/knowledge-drawings
mc mb local/knowledge-artifacts
mc mb local/knowledge-videos
mc mb local/knowledge-images
mc mb local/knowledge-reports
mc mb local/gitea-lfs
mc mb local/nextcloud-data
mc mb local/knowledge-baselines

# 设置版本控制
mc version enable local/knowledge-drawings
mc version enable local/knowledge-artifacts
mc version enable local/knowledge-baselines

echo "MinIO buckets created successfully"
