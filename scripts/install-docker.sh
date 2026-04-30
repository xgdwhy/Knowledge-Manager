#!/bin/bash
# 安装 Docker 和 Docker Compose
# 适用于 CentOS/RHEL/Alibaba Cloud Linux

set -e

echo "=========================================="
echo "  Docker 安装脚本"
echo "=========================================="

# 检查是否已安装
if command -v docker &> /dev/null; then
    echo "[INFO] Docker 已安装: $(docker --version)"
else
    echo "[1/4] 安装 Docker..."
    sudo yum install -y yum-utils
    sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    echo "[2/4] 启动 Docker 服务..."
    sudo systemctl start docker
    sudo systemctl enable docker

    echo "[INFO] Docker 安装完成: $(docker --version)"
fi

# 检查 Docker Compose
if docker compose version &> /dev/null; then
    echo "[INFO] Docker Compose 已安装: $(docker compose version)"
else
    echo "[3/4] 安装 Docker Compose..."
    sudo yum install -y docker-compose-plugin
    echo "[INFO] Docker Compose 安装完成"
fi

# 配置 Docker 镜像加速（可选）
echo "[4/4] 配置 Docker..."
if [ ! -f /etc/docker/daemon.json ]; then
    sudo mkdir -p /etc/docker
    sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF
    sudo systemctl daemon-reload
    sudo systemctl restart docker
fi

echo "=========================================="
echo "  Docker 安装完成！"
echo "=========================================="
docker --version
docker compose version
