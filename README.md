# Knowledge Manager - 企业知识管理平台

一个基于 Docker Compose 的全开源企业知识管理系统，支持项目全生命周期追溯、跨项目成果复用、受控技术状态管理。

## 功能特性

- **统一门户** - 单一入口访问所有子系统
- **单点登录** - 基于 Keycloak 的 SSO 认证
- **知识库** - DokuWiki 驱动的文档管理
- **代码托管** - Gitea 轻量级 Git 服务
- **任务管理** - Plane 现代化项目看板
- **试验数据** - Nextcloud 大文件存储与共享
- **对象存储** - MinIO S3 兼容存储服务
- **全局搜索** - Meilisearch 全文搜索引擎

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户访问层                                │
│                   https://knowledge.company.local               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                     Nginx 反向代理                               │
│              (SSL 终止 / 路由分发 / 请求转发)                     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Portal 前端   │   │   Keycloak    │   │  Meilisearch  │
│  (统一门户)    │   │  (SSO 认证)   │   │  (搜索引擎)   │
└───────┬───────┘   └───────────────┘   └───────────────┘
        │
        │    ┌──────────────┼──────────────┐
        │    │              │              │
        ▼    ▼              ▼              ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  DokuWiki     │   │    Gitea      │   │    Plane      │
│  (知识库)     │   │  (代码托管)   │   │  (任务看板)   │
└───────────────┘   └───────────────┘   └───────────────┘
        │
        ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Nextcloud   │   │    MinIO      │   │  PostgreSQL   │
│  (试验数据)   │   │  (对象存储)   │   │   (数据库)    │
└───────────────┘   └───────────────┘   └───────────────┘
```

## 服务组件

| 服务        | 端口      | 用途               |
| ----------- | --------- | ------------------ |
| Nginx       | 80/443    | 反向代理、SSL 终止 |
| Portal      | 3000      | 统一门户前端       |
| Keycloak    | 8080      | SSO 认证中心       |
| DokuWiki    | 8081      | 知识库核心         |
| Gitea       | 3000 (内) | 代码托管           |
| Plane       | 3001      | 任务看板           |
| Nextcloud   | 8082      | 试验数据网盘       |
| MinIO       | 9000/9001 | 对象存储           |
| Meilisearch | 7700      | 全局搜索           |
| PostgreSQL  | 5432      | 数据库             |

## 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 服务器配置：8 核 CPU / 32GB 内存 / 500GB+ 存储

### 安装部署

1. **克隆项目**

```bash
git clone https://github.com/your-org/knowledge-manager.git
cd knowledge-manager
```

2. **配置环境变量**

```bash
cp .env.example .env
# 编辑 .env 文件，修改以下配置：
# - POSTGRES_PASSWORD: 数据库密码
# - KEYCLOAK_ADMIN_PASSWORD: Keycloak 管理员密码
# - MINIO_ROOT_PASSWORD: MinIO 密码
# - MEILI_MASTER_KEY: Meilisearch 密钥
# - DOKUWIKI_PASSWORD: DokuWiki 管理员密码
# - DOMAIN: 域名（如 knowledge.company.local）
```

3. **启动服务**

```bash
docker-compose up -d
```

4. **初始化 MinIO 存储桶**

```bash
# 等待 MinIO 启动后执行
docker-compose exec minio /bin/sh /scripts/setup-minio.sh
```

5. **初始化 Keycloak**

```bash
# 等待 Keycloak 启动后执行
docker-compose exec keycloak /bin/sh /scripts/setup-keycloak.sh
```

6. **访问系统**

打开浏览器访问 `https://your-domain/`

### 开发模式

仅启动 Portal 前端进行开发：

```bash
cd portal
npm install
npm run dev
```

## 目录结构

```
knowledge-manager/
├── docker-compose.yml      # Docker Compose 配置
├── .env.example            # 环境变量示例
├── nginx/
│   └── nginx.conf          # Nginx 配置
├── postgres/
│   └── init/
│       └── 01-init-databases.sql  # 数据库初始化脚本
├── scripts/
│   ├── setup-minio.sh      # MinIO 初始化脚本
│   └── setup-keycloak.sh   # Keycloak 初始化脚本
├── portal/                 # 统一门户前端
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── hooks/          # 自定义 Hooks
│   │   └── services/       # API 服务
│   ├── package.json
│   └── Dockerfile
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-04-19-knowledge-manager-design.md  # 设计文档
```

## 权限模型

| 角色            | DokuWiki  | Gitea  | Plane    | Nextcloud | MinIO    |
| --------------- | --------- | ------ | -------- | --------- | -------- |
| admin           | 全部权限  | 管理员 | 管理员   | 全部权限  | 全部权限 |
| project-manager | 编辑+审批 | 写入   | 项目管理 | 上传+下载 | 读写     |
| engineer        | 编辑      | 写入   | 编辑任务 | 上传+下载 | 读取     |
| viewer          | 只读      | 只读   | 查看任务 | 下载      | 读取     |

## 备份策略

| 数据类型   | 备份频率 | 保留周期 | 备份方式        |
| ---------- | -------- | -------- | --------------- |
| PostgreSQL | 每日增量 | 30 天    | pg_dump + wal-g |
| MinIO 数据 | 每日增量 | 90 天    | MinIO Mirror    |
| DokuWiki   | 每日全量 | 30 天    | rsync           |
| Gitea 仓库 | 每日全量 | 30 天    | git bundle      |
| 基线快照   | 永久保留 | -        | 只读归档        |

## 技术栈

### 后端服务

- [Keycloak](https://www.keycloak.org/) - SSO 认证
- [DokuWiki](https://www.dokuwiki.org/) - 知识库
- [Gitea](https://gitea.io/) - Git 服务
- [Plane](https://plane.so/) - 项目管理
- [Nextcloud](https://nextcloud.com/) - 文件共享
- [MinIO](https://min.io/) - 对象存储
- [Meilisearch](https://www.meilisearch.com/) - 搜索引擎
- [PostgreSQL](https://www.postgresql.org/) - 关系数据库

### 前端

- [React 18](https://react.dev/) - UI 框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Vite](https://vitejs.dev/) - 构建工具
- [React Router](https://reactrouter.com/) - 路由
- [Keycloak JS](https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter) - 认证适配器
- [Meilisearch JS](https://github.com/meilisearch/meilisearch-js) - 搜索客户端

## 许可证

本项目基于 MIT 许可证开源。各组件遵循其各自的开源协议。

## 贡献

欢迎提交 Issue 和 Pull Request。

## 联系方式

如有问题，请提交 GitHub Issue。
