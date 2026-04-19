#!/bin/bash
# scripts/backup.sh

set -e

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/${DATE}"
RETENTION_DAYS=30

echo "Starting backup at ${DATE}"

mkdir -p "${BACKUP_DIR}"

# PostgreSQL 备份
echo "Backing up PostgreSQL..."
docker exec knowledge-postgres pg_dumpall -U ${POSTGRES_USER:-knowledge} | gzip > "${BACKUP_DIR}/postgres.sql.gz"

# MinIO 备份
echo "Backing up MinIO..."
mc mirror knowledge-minio/knowledge-drawings "${BACKUP_DIR}/minio/drawings"
mc mirror knowledge-minio/knowledge-artifacts "${BACKUP_DIR}/minio/artifacts"
mc mirror knowledge-minio/knowledge-baselines "${BACKUP_DIR}/minio/baselines"

# DokuWiki 备份
echo "Backing up DokuWiki..."
docker cp knowledge-dokuwiki:/bitnami/dokuwiki "${BACKUP_DIR}/dokuwiki"

# Gitea 备份
echo "Backing up Gitea..."
docker exec knowledge-gitea gitea dump -c /data/gitea/conf/app.ini
docker cp knowledge-gitea:/app/gitea/gitea-dump.zip "${BACKUP_DIR}/gitea-dump.zip"

# 清理过期备份
echo "Cleaning old backups..."
find /backup -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true

echo "Backup completed successfully"
