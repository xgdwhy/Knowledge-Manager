#!/bin/bash
# 安装 Docker 和 Docker Compose
# 支持 CentOS/RHEL/Alibaba Cloud Linux 和 Ubuntu/Debian

set -e

echo "=========================================="
echo "  Docker 安装脚本"
echo "=========================================="

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    elif [ -f /etc/redhat-release ]; then
        OS="centos"
    else
        echo "[ERROR] 无法检测操作系统"
        exit 1
    fi
    echo "[INFO] 检测到操作系统: $OS"
}

# 安装 Docker (CentOS/RHEL)
install_docker_centos() {
    echo "[INFO] 使用 yum 安装 Docker..."
    sudo yum install -y yum-utils
    sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
}

# 安装 Docker (Ubuntu/Debian)
install_docker_ubuntu() {
    echo "[INFO] 使用 apt 安装 Docker..."

    # 更新包索引
    sudo apt-get update

    # 安装依赖
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    # 添加 Docker 官方 GPG 密钥
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    # 添加 Docker 仓库
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # 安装 Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
}

# 安装 Docker Compose (CentOS/RHEL)
install_compose_centos() {
    echo "[INFO] 安装 Docker Compose..."
    sudo yum install -y docker-compose-plugin
}

# 安装 Docker Compose (Ubuntu/Debian)
install_compose_ubuntu() {
    echo "[INFO] 安装 Docker Compose..."
    sudo apt-get install -y docker-compose-plugin
}

# 主流程
detect_os

# 检查是否已安装
if command -v docker &> /dev/null; then
    echo "[INFO] Docker 已安装: $(docker --version)"
else
    echo ""
    echo "[1/4] 安装 Docker..."

    case $OS in
        centos|rhel|rocky|almalinux|alinux)
            install_docker_centos
            ;;
        ubuntu|debian)
            install_docker_ubuntu
            ;;
        *)
            echo "[ERROR] 不支持的操作系统: $OS"
            exit 1
            ;;
    esac

    echo "[2/4] 启动 Docker 服务..."
    sudo systemctl start docker
    sudo systemctl enable docker

    echo "[INFO] Docker 安装完成: $(docker --version)"
fi

# 检查 Docker Compose
if docker compose version &> /dev/null; then
    echo "[INFO] Docker Compose 已安装: $(docker compose version)"
else
    echo ""
    echo "[3/4] 安装 Docker Compose..."

    case $OS in
        centos|rhel|rocky|almalinux|alinux)
            install_compose_centos
            ;;
        ubuntu|debian)
            install_compose_ubuntu
            ;;
    esac

    echo "[INFO] Docker Compose 安装完成"
fi

# 配置 Docker
echo ""
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

# 添加当前用户到 docker 组（可选）
if ! groups | grep -q docker; then
    echo ""
    echo "[INFO] 将当前用户添加到 docker 组..."
    sudo usermod -aG docker $USER
    echo "[WARN] 请注销并重新登录以生效"
fi

echo ""
echo "=========================================="
echo "  Docker 安装完成！"
echo "=========================================="
docker --version
docker compose version
