# Knowledge Manager - 企业知识管理平台

统一知识池 · 全生命周期追溯 · 跨项目复用

一个基于 Docker Compose 的全开源企业知识管理系统，支持项目全生命周期追溯、跨项目成果复用、受控技术状态管理。

---

## 快速访问

| 服务 | 地址 | 说明 |
|------|------|------|
| **统一门户** | http://47.79.145.215:8080/ | 系统入口 |
| **任务管理** | http://47.79.145.215:8080/tasks/ | Plane 项目看板 |
| **代码托管** | http://47.79.145.215:8080/code/ | Gitea Git 服务 |
| **试验数据** | http://47.79.145.215:8080/data/ | Nextcloud 网盘 |
| **SSO 认证** | http://47.79.145.215:8080/auth/ | Keycloak 登录 |
| **MinIO 控制台** | http://47.79.145.215:9001/ | 对象存储管理 |
| **搜索 API** | http://47.79.145.215:7700/ | Meilisearch |

---

## 账户信息

### 系统管理员账户

| 服务 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| **Keycloak** | admin | `Km2024!Kc@Admin` | SSO 管理员 |
| **MinIO** | admin | `Km2024!Minio@Secure` | 对象存储管理员 |
| **DokuWiki** | admin | `Km2024!Wiki@Admin` | 知识库管理员 |
| **PostgreSQL** | knowledge | `Km2024!Pg@Secure` | 数据库管理员 |
| **Gitea** | admin | `Admin@Gitea2024!` | 代码托管管理员 |
| **Plane** | admin@knowledge.local | `Admin@2024!` | 任务管理管理员 |
| **Nextcloud** | admin | `Admin@Nextcloud2024!` | 试验数据管理员 |

### 服务密钥

| 服务 | 密钥 | 说明 |
|------|------|------|
| **Meilisearch** | `Km2024!Meili@Master` | 搜索引擎主密钥 |

> ⚠️ **安全提示**: 生产环境请修改 `.env` 文件中的所有默认密码

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx 反向代理                        │
│                      (8080/8443 端口)                        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Portal      │   │   Keycloak    │   │   Plane       │
│   统一门户     │   │   SSO 认证    │   │   任务看板    │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Gitea       │   │   Nextcloud   │   │   DokuWiki    │
│   代码托管     │   │   试验数据    │   │   知识库      │
└───────────────┘   └───────────────┘   └───────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │              基础设施层                   │
        │  PostgreSQL │ MinIO │ Meilisearch │ Redis │
        └─────────────────────────────────────────┘
```

---

## 模块说明

### 1. 统一门户 (Portal)

**访问地址**: http://47.79.145.215:8080/

统一入口页面，提供：
- **全局搜索**: 支持搜索知识、代码、任务、文件
- **快速访问**: 各业务模块入口卡片
- **统一导航**: 顶部导航菜单

**导航菜单**:
| 菜单项 | 跳转地址 | 说明 |
|--------|----------|------|
| 首页 | `/` | 门户首页 |
| 知识库 | `/wiki/` | DokuWiki 文档系统 |
| 代码 | `/code/` | Gitea 代码托管 |
| 任务 | `/tasks/` | Plane 项目管理 |
| 试验数据 | `/data/` | Nextcloud 网盘 |

**功能卡片**:
- 知识库 - 文档与知识条目管理
- 代码仓库 - 源代码与制品
- 任务看板 - 项目任务追踪
- 试验数据 - 视频与报告存储

---

### 2. SSO 认证中心 (Keycloak)

**登录页**: http://47.79.145.215:8080/auth/

**管理控制台**: http://47.79.145.215:8080/auth/admin/

**功能**:
- 统一身份认证
- 单点登录 (SSO)
- 用户管理
- 角色权限管理
- OAuth2 / OIDC 支持

**管理员登录**:
1. 访问管理控制台
2. 用户名: `admin`
3. 密码: `Km2024!Kc@Admin`

**创建新用户**:
1. 登录管理控制台
2. 选择 Realm (默认 master)
3. Users → Add user
4. 填写用户信息并设置密码

---

### 3. 任务管理 (Plane)

**访问地址**: http://47.79.145.215:8080/tasks/

**功能**:
- 项目管理
- 任务看板 (Kanban)
- Issue 追踪
- Sprint 规划
- 团队协作
- 周期管理
- 模块管理

**首次使用**:
1. 访问 Plane 页面
2. 首次访问会显示注册/登录页面
3. 创建账户和工作空间
4. 开始创建项目和任务

**主要功能**:
| 功能 | 说明 |
|------|------|
| 工作空间 | 组织项目和团队 |
| 项目 | 管理相关任务和资源 |
| Issue | 任务、Bug、需求追踪 |
| 看板 | 可视化任务流转 |
| 周期 | Sprint 迭代管理 |
| 模块 | 功能模块划分 |

---

### 4. 代码托管 (Gitea)

**访问地址**: http://47.79.145.215:8080/code/

**SSH 地址**: `ssh://git@47.79.145.215:2222/用户名/仓库.git`

**功能**:
- Git 仓库托管
- 代码审查 (Pull Request)
- Issue 管理
- Wiki 文档
- Release 发布
- Webhook 支持

**首次使用**:
1. 访问 Gitea 页面
2. 点击"注册"创建账户
3. 创建组织或直接创建仓库
4. 使用 Git 克隆仓库

**Git 配置示例**:
```bash
# HTTPS 克隆
git clone http://47.79.145.215:8080/code/用户名/仓库.git

# SSH 克隆
git clone ssh://git@47.79.145.215:2222/用户名/仓库.git
```

---

### 5. 试验数据 (Nextcloud)

**访问地址**: http://47.79.145.215:8080/data/

**功能**:
- 文件存储与共享
- 视频管理
- 协作编辑
- 版本控制
- 权限管理
- 桌面/移动端同步

**首次使用**:
1. 访问 Nextcloud 页面
2. 创建管理员账户
3. 开始上传文件

**客户端同步**:
- 桌面客户端: https://nextcloud.com/install/#install-clients
- 移动端: iOS App Store / Google Play

---

### 6. 知识库 (DokuWiki)

**访问地址**: 通过 Portal 导航进入

**功能**:
- Wiki 文档管理
- 知识条目
- 版本控制
- 访问控制
- 插件扩展

**管理员登录**:
- 用户名: `admin`
- 密码: `Km2024!Wiki@Admin`

---

### 7. 对象存储 (MinIO)

**API 地址**: http://47.79.145.215:9000/

**控制台地址**: http://47.79.145.215:9001/

**功能**:
- S3 兼容对象存储
- 文件上传下载
- 存储桶管理
- 访问策略配置
- 版本控制

**控制台登录**:
- 用户名: `admin`
- 密码: `Km2024!Minio@Secure`

**S3 客户端配置** (使用 mc 或 AWS CLI):
```bash
# mc 配置
mc alias set local http://47.79.145.215:9000 admin Km2024!Minio@Secure

# AWS CLI 配置
aws configure set aws_access_key_id admin
aws configure set aws_secret_access_key Km2024!Minio@Secure
aws --endpoint-url http://47.79.145.215:9000 s3 ls
```

---

### 8. 全文搜索 (Meilisearch)

**API 地址**: http://47.79.145.215:7700/

**功能**:
- 全文搜索
- 实时索引
- 多语言支持
- 拼写容错

**API 认证**:
```bash
curl -H "Authorization: Bearer Km2024!Meili@Master" \
  http://47.79.145.215:7700/indexes
```

---

## 服务端口映射

| 端口 | 服务 | 说明 |
|------|------|------|
| 8080 | Nginx | HTTP 入口 |
| 8443 | Nginx | HTTPS 入口 |
| 9000 | MinIO | S3 API |
| 9001 | MinIO | 管理控制台 |
| 7700 | Meilisearch | 搜索 API |
| 2222 | Gitea | SSH |

---

## 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 4GB 内存（推荐 8GB）

### 使用脚本部署（推荐）

```bash
# 1. 安装 Docker（如未安装）
./scripts/install-docker.sh

# 2. 加载本地镜像（离线部署）
./scripts/load-images.sh

# 3. 启动所有服务
./scripts/start.sh

# 4. 停止所有服务
./scripts/stop.sh

# 5. 保存镜像到本地
./scripts/save-images.sh
```

### 手动部署步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd KnowledgeManager

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改密码和域名

# 3. 从本地镜像加载（离线部署）
for img in images/*.tar.gz; do docker load < $img; done

# 4. 启动服务
docker compose up -d

# 5. 检查服务状态
docker compose ps
```

### 首次登录流程

1. **访问门户**: http://47.79.145.215:8080/
2. **点击登录**: 跳转到 Keycloak 登录页
3. **使用管理员账户**:
   - 用户名: `admin`
   - 密码: `Km2024!Kc@Admin`
4. **在各子系统创建账户**:
   - Gitea: 注册新账户
   - Plane: 首次访问时创建
   - Nextcloud: 首次访问时创建

---

## 目录结构

```
KnowledgeManager/
├── portal/                 # 统一门户前端
│   ├── src/
│   │   ├── components/     # React 组件
│   │   │   ├── Dashboard.tsx    # 仪表盘
│   │   │   ├── Header.tsx       # 导航栏
│   │   │   ├── LoginPage.tsx    # 登录页
│   │   │   └── SearchBar.tsx    # 搜索栏
│   │   ├── hooks/          # 自定义 Hooks
│   │   │   └── useAuth.ts       # 认证 Hook
│   │   ├── services/       # API 服务
│   │   │   ├── auth.ts          # 认证服务
│   │   │   └── search.ts        # 搜索服务
│   │   └── index.css       # 样式文件
│   ├── package.json
│   └── Dockerfile
├── nginx/                  # Nginx 配置
│   ├── nginx.conf          # 反向代理配置
│   └── ssl/                # SSL 证书
├── postgres/               # 数据库初始化
│   └── init/
│       └── 01-init-databases.sql
├── scripts/                # 工具脚本
├── images/                 # Docker 镜像归档
├── docker-compose.yml      # 服务编排
├── .env                    # 环境变量
└── README.md               # 本文档
```

---

## 运维管理

### 服务管理命令

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 重启单个服务
docker compose restart <service-name>

# 查看日志
docker compose logs -f <service-name>

# 查看服务状态
docker compose ps

# 查看资源使用
docker stats
```

### 数据备份

```bash
# 备份 PostgreSQL
docker exec knowledge-postgres pg_dumpall -U knowledge > backup.sql

# 备份 MinIO
mc mirror local/ ./backup/minio/
```

### 故障排查

```bash
# 检查容器日志
docker compose logs plane-api --tail 100

# 检查容器状态
docker compose ps

# 进入容器调试
docker exec -it knowledge-plane-api bash
```

---

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `POSTGRES_USER` | PostgreSQL 用户名 | knowledge |
| `POSTGRES_PASSWORD` | PostgreSQL 密码 | - |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak 管理员密码 | - |
| `MINIO_ROOT_USER` | MinIO 用户名 | admin |
| `MINIO_ROOT_PASSWORD` | MinIO 密码 | - |
| `MEILI_MASTER_KEY` | Meilisearch 主密钥 | - |
| `DOKUWIKI_PASSWORD` | DokuWiki 管理员密码 | - |
| `DOMAIN` | 部署域名 | localhost |

---

## 技术栈

### 前端
- React 18
- TypeScript
- Vite
- Tailwind CSS

### 后端服务
- Keycloak (Java/Quarkus) - SSO 认证
- Plane (Python/Django) - 项目管理
- Gitea (Go) - Git 服务
- Nextcloud (PHP) - 文件共享
- DokuWiki (PHP) - 知识库

### 基础设施
- PostgreSQL 15
- Redis/Valkey
- RabbitMQ
- MinIO
- Meilisearch
- Nginx

---

## 许可证

本项目采用 MIT 许可证。各组件遵循其各自的开源协议。

---

## 联系方式

如有问题，请联系系统管理员。
