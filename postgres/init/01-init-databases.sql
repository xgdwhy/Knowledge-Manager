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
