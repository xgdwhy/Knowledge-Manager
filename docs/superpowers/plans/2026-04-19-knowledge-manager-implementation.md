# 知识管理系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建企业级知识管理系统，实现全生命周期追溯、跨项目复用、受控技术状态管理

**Architecture:** 基于 Docker Compose 的微服务架构，使用 Keycloak SSO 统一认证，MinIO 统一对象存储，Meilisearch 全局搜索，Portal 作为统一入口

**Tech Stack:** Docker Compose, Nginx, PostgreSQL, MinIO, Keycloak, DokuWiki, Gitea, Plane, Nextcloud, Meilisearch, React/Vue

---

## 文件结构

```
knowledgeManager/
├── docker-compose.yml           # 主服务编排
├── .env.example                 # 环境变量模板
├── nginx/
│   ├── nginx.conf               # Nginx 主配置
│   └── ssl/                     # SSL 证书目录
├── postgres/
│   └── init/
│       └── 01-init-databases.sql  # 数据库初始化
├── portal/                      # 统一门户前端
│   ├── package.json
│   ├── src/
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── services/
│   │   └── hooks/
│   ├── Dockerfile
│   └── nginx.conf
├── scripts/
│   ├── setup-keycloak.sh        # Keycloak 初始化
│   ├── setup-minio.sh           # MinIO bucket 创建
│   └── backup.sh                # 备份脚本
└── docs/
    └── superpowers/
        ├── specs/               # 设计文档
        └── plans/               # 实施计划
```

---

## Phase 1: 基础设施搭建

### Task 1.1: 项目结构初始化

**Files:**

- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: 创建项目目录结构**

```bash
mkdir -p nginx/ssl postgres/init portal/src/{components,services,hooks} scripts
```

- [ ] **Step 2: 创建 .env.example 环境变量模板**

```env
# PostgreSQL
POSTGRES_USER=knowledge
POSTGRES_PASSWORD=change_me_in_production

# Keycloak
KEYCLOAK_ADMIN_PASSWORD=change_me_in_production

# MinIO
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=change_me_in_production

# Meilisearch
MEILI_MASTER_KEY=change_me_in_production

# DokuWiki
DOKUWIKI_PASSWORD=change_me_in_production

# Domain
DOMAIN=knowledge.company.local
```

- [ ] **Step 3: 创建 .gitignore**

```gitignore
.env
nginx/ssl/*.key
nginx/ssl/*.pem
*.log
node_modules/
dist/
```

- [ ] **Step 4: 创建 docker-compose.yml 基础结构**

```yaml
version: "3.8"

services:
  # 基础设施服务将在后续任务中添加

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

- [ ] **Step 5: 提交初始化**

```bash
git init
git add .
git commit -m "feat: initialize project structure"
```

---

### Task 1.2: PostgreSQL 数据库服务

**Files:**

- Modify: `docker-compose.yml`
- Create: `postgres/init/01-init-databases.sql`

- [ ] **Step 1: 添加 PostgreSQL 服务到 docker-compose.yml**

```yaml
# 数据库
postgres:
  image: postgres:15-alpine
  container_name: knowledge-postgres
  environment:
    POSTGRES_DB: knowledge
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  volumes:
    - postgres-data:/var/lib/postgresql/data
    - ./postgres/init:/docker-entrypoint-initdb.d:ro
  networks:
    - knowledge-network
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
    interval: 10s
    timeout: 5s
    retries: 5
  restart: unless-stopped
```

- [ ] **Step 2: 创建数据库初始化脚本**

```sql
-- postgres/init/01-init-databases.sql

-- 为各服务创建独立数据库
CREATE DATABASE keycloak;
CREATE DATABASE gitea;
CREATE DATABASE plane;
CREATE DATABASE nextcloud;

-- 创建知识库元数据数据库
CREATE DATABASE knowledge_meta;

\c knowledge_meta;

-- 文件元数据表
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

-- 引用关系表
CREATE TABLE file_references (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id         UUID REFERENCES file_metadata(id) ON DELETE CASCADE,
    ref_type        VARCHAR(20) NOT NULL,
    ref_id          VARCHAR(100) NOT NULL,
    ref_version     VARCHAR(50),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- 基线清单表
CREATE TABLE baselines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL UNIQUE,
    project         VARCHAR(100) NOT NULL,
    description     TEXT,
    created_by      VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    status          VARCHAR(20) DEFAULT 'active',
    manifest        JSONB NOT NULL DEFAULT '{}'
);

-- 索引
CREATE INDEX idx_file_project ON file_metadata(project);
CREATE INDEX idx_file_status ON file_metadata(status);
CREATE INDEX idx_file_tags ON file_metadata USING GIN(tags);
CREATE INDEX idx_refs_file ON file_references(file_id);
CREATE INDEX idx_refs_ref ON file_references(ref_type, ref_id);
```

- [ ] **Step 3: 提交数据库配置**

```bash
git add docker-compose.yml postgres/
git commit -m "feat: add PostgreSQL database service"
```

---

### Task 1.3: MinIO 对象存储服务

**Files:**

- Modify: `docker-compose.yml`
- Create: `scripts/setup-minio.sh`

- [ ] **Step 1: 添加 MinIO 服务到 docker-compose.yml**

```yaml
# 对象存储
minio:
  image: minio/minio:latest
  container_name: knowledge-minio
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
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
    interval: 30s
    timeout: 20s
    retries: 3
  restart: unless-stopped
```

- [ ] **Step 2: 创建 MinIO 初始化脚本**

```bash
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
```

- [ ] **Step 3: 提交 MinIO 配置**

```bash
chmod +x scripts/setup-minio.sh
git add docker-compose.yml scripts/
git commit -m "feat: add MinIO object storage service"
```

---

### Task 1.4: Meilisearch 搜索服务

**Files:**

- Modify: `docker-compose.yml`

- [ ] **Step 1: 添加 Meilisearch 服务到 docker-compose.yml**

```yaml
# 搜索引擎
meilisearch:
  image: getmeili/meilisearch:latest
  container_name: knowledge-meilisearch
  environment:
    MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
    MEILI_ENV: production
  volumes:
    - meili-data:/meili_data
  networks:
    - knowledge-network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:7700/health"]
    interval: 30s
    timeout: 5s
    retries: 3
  restart: unless-stopped
```

- [ ] **Step 2: 提交搜索服务配置**

```bash
git add docker-compose.yml
git commit -m "feat: add Meilisearch search service"
```

---

### Task 1.5: Keycloak SSO 认证服务

**Files:**

- Modify: `docker-compose.yml`
- Create: `scripts/setup-keycloak.sh`

- [ ] **Step 1: 添加 Keycloak 服务到 docker-compose.yml**

```yaml
# 认证中心
keycloak:
  image: quay.io/keycloak/keycloak:latest
  container_name: knowledge-keycloak
  environment:
    KC_DB: postgres
    KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
    KC_DB_USERNAME: ${POSTGRES_USER}
    KC_DB_PASSWORD: ${POSTGRES_PASSWORD}
    KEYCLOAK_ADMIN: admin
    KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
    KC_HOSTNAME: ${DOMAIN}
    KC_HOSTNAME_STRICT: "false"
    KC_HOSTNAME_STRICT_HTTPS: "false"
    KC_HTTP_ENABLED: "true"
  command: start-dev
  depends_on:
    postgres:
      condition: service_healthy
  networks:
    - knowledge-network
  restart: unless-stopped
```

- [ ] **Step 2: 创建 Keycloak 初始化脚本**

```bash
#!/bin/bash
# scripts/setup-keycloak.sh

KEYCLOAK_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD}"

# 等待 Keycloak 启动
echo "Waiting for Keycloak to start..."
sleep 30

# 获取 access token
TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -d "username=${ADMIN_USER}" \
  -d "password=${ADMIN_PASS}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

# 创建 Realm
curl -s -X POST "${KEYCLOAK_URL}/admin/realms" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "knowledge-platform",
    "enabled": true
  }'

# 创建 Clients
for client in portal dokuwiki gitea plane nextcloud; do
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/knowledge-platform/clients" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"clientId\": \"${client}\",
      \"enabled\": true,
      \"publicClient\": false,
      \"protocol\": \"openid-connect\",
      \"redirectUris\": [\"https://${DOMAIN}/*\"],
      \"webOrigins\": [\"https://${DOMAIN}\"]
    }"
done

# 创建 Roles
for role in admin project-manager engineer viewer; do
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/knowledge-platform/roles" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"${role}\"}"
done

echo "Keycloak initialized successfully"
```

- [ ] **Step 3: 提交 Keycloak 配置**

```bash
chmod +x scripts/setup-keycloak.sh
git add docker-compose.yml scripts/
git commit -m "feat: add Keycloak SSO authentication service"
```

---

### Task 1.6: Nginx 反向代理

**Files:**

- Modify: `docker-compose.yml`
- Create: `nginx/nginx.conf`

- [ ] **Step 1: 添加 Nginx 服务到 docker-compose.yml**

```yaml
# 反向代理
nginx:
  image: nginx:alpine
  container_name: knowledge-nginx
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
    - minio
  networks:
    - knowledge-network
  restart: unless-stopped
```

- [ ] **Step 2: 创建 Nginx 配置文件**

```nginx
# nginx/nginx.conf

worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml;

    # 上传限制
    client_max_body_size 4G;

    # 上游服务定义
    upstream portal { server portal:3000; }
    upstream keycloak { server keycloak:8080; }
    upstream dokuwiki { server dokuwiki:8080; }
    upstream gitea { server gitea:3000; }
    upstream plane { server plane:3000; }
    upstream nextcloud { server nextcloud:80; }
    upstream minio { server minio:9000; }
    upstream minio-console { server minio:9001; }

    # HTTP 重定向到 HTTPS
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS 主服务
    server {
        listen 443 ssl http2;
        server_name _;

        # SSL 配置 (生产环境替换为正式证书)
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # 统一门户 (根路径)
        location / {
            proxy_pass http://portal;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Keycloak SSO
        location /auth/ {
            proxy_pass http://keycloak/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 知识库
        location /wiki/ {
            proxy_pass http://dokuwiki/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 代码托管
        location /code/ {
            proxy_pass http://gitea/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 任务看板
        location /tasks/ {
            proxy_pass http://plane/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 试验数据
        location /data/ {
            proxy_pass http://nextcloud/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }

        # MinIO API (大文件)
        location /storage/ {
            proxy_pass http://minio/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 300;
            proxy_send_timeout 300;
            proxy_read_timeout 300;
        }

        # MinIO 控制台
        location /storage-admin/ {
            proxy_pass http://minio-console/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

- [ ] **Step 3: 创建自签名 SSL 证书 (开发用)**

```bash
# 创建 SSL 目录
mkdir -p nginx/ssl

# 生成自签名证书 (生产环境替换为正式证书)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=Company/CN=knowledge.company.local"
```

- [ ] **Step 4: 提交 Nginx 配置**

```bash
git add docker-compose.yml nginx/
git commit -m "feat: add Nginx reverse proxy with SSL"
```

---

## Phase 2: 应用服务部署

### Task 2.1: DokuWiki 知识库服务

**Files:**

- Modify: `docker-compose.yml`

- [ ] **Step 1: 添加 DokuWiki 服务到 docker-compose.yml**

```yaml
# 知识库
dokuwiki:
  image: bitnami/dokuwiki:latest
  container_name: knowledge-dokuwiki
  environment:
    DOKUWIKI_USERNAME: admin
    DOKUWIKI_PASSWORD: ${DOKUWIKI_PASSWORD}
    DOKUWIKI_EMAIL: admin@company.local
    DOKUWIKI_WIKI_NAME: Knowledge Platform
  volumes:
    - dokuwiki-data:/bitnami/dokuwiki
  networks:
    - knowledge-network
  restart: unless-stopped
```

- [ ] **Step 2: 提交 DokuWiki 配置**

```bash
git add docker-compose.yml
git commit -m "feat: add DokuWiki knowledge base service"
```

---

### Task 2.2: Gitea 代码托管服务

**Files:**

- Modify: `docker-compose.yml`

- [ ] **Step 1: 添加 Gitea 服务到 docker-compose.yml**

```yaml
# 代码托管
gitea:
  image: gitea/gitea:latest
  container_name: knowledge-gitea
  environment:
    GITEA__database__DB_TYPE: postgres
    GITEA__database__HOST: postgres:5432
    GITEA__database__NAME: gitea
    GITEA__database__USER: ${POSTGRES_USER}
    GITEA__database__PASSWD: ${POSTGRES_PASSWORD}
    GITEA__server__ROOT_URL: https://${DOMAIN}/code/
    GITEA__server__SSH_DOMAIN: ${DOMAIN}
    GITEA__server__SSH_PORT: 2222
    GITEA__openid__ENABLE_OPENID_SIGNIN: "true"
    GITEA__openid__ENABLE_OPENID_SIGNUP: "false"
    GITEA__lfs__START_SERVER: "true"
    GITEA__lfs__STORAGE_TYPE: minio
    GITEA__lfs__MINIO_ENDPOINT: minio:9000
    GITEA__lfs__MINIO_ACCESS_KEY_ID: ${MINIO_ROOT_USER}
    GITEA__lfs__MINIO_SECRET_ACCESS_KEY: ${MINIO_ROOT_PASSWORD}
    GITEA__lfs__MINIO_BUCKET: gitea-lfs
    GITEA__lfs__MINIO_USE_SSL: "false"
  ports:
    - "2222:22"
  volumes:
    - gitea-data:/var/lib/gitea
    - gitea-repos:/data/git
  depends_on:
    postgres:
      condition: service_healthy
  networks:
    - knowledge-network
  restart: unless-stopped
```

- [ ] **Step 2: 提交 Gitea 配置**

```bash
git add docker-compose.yml
git commit -m "feat: add Gitea code hosting service with LFS"
```

---

### Task 2.3: Plane 任务看板服务

**Files:**

- Modify: `docker-compose.yml`

- [ ] **Step 1: 添加 Plane 服务到 docker-compose.yml**

```yaml
# 任务看板
plane:
  image: makeplane/plane:latest
  container_name: knowledge-plane
  environment:
    WEB_URL: https://${DOMAIN}/tasks/
    CORS_ALLOWED_ORIGINS: "https://${DOMAIN}"
    DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/plane
    REDIS_URL: redis://plane-redis:6379/
    SECRET_KEY: ${MEILI_MASTER_KEY}
  volumes:
    - plane-data:/app/data
  depends_on:
    postgres:
      condition: service_healthy
  networks:
    - knowledge-network
  restart: unless-stopped

# Plane Redis
plane-redis:
  image: redis:alpine
  container_name: knowledge-plane-redis
  networks:
    - knowledge-network
  restart: unless-stopped
```

- [ ] **Step 2: 提交 Plane 配置**

```bash
git add docker-compose.yml
git commit -m "feat: add Plane task board service"
```

---

### Task 2.4: Nextcloud 试验数据服务

**Files:**

- Modify: `docker-compose.yml`

- [ ] **Step 1: 添加 Nextcloud 服务到 docker-compose.yml**

```yaml
# 试验数据网盘
nextcloud:
  image: nextcloud:latest
  container_name: knowledge-nextcloud
  environment:
    POSTGRES_HOST: postgres
    POSTGRES_DB: nextcloud
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    NEXTCLOUD_TRUSTED_DOMAINS: ${DOMAIN}
    OBJECTSTORE_S3_HOST: minio
    OBJECTSTORE_S3_PORT: 9000
    OBJECTSTORE_S3_BUCKET: nextcloud-data
    OBJECTSTORE_S3_KEY: ${MINIO_ROOT_USER}
    OBJECTSTORE_S3_SECRET: ${MINIO_ROOT_PASSWORD}
    OBJECTSTORE_S3_USE_SSL: "false"
  volumes:
    - nextcloud-data:/var/www/html
  depends_on:
    postgres:
      condition: service_healthy
  networks:
    - knowledge-network
  restart: unless-stopped
```

- [ ] **Step 2: 提交 Nextcloud 配置**

```bash
git add docker-compose.yml
git commit -m "feat: add Nextcloud test data service"
```

---

## Phase 3: Portal 统一门户开发

### Task 3.1: Portal 项目初始化

**Files:**

- Create: `portal/package.json`
- Create: `portal/tsconfig.json`
- Create: `portal/vite.config.ts`
- Create: `portal/index.html`
- Create: `portal/src/index.tsx`
- Create: `portal/src/App.tsx`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "knowledge-portal",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "keycloak-js": "^23.0.0",
    "meilisearch": "^0.36.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: 创建 vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  base: "/",
});
```

- [ ] **Step 5: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>知识管理平台</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: 创建入口文件 src/index.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 7: 创建基础样式 src/index.css**

```css
:root {
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #f5222d;
  --text-color: #333;
  --bg-color: #f5f5f5;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  color: var(--text-color);
  background-color: var(--bg-color);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
```

- [ ] **Step 8: 提交 Portal 初始化**

```bash
git add portal/
git commit -m "feat: initialize Portal frontend project"
```

---

### Task 3.2: Portal 认证服务

**Files:**

- Create: `portal/src/services/auth.ts`
- Create: `portal/src/hooks/useAuth.ts`

- [ ] **Step 1: 创建 Keycloak 认证服务**

```typescript
// portal/src/services/auth.ts
import Keycloak from "keycloak-js";

const keycloakConfig = {
  url: window.location.origin + "/auth",
  realm: "knowledge-platform",
  clientId: "portal",
};

const keycloak = new Keycloak(keycloakConfig);

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  roles: string[];
  groups: string[];
}

export class AuthService {
  private initialized = false;
  private userInfo: UserInfo | null = null;

  async init(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      const authenticated = await keycloak.init({
        onLoad: "check-sso",
        pkceMethod: "S256",
      });

      if (authenticated && keycloak.tokenParsed) {
        this.userInfo = {
          id: keycloak.tokenParsed.sub,
          name:
            keycloak.tokenParsed.name ||
            keycloak.tokenParsed.preferred_username ||
            "",
          email: keycloak.tokenParsed.email || "",
          roles: keycloak.tokenParsed.realm_access?.roles || [],
          groups: keycloak.tokenParsed.groups || [],
        };
      }

      this.initialized = true;
      return authenticated;
    } catch (error) {
      console.error("Failed to initialize Keycloak:", error);
      return false;
    }
  }

  async login(): Promise<void> {
    await keycloak.login();
  }

  async logout(): Promise<void> {
    await keycloak.logout({ redirectUri: window.location.origin });
  }

  getToken(): string | undefined {
    return keycloak.token;
  }

  getUserInfo(): UserInfo | null {
    return this.userInfo;
  }

  isAuthenticated(): boolean {
    return !!keycloak.authenticated;
  }

  hasRole(role: string): boolean {
    return this.userInfo?.roles.includes(role) || false;
  }
}

export const authService = new AuthService();
```

- [ ] **Step 2: 创建认证 Hook**

```typescript
// portal/src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import { authService, UserInfo } from "../services/auth";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserInfo | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    authService.init().then((authenticated) => {
      setState({
        isLoading: false,
        isAuthenticated: authenticated,
        user: authService.getUserInfo(),
      });
    });
  }, []);

  const login = useCallback(() => {
    authService.login();
  }, []);

  const logout = useCallback(() => {
    authService.logout();
  }, []);

  const hasRole = useCallback((role: string) => {
    return authService.hasRole(role);
  }, []);

  return {
    ...state,
    login,
    logout,
    hasRole,
  };
}
```

- [ ] **Step 3: 提交认证服务**

```bash
git add portal/src/services/ portal/src/hooks/
git commit -m "feat: add Portal authentication service with Keycloak"
```

---

### Task 3.3: Portal 搜索服务

**Files:**

- Create: `portal/src/services/search.ts`

- [ ] **Step 1: 创建 Meilisearch 搜索服务**

```typescript
// portal/src/services/search.ts
import { MeiliSearch } from "meilisearch";

export interface SearchDocument {
  id: string;
  type: "wiki" | "code" | "task" | "file";
  source: string;
  project: string;
  title: string;
  content: string;
  tags: string[];
  status: "draft" | "controlled";
  author: string;
  created_at: number;
  updated_at: number;
  url: string;
}

export interface SearchResult {
  hits: SearchDocument[];
  totalHits: number;
  processingTimeMs: number;
  query: string;
}

class SearchService {
  private client: MeiliSearch;

  constructor() {
    this.client = new MeiliSearch({
      host: window.location.origin + "/storage/search",
      apiKey: "", // API key 由后端代理注入
    });
  }

  async search(
    query: string,
    filters?: {
      type?: string[];
      project?: string;
      status?: string;
    },
  ): Promise<SearchResult> {
    const index = this.client.index("knowledge");

    const filterArray: string[] = [];
    if (filters?.type?.length) {
      filterArray.push(`type IN [${filters.type.join(", ")}]`);
    }
    if (filters?.project) {
      filterArray.push(`project = "${filters.project}"`);
    }
    if (filters?.status) {
      filterArray.push(`status = "${filters.status}"`);
    }

    const result = await index.search(query, {
      filter: filterArray.length > 0 ? filterArray : undefined,
      limit: 20,
      attributesToHighlight: ["title", "content"],
    });

    return {
      hits: result.hits as SearchDocument[],
      totalHits: result.estimatedTotalHits,
      processingTimeMs: result.processingTimeMs,
      query: result.query,
    };
  }
}

export const searchService = new SearchService();
```

- [ ] **Step 2: 提交搜索服务**

```bash
git add portal/src/services/search.ts
git commit -m "feat: add Portal search service with Meilisearch"
```

---

### Task 3.4: Portal 组件开发

**Files:**

- Create: `portal/src/components/Layout.tsx`
- Create: `portal/src/components/Header.tsx`
- Create: `portal/src/components/SearchBar.tsx`
- Create: `portal/src/components/Dashboard.tsx`

- [ ] **Step 1: 创建布局组件**

```typescript
// portal/src/components/Layout.tsx
import React from 'react'
import Header from './Header'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: 创建头部导航组件**

```typescript
// portal/src/components/Header.tsx
import { useAuth } from '../hooks/useAuth'

export default function Header() {
  const { isAuthenticated, user, login, logout } = useAuth()

  const navItems = [
    { label: '首页', href: '/' },
    { label: '知识库', href: '/wiki/' },
    { label: '代码', href: '/code/' },
    { label: '任务', href: '/tasks/' },
    { label: '试验数据', href: '/data/' }
  ]

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <a href="/">知识管理平台</a>
        </div>

        <nav className="nav">
          {navItems.map(item => (
            <a key={item.href} href={item.href} className="nav-item">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="user-area">
          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-name">{user?.name}</span>
              <button onClick={logout} className="logout-btn">
                登出
              </button>
            </div>
          ) : (
            <button onClick={login} className="login-btn">
              登录
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: 创建搜索栏组件**

```typescript
// portal/src/components/SearchBar.tsx
import { useState } from 'react'
import { searchService, SearchDocument } from '../services/search'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (q.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    try {
      const result = await searchService.search(q)
      setResults(result.hits)
      setShowResults(true)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'wiki': return '📄'
      case 'code': return '💻'
      case 'task': return '📋'
      case 'file': return '📁'
      default: return '📄'
    }
  }

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="搜索知识、代码、任务、文件..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
        {loading && <span className="search-loading">搜索中...</span>}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((doc) => (
            <a
              key={doc.id}
              href={doc.url}
              className="search-result-item"
            >
              <span className="result-icon">{getTypeIcon(doc.type)}</span>
              <div className="result-content">
                <div className="result-title">{doc.title}</div>
                <div className="result-meta">
                  <span>{doc.project}</span>
                  <span>{doc.author}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 创建仪表盘组件**

```typescript
// portal/src/components/Dashboard.tsx
import SearchBar from './SearchBar'

interface DashboardCard {
  title: string
  count: number
  href: string
  icon: string
}

export default function Dashboard() {
  const cards: DashboardCard[] = [
    { title: '知识库', count: 128, href: '/wiki/', icon: '📚' },
    { title: '代码仓库', count: 45, href: '/code/', icon: '💻' },
    { title: '任务看板', count: 23, href: '/tasks/', icon: '📋' },
    { title: '试验数据', count: 56, href: '/data/', icon: '🔬' }
  ]

  return (
    <div className="dashboard">
      <div className="container">
        <div className="search-section">
          <SearchBar />
        </div>

        <div className="cards-grid">
          {cards.map((card) => (
            <a key={card.href} href={card.href} className="dashboard-card">
              <div className="card-icon">{card.icon}</div>
              <div className="card-title">{card.title}</div>
              <div className="card-count">{card.count}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 提交组件**

```bash
git add portal/src/components/
git commit -m "feat: add Portal UI components"
```

---

### Task 3.5: Portal 主应用

**Files:**

- Modify: `portal/src/App.tsx`

- [ ] **Step 1: 创建主应用组件**

```typescript
// portal/src/App.tsx
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/Layout'
import Dashboard from './components/Dashboard'

function App() {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">加载中...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <h1>知识管理平台</h1>
        <p>请登录以访问系统</p>
      </div>
    )
  }

  return (
    <Layout>
      <Dashboard />
    </Layout>
  )
}

export default App
```

- [ ] **Step 2: 提交主应用**

```bash
git add portal/src/App.tsx
git commit -m "feat: add Portal main application"
```

---

### Task 3.6: Portal Docker 部署

**Files:**

- Create: `portal/Dockerfile`
- Create: `portal/nginx.conf`
- Modify: `docker-compose.yml`

- [ ] **Step 1: 创建 Dockerfile**

```dockerfile
# portal/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 2: 创建 Portal Nginx 配置**

```nginx
# portal/nginx.conf
server {
    listen 3000;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://nginx/;
        proxy_set_header Host $host;
    }
}
```

- [ ] **Step 3: 添加 Portal 服务到 docker-compose.yml**

```yaml
# 统一门户
portal:
  build: ./portal
  container_name: knowledge-portal
  environment:
    VITE_KEYCLOAK_URL: https://${DOMAIN}/auth
    VITE_MEILISEARCH_URL: https://${DOMAIN}/storage
  networks:
    - knowledge-network
  restart: unless-stopped
```

- [ ] **Step 4: 提交 Portal 部署配置**

```bash
git add portal/ docker-compose.yml
git commit -m "feat: add Portal Docker deployment"
```

---

## Phase 4: 集成脚本

### Task 4.1: 备份脚本

**Files:**

- Create: `scripts/backup.sh`

- [ ] **Step 1: 创建备份脚本**

```bash
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
```

- [ ] **Step 2: 提交备份脚本**

```bash
chmod +x scripts/backup.sh
git add scripts/
git commit -m "feat: add backup script"
```

---

### Task 4.2: 启动脚本

**Files:**

- Create: `scripts/start.sh`
- Create: `scripts/stop.sh`

- [ ] **Step 1: 创建启动脚本**

```bash
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
```

- [ ] **Step 2: 创建停止脚本**

```bash
#!/bin/bash
# scripts/stop.sh

echo "Stopping Knowledge Management Platform..."
docker-compose down
echo "Platform stopped"
```

- [ ] **Step 3: 提交脚本**

```bash
chmod +x scripts/start.sh scripts/stop.sh
git add scripts/
git commit -m "feat: add start and stop scripts"
```

---

## 验收检查清单

### Phase 1 验收

- [ ] `docker-compose up -d` 成功启动所有服务
- [ ] PostgreSQL 所有数据库已创建
- [ ] MinIO 可通过 9000 端口访问
- [ ] Keycloak 可通过 /auth/ 路径访问
- [ ] Nginx 反向代理正常工作

### Phase 2 验收

- [ ] DokuWiki 可通过 /wiki/ 访问
- [ ] Gitea 可通过 /code/ 访问
- [ ] Plane 可通过 /tasks/ 访问
- [ ] Nextcloud 可通过 /data/ 访问

### Phase 3 验收

- [ ] Portal 首页正常显示
- [ ] Keycloak 登录功能正常
- [ ] 搜索功能可用

### Phase 4 验收

- [ ] 备份脚本可正常执行
- [ ] 启动/停止脚本可正常执行

---

## 执行说明

**两种执行方式：**

1. **Subagent-Driven (推荐)** - 每个任务派发独立子代理，任务间进行审查
2. **Inline Execution** - 在当前会话中批量执行，设置检查点

请选择执行方式。
