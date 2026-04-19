# 知识管理系统设计文档

## 文档信息

- **创建日期**: 2026-04-19
- **版本**: 1.0
- **作者**: Claude Code

---

## 一、项目概述

### 1.1 背景

项目涉及论证、设计、实施、试验四个阶段，产生数据类型复杂，包括：文档、代码、二进制制品、STEP 三维图纸、试验视频/图片、试验报告等。

### 1.2 核心痛点

- 各阶段产物分散存储，追溯前因后果依赖人工记忆
- 项目间成果复用率低，重复设计与论证现象普遍
- 缺乏统一的技术状态基线，交付审计困难
- 现有 Jira/禅道 无法管理非代码类大文件

### 1.3 建设目标

1. **全生命周期追溯**：论证 → 设计 → 实施 → 试验，任意节点可双向追溯
2. **跨项目复用**：打破项目边界，A 项目成果可直接被 B 项目引用
3. **受控技术状态**：关键节点形成不可篡改的基线快照
4. **全开源私有化**：所有组件基于开源协议，部署于企业内网

---

## 二、系统架构

### 2.1 整体架构图

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
│  Portal 前端   │   │   Keycloak    │   │  搜索服务      │
│  (统一门户)    │   │  (SSO 认证)   │   │  (Meilisearch) │
│   :3000       │   │    :8080      │   │    :7700      │
└───────┬───────┘   └───────┬───────┘   └───────────────┘
        │                   │
        │    ┌──────────────┼──────────────┐
        │    │              │              │
        ▼    ▼              ▼              ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  DokuWiki     │   │    Gitea      │   │    Plane      │
│  知识库核心   │   │   代码托管     │   │   任务看板    │
│   :8081      │   │    :3000      │   │    :3001      │
└───────┬───────┘   └───────┬───────┘   └───────────────┘
        │                   │
        │    ┌──────────────┴──────────────┐
        │    │                             │
        ▼    ▼                             ▼
┌───────────────┐                  ┌───────────────┐
│   Nextcloud   │                  │    MinIO      │
│  试验数据网盘  │                  │  对象存储      │
│    :8082     │                  │   :9000/9001  │
└───────┬───────┘                  └───────────────┘
        │
        └──────────────► MinIO (共享存储后端)

┌─────────────────────────────────────────────────────────────────┐
│                        数据持久层                                │
│  PostgreSQL (Keycloak/Plane) │ SQLite (DokuWiki) │ Git (Gitea) │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 组件清单

| 组件        | 端口      | 用途              | 数据存储          |
| ----------- | --------- | ----------------- | ----------------- |
| Nginx       | 80/443    | 反向代理、SSL终止 | -                 |
| Portal      | 3000      | 统一门户前端      | -                 |
| Keycloak    | 8080      | SSO认证中心       | PostgreSQL        |
| DokuWiki    | 8081      | 知识库核心        | 文件系统          |
| Gitea       | 3000(内)  | 代码托管          | SQLite/PostgreSQL |
| Plane       | 3001      | 任务看板          | PostgreSQL        |
| Nextcloud   | 8082      | 试验数据网盘      | MySQL/PostgreSQL  |
| MinIO       | 9000/9001 | 对象存储          | 文件系统          |
| Meilisearch | 7700      | 全局搜索引擎      | 文件系统          |

### 2.3 服务依赖关系

```
Keycloak ◄─── 所有服务 (OIDC 认证)
MinIO   ◄─── DokuWiki (大文件)
            ◄─── Gitea LFS (大文件)
            ◄─── Nextcloud (后端存储)
Meilisearch ◄─── Portal (搜索聚合)
```

---

## 三、认证与权限设计

### 3.1 认证流程

```
用户访问 → Nginx → 检查 Session → 无效/过期 → 重定向到 Keycloak
                                        ↓
                               Keycloak 登录页面
                                        ↓
                               验证用户名/密码
                                        ↓
                               生成 OIDC Token
                                        ↓
                               返回 Portal + 设置 Session
                                        ↓
                               访问各子系统 (携带 Token)
```

### 3.2 Keycloak 配置

```
Realm: knowledge-platform
├── Clients
│   ├── portal          (统一门户)
│   ├── dokuwiki        (知识库)
│   ├── gitea           (代码托管)
│   ├── plane           (任务看板)
│   └── nextcloud       (网盘)
│
├── Roles
│   ├── admin           (系统管理员)
│   ├── project-manager (项目经理)
│   ├── engineer        (工程师)
│   └── viewer          (只读用户)
│
└── Groups
    ├── 论证组
    ├── 设计组
    ├── 试验组
    └── 管理组
```

### 3.3 权限模型

| 角色            | DokuWiki  | Gitea  | Plane    | Nextcloud | MinIO    |
| --------------- | --------- | ------ | -------- | --------- | -------- |
| admin           | 全部权限  | 管理员 | 管理员   | 全部权限  | 全部权限 |
| project-manager | 编辑+审批 | 写入   | 项目管理 | 上传+下载 | 读写     |
| engineer        | 编辑      | 写入   | 编辑任务 | 上传+下载 | 读取     |
| viewer          | 只读      | 只读   | 查看任务 | 下载      | 读取     |

### 3.4 Token 流转机制

```typescript
// Portal 从 Keycloak 获取 Token 后存储
Session {
  access_token: string    // JWT，用于调用各系统 API
  refresh_token: string   // 刷新令牌
  expires_at: timestamp   // 过期时间
  user_info: {
    sub: string          // 用户唯一标识
    name: string
    email: string
    roles: string[]
    groups: string[]
  }
}
```

---

## 四、统一门户设计

### 4.1 门户功能模块

```
门户首页 (/)
├── 知识库 → DokuWiki
├── 代码 → Gitea
├── 任务 → Plane
├── 试验数据 → Nextcloud
├── 文件存储 → MinIO Console (管理员)
│
├── 搜索
│   ├── 全局搜索 (跨系统)
│   ├── 高级搜索 (按类型/项目/时间筛选)
│   └── 搜索结果页
│
└── 用户中心
    ├── 个人信息
    ├── 我的任务
    ├── 我的收藏
    ├── 登出
    └── 管理后台 (admin角色可见)
```

### 4.2 全局搜索架构

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   DokuWiki    │     │    Gitea      │     │    Plane      │
│  (页面/附件)   │     │  (仓库/代码)   │     │  (任务/项目)   │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        │  Webhook/API        │  Webhook/API        │  Webhook/API
        ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    同步索引服务                              │
│              (定时/增量 同步各系统数据)                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Meilisearch                              │
│                  (全文搜索引擎)                              │
│                                                             │
│  Indexes:                                                   │
│  ├── wiki_pages     (标题、内容、标签、项目)                 │
│  ├── gitea_repos    (仓库名、README、代码片段)               │
│  ├── gitea_issues   (Issue标题、描述)                       │
│  ├── plane_tasks    (任务标题、描述、状态)                   │
│  └── minio_files    (文件名、元数据)                         │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Portal 前端                             │
│                   (搜索结果聚合展示)                          │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 搜索索引数据结构

```typescript
// 统一搜索文档结构
interface SearchDocument {
  id: string; // 全局唯一ID: "wiki:project-a:design-spec"
  type: "wiki" | "code" | "task" | "file";
  source: string; // 来源系统: 'dokuwiki' | 'gitea' | 'plane' | 'minio'
  project: string; // 所属项目
  title: string; // 标题
  content: string; // 内容摘要
  tags: string[]; // 标签
  status: "draft" | "controlled"; // 状态
  author: string; // 创建者
  created_at: timestamp;
  updated_at: timestamp;
  url: string; // 跳转链接
  _formatted: {
    // 高亮结果
    title: string;
    content: string;
  };
}
```

---

## 五、知识库核心设计

### 5.1 DokuWiki 命名空间结构

```
wiki: (根命名空间)
├── projects:                    (项目空间)
│   ├── project-a:              (项目A)
│   │   ├── 01-论证:            (论证阶段)
│   │   │   ├── 需求条目
│   │   │   ├── 可行性分析
│   │   │   └── 技术指标
│   │   ├── 02-设计:            (设计阶段)
│   │   │   ├── 系统设计
│   │   │   └── 详细设计
│   │   ├── 03-实施:            (实施阶段)
│   │   │   └── 实施记录
│   │   └── 04-试验:            (试验阶段)
│   │       ├── 试验方案
│   │       └── 试验报告
│   │
│   └── project-b:              (项目B)
│       └── ...
│
├── shared:                      (共享资产)
│   ├── components:             (通用组件库)
│   ├── templates:              (文档模板)
│   └── standards:              (标准规范)
│
└── baselines:                   (基线快照)
    ├── project-a-v1.0-20250101
    └── project-a-v2.0-20250601
```

### 5.2 双向链接实现

```wiki
==== 在 DokuWiki 中创建双向链接 ====

// 引用其他页面 (Wiki 语法)
[[projects:project-a:01-论证:需求条目|需求条目]]

// 引用图纸文件 (存储于 MinIO)
{{minio://drawings/step/project-a-design-v2.step|设计图纸}}

// 引用试验视频
{{minio://videos/project-a-test-001.mp4|试验视频}}

// @ 提及用户
@张三 请审核此文档

// 标签标记
{{tag>项目A 论证 需求}}
```

### 5.3 审批与状态流转

```
┌─────────────┐     提交审批      ┌─────────────┐
│   草稿      │ ────────────────► │   待审批    │
│  [草稿]     │                   │  [待审批]   │
└─────────────┘                   └──────┬──────┘
      ▲                                  │
      │ 审批拒绝                          │ 审批通过
      │                                  ▼
┌─────┴───────┐                   ┌─────────────┐
│   修改      │                   │   受控      │
│  [草稿]     │                   │  [受控]     │
└─────────────┘                   └──────┬──────┘
                                        │
                                        │ 变更申请
                                        ▼
                                  ┌─────────────┐
                                  │   变更中    │
                                  │  [变更中]   │
                                  └──────┬──────┘
                                         │ 变更完成
                                         ▼
                                  ┌─────────────┐
                                  │ 新版本草稿  │
                                  │  [草稿]     │
                                  └─────────────┘
```

### 5.4 基线快照机制

基线创建时：

1. 对所有受控文档创建只读快照
2. 图纸文件在 MinIO 中打版本标签
3. 代码仓库创建 Git Tag
4. 生成基线清单文件 (manifest.json)

---

## 六、MinIO 对象存储设计

### 6.1 存储桶规划

```
MinIO Buckets:
├── knowledge-drawings        (STEP图纸)
├── knowledge-artifacts       (二进制制品)
├── knowledge-videos          (试验视频)
├── knowledge-images          (试验图片)
├── knowledge-reports         (试验报告附件)
├── gitea-lfs                 (Gitea LFS 存储)
├── nextcloud-data            (Nextcloud 后端存储)
└── knowledge-baselines       (基线快照)
```

### 6.2 文件上传流程

```
用户选择文件 (最大 4GB+)
        │
        ▼
Portal 前端 (生成分片、计算上传ID)
        │
        │ 初始化分片上传
        ▼
MinIO 服务端 (返回 uploadId)
        │
        │ 并行上传分片 (每片 5-100MB)
        ▼
断点续传 (记录进度到本地存储)
        │
        │ 所有分片上传完成
        ▼
合并分片 → 生成最终对象
        │
        │ 记录元数据
        ▼
PostgreSQL (文件元数据表)
```

### 6.3 文件元数据表设计

```sql
CREATE TABLE file_metadata (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket          VARCHAR(100) NOT NULL,
    object_key      VARCHAR(500) NOT NULL,
    version_id      VARCHAR(100),
    original_name   VARCHAR(255) NOT NULL,
    file_size       BIGINT NOT NULL,
    mime_type       VARCHAR(100),
    md5_hash        VARCHAR(32),
    project         VARCHAR(100),
    category        VARCHAR(50),
    status          VARCHAR(20) DEFAULT 'draft',
    title           VARCHAR(255),
    description     TEXT,
    tags            JSONB DEFAULT '[]',
    drawing_version VARCHAR(20),
    designer        VARCHAR(100),
    created_by      VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(bucket, object_key, version_id)
);

CREATE TABLE file_references (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id         UUID REFERENCES file_metadata(id),
    ref_type        VARCHAR(20) NOT NULL,
    ref_id          VARCHAR(100) NOT NULL,
    ref_version     VARCHAR(50),
    created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 七、代码托管设计

### 7.1 Gitea 组织结构（按阶段分组）

```
Gitea Organizations:
├── 01-argument                 (论证阶段)
│   ├── project-a-requirement   (项目A-需求分析)
│   ├── project-a-feasibility   (项目A-可行性)
│   └── templates-argument      (论证模板库)
│
├── 02-design                   (设计阶段)
│   ├── project-a-system        (项目A-系统设计)
│   ├── project-a-detail        (项目A-详细设计)
│   └── components-shared       (共享组件库)
│
├── 03-implementation           (实施阶段)
│   ├── project-a-main          (项目A-主代码)
│   ├── project-a-utils         (项目A-工具库)
│   └── libs-common             (通用库)
│
├── 04-test                     (试验阶段)
│   ├── project-a-test-scripts  (项目A-测试脚本)
│   ├── project-a-test-data     (项目A-测试数据)
│   └── test-framework          (测试框架)
│
└── shared                      (跨阶段共享)
    ├── configs                 (配置文件)
    ├── ci-cd                   (CI/CD 脚本)
    └── docs                    (文档模板)
```

### 7.2 组织权限配置

| 角色     | 01-论证 | 02-设计 | 03-实施 | 04-试验 |
| -------- | ------- | ------- | ------- | ------- |
| 论证组   | 读写    | 读取    | 读取    | 读取    |
| 设计组   | 读取    | 读写    | 读取    | 读取    |
| 实施组   | 读取    | 读取    | 读写    | 读取    |
| 试验组   | 读取    | 读取    | 读取    | 读写    |
| 项目经理 | 读写    | 读写    | 读写    | 读写    |
| admin    | 管理员  | 管理员  | 管理员  | 管理员  |

### 7.3 Gitea LFS 配置

```yaml
[server]
LFS_START_SERVER = true

[lfs]
STORAGE_TYPE = minio
MINIO_ENDPOINT = minio:9000
MINIO_ACCESS_KEY_ID = ${MINIO_ACCESS_KEY}
MINIO_SECRET_ACCESS_KEY = ${MINIO_SECRET_KEY}
MINIO_BUCKET = gitea-lfs
```

---

## 八、任务管理设计

### 8.1 任务状态流转

```
    ┌─────────┐     开始      ┌─────────┐
    │  待办   │ ────────────► │ 进行中  │
    │ (Backlog)│              │(In Progress)
    └─────────┘               └────┬────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
        ┌─────────┐          ┌─────────┐          ┌─────────┐
        │  暂停   │          │  审核中  │          │  阻塞   │
        │(Paused) │          │(Review) │          │(Blocked)│
        └────┬────┘          └────┬────┘          └────┬────┘
              │                    │                    │
              │                    ▼                    │
              │              ┌─────────┐               │
              └─────────────►│  完成   │◄──────────────┘
                             │(Done)   │
                             └────┬────┘
                                  │
                                  ▼
                             ┌─────────┐
                             │  关闭   │
                             │(Closed) │
                             └─────────┘
```

### 8.2 任务与资产关联

任务可关联以下资产类型：

- **Wiki 页面**：通过页面 ID 引用
- **MinIO 文件**：通过文件 ID 引用
- **Gitea 代码**：通过 commit/PR/issue 引用

关联展示在任务详情页和对应资产页面。

### 8.3 与 Gitea 集成

```yaml
integrations:
  gitea:
    url: http://gitea:3000
    auto_link:
      commit_pattern: "TASK-\\d+"
      pr_pattern: "TASK-\\d+"
      issue_pattern: "TASK-\\d+"
```

---

## 九、试验数据管理设计

### 9.1 Nextcloud 目录结构

```
Nextcloud 文件根目录:
├── projects/                    (按项目组织)
│   ├── Project-A/
│   │   ├── 01-试验方案/
│   │   ├── 02-试验过程/
│   │   │   ├── 2025-01-15-测试001/
│   │   │   │   ├── 视频/
│   │   │   │   ├── 图片/
│   │   │   │   └── 数据/
│   │   │   └── 2025-01-20-测试002/
│   │   ├── 03-试验报告/
│   │   └── 04-归档/
│   └── Project-B/
├── shared/                      (共享试验资源)
└── archive/                     (历史归档)
```

### 9.2 与 MinIO 集成

Nextcloud 使用 MinIO 作为外部存储后端：

- 存储类型: Amazon S3
- 端点: http://minio:9000
- Bucket: nextcloud-data
- 启用分片上传、版本控制

### 9.3 试验与论证关联

**从论证条目查看验证情况：**

- 显示关联的试验报告列表
- 显示验证结论摘要
- 显示关联的试验数据文件

**从试验报告查看论证依据：**

- 显示验证的论证条目链接
- 显示测试结论与论证要求的对应关系

---

## 十、部署架构设计

### 10.1 Docker Compose 服务定义

```yaml
# docker-compose.yml
version: "3.8"

services:
  # 反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - portal
      - keycloak
      - dokuwiki
      - gitea
      - plane
      - nextcloud
    networks:
      - knowledge-network

  # 数据库
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: knowledge
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - knowledge-network

  # 对象存储
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio-data:/data
    networks:
      - knowledge-network

  # 搜索引擎
  meilisearch:
    image: getmeili/meilisearch:latest
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
    volumes:
      - meili-data:/meili_data
    networks:
      - knowledge-network

  # 认证中心
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: ${POSTGRES_USER}
      KC_DB_PASSWORD: ${POSTGRES_PASSWORD}
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
    command: start-dev
    volumes:
      - keycloak-data:/opt/keycloak/data
    networks:
      - knowledge-network

  # 统一门户
  portal:
    build: ./portal
    environment:
      KEYCLOAK_URL: http://keycloak:8080
      MEILISEARCH_URL: http://meilisearch:7700
      MEILISEARCH_KEY: ${MEILI_MASTER_KEY}
    networks:
      - knowledge-network

  # 知识库
  dokuwiki:
    image: bitnami/dokuwiki:latest
    environment:
      DOKUWIKI_USERNAME: admin
      DOKUWIKI_PASSWORD: ${DOKUWIKI_PASSWORD}
      DOKUWIKI_EMAIL: admin@company.local
    volumes:
      - dokuwiki-data:/bitnami/dokuwiki
    networks:
      - knowledge-network

  # 代码托管
  gitea:
    image: gitea/gitea:latest
    environment:
      GITEA__database__DB_TYPE: postgres
      GITEA__database__HOST: postgres:5432
      GITEA__database__NAME: gitea
      GITEA__database__USER: ${POSTGRES_USER}
      GITEA__database__PASSWD: ${POSTGRES_PASSWORD}
    volumes:
      - gitea-data:/var/lib/gitea
      - gitea-repos:/data/git
    networks:
      - knowledge-network

  # 任务看板
  plane:
    image: makeplane/plane:latest
    environment:
      WEB_URL: https://knowledge.company.local
      DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/plane
    volumes:
      - plane-data:/app/data
    networks:
      - knowledge-network

  # 试验数据网盘
  nextcloud:
    image: nextcloud:latest
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_DB: nextcloud
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - nextcloud-data:/var/www/html
    networks:
      - knowledge-network

networks:
  knowledge-network:
    driver: bridge

volumes:
  postgres-data:
  minio-data:
  meili-data:
  keycloak-data:
  dokuwiki-data:
  gitea-data:
  gitea-repos:
  plane-data:
  nextcloud-data:
```

### 10.2 服务器资源需求

**单机部署最低配置：**

- CPU: 8 核
- 内存: 32 GB
- 存储: 500 GB SSD (系统) + 4 TB+ (数据盘)
- 网络: 千兆内网

**服务资源分配：**

| 服务        | CPU  | 内存   | 存储   |
| ----------- | ---- | ------ | ------ |
| Nginx       | 1 核 | 512 MB | -      |
| PostgreSQL  | 2 核 | 4 GB   | 100 GB |
| Keycloak    | 2 核 | 2 GB   | -      |
| DokuWiki    | 1 核 | 1 GB   | 50 GB  |
| Gitea       | 2 核 | 2 GB   | 100 GB |
| Plane       | 2 核 | 2 GB   | -      |
| Nextcloud   | 2 核 | 2 GB   | -      |
| MinIO       | 2 核 | 4 GB   | 2 TB+  |
| Meilisearch | 1 核 | 2 GB   | 50 GB  |
| Portal      | 1 核 | 1 GB   | -      |

### 10.3 备份策略

| 数据类型   | 备份频率 | 保留周期 | 备份方式        |
| ---------- | -------- | -------- | --------------- |
| PostgreSQL | 每日增量 | 30 天    | pg_dump + wal-g |
| MinIO 数据 | 每日增量 | 90 天    | MinIO Mirror    |
| DokuWiki   | 每日全量 | 30 天    | rsync           |
| Gitea 仓库 | 每日全量 | 30 天    | git bundle      |
| 基线快照   | 永久保留 | -        | 只读归档        |

---

## 十一、实施路线图

### 11.1 分阶段实施计划

| 阶段    | 时间    | 内容         | 交付物                 |
| ------- | ------- | ------------ | ---------------------- |
| Phase 1 | 第1-2周 | 基础设施搭建 | 基础认证平台可用       |
| Phase 2 | 第3-4周 | 知识库核心   | 知识库功能可用         |
| Phase 3 | 第5-6周 | 代码与任务   | 代码托管与任务管理可用 |
| Phase 4 | 第7周   | 试验数据     | 试验数据管理可用       |
| Phase 5 | 第8-9周 | 统一门户     | 统一入口上线           |
| Phase 6 | 第10周  | 集成与优化   | 系统正式上线           |

### 11.2 各阶段验收标准

**Phase 1 验收标准:**

- [ ] Keycloak 可正常登录
- [ ] PostgreSQL 各数据库已创建
- [ ] MinIO 可上传/下载文件
- [ ] Nginx 反向代理正常工作
- [ ] HTTPS 证书配置完成

**Phase 2 验收标准:**

- [ ] DokuWiki 可创建/编辑页面
- [ ] 双向链接功能正常
- [ ] 大文件可上传到 MinIO 并在 Wiki 中引用
- [ ] 审批工作流可正常提交/审批
- [ ] 基线快照功能可用

**Phase 3 验收标准:**

- [ ] Gitea 可创建仓库并推送代码
- [ ] LFS 可正常上传大文件
- [ ] 按阶段的组织结构已创建
- [ ] Plane 可创建/分配任务
- [ ] 任务与代码提交可关联

**Phase 4 验收标准:**

- [ ] Nextcloud 可正常访问
- [ ] WebDAV 可映射为本地磁盘
- [ ] 大文件上传支持断点续传
- [ ] 试验报告可关联论证条目

**Phase 5 验收标准:**

- [ ] Portal 统一入口可访问
- [ ] 单点登录各系统正常
- [ ] 全局搜索返回各系统结果
- [ ] 各系统导航链接正常

### 11.3 风险与应对

| 风险         | 影响           | 应对措施           |
| ------------ | -------------- | ------------------ |
| 组件版本兼容 | 集成失败       | 测试环境先行验证   |
| 网络带宽不足 | 大文件传输慢   | 启用压缩、分片上传 |
| 存储空间不足 | 无法上传新文件 | 监控告警、定期清理 |
| 单点故障     | 服务不可用     | 关键服务冗余部署   |
| 用户接受度低 | 系统闲置       | 培训、用户手册     |

### 11.4 后续扩展方向

**短期 (3-6个月):**

- 移动端适配
- 消息通知 (邮件/企业微信)
- 批量导入导出
- 操作日志审计

**中期 (6-12个月):**

- AI 智能搜索 (语义检索)
- 知识图谱可视化
- 自动生成试验报告
- 与 PLM 系统集成

**长期 (1年+):**

- 多站点部署 (异地容灾)
- 高可用架构升级
- 大数据分析平台
- AI 辅助决策

---

## 附录

### A. 技术选型依据

| 组件        | 选型理由                                                         |
| ----------- | ---------------------------------------------------------------- |
| DokuWiki    | 平文件存储，无需数据库；原生支持命名空间与标签；支持双向链接插件 |
| MinIO       | 开源 S3 兼容对象存储，单文件 4GB+ 无压力，支持断点续传           |
| Gitea       | 轻量 Git 服务，资源占用低，内置 Issue 跟踪与 Wiki                |
| Plane       | 现代化项目管理工具，UI 接近 Linear，支持与 Gitea 集成            |
| Nextcloud   | 原生支持 WebDAV，视频/图片上传体验好                             |
| Keycloak    | 成熟的开源 SSO 方案，所有组件均支持 OIDC                         |
| Meilisearch | 轻量级全文搜索引擎，支持中文，易于集成                           |

### B. 参考文档

- DokuWiki 官方文档: https://www.dokuwiki.org/
- MinIO 官方文档: https://min.io/docs/
- Gitea 官方文档: https://docs.gitea.io/
- Plane 官方文档: https://docs.plane.so/
- Keycloak 官方文档: https://www.keycloak.org/documentation
- Nextcloud 官方文档: https://docs.nextcloud.com/
