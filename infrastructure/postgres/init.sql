-- PostgreSQL 初始化脚本 - AI 医疗影像分析系统

-- 创建医疗影像数据库
CREATE DATABASE medical_db
    WITH
    OWNER = admin
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- 连接到 medical_db 数据库
\c medical_db;

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 表空间配置
CREATE TABLESPACE IF NOT EXISTS medical_data_ts
    LOCATION '/var/lib/postgresql/data/tablespaces/medical_data';

CREATE TABLESPACE IF NOT EXISTS medical_index_ts
    LOCATION '/var/lib/postgresql/data/tablespaces/medical_index';

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'doctor',
    tenant_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
) TABLESPACE medical_data_ts;

-- 患者表
CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    patient_id VARCHAR(100) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(10),
    contact_info JSONB,
    medical_history JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) TABLESPACE medical_data_ts;

-- 检查记录表
CREATE TABLE IF NOT EXISTS studies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    study_uid VARCHAR(255) NOT NULL,
    study_date DATE NOT NULL,
    study_time TIME,
    modality VARCHAR(50) NOT NULL,
    body_part VARCHAR(100),
    study_description TEXT,
    physician_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
) TABLESPACE medical_data_ts;

-- 影像系列表
CREATE TABLE IF NOT EXISTS series (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    study_id UUID NOT NULL,
    series_uid VARCHAR(255) NOT NULL,
    modality VARCHAR(50) NOT NULL,
    series_number INTEGER,
    series_description TEXT,
    number_of_instances INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (study_id) REFERENCES studies(id)
) TABLESPACE medical_data_ts;

-- 影像实例表
CREATE TABLE IF NOT EXISTS instances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    series_id UUID NOT NULL,
    instance_uid VARCHAR(255) NOT NULL,
    sop_class_uid VARCHAR(255) NOT NULL,
    instance_number INTEGER,
    file_location TEXT NOT NULL,
    file_size BIGINT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (series_id) REFERENCES series(id)
) TABLESPACE medical_data_ts;

-- 分析任务表
CREATE TABLE IF NOT EXISTS analysis_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    study_id UUID NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    result JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (study_id) REFERENCES studies(id)
) TABLESPACE medical_data_ts;

-- 报告表
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    study_id UUID NOT NULL,
    analysis_task_id UUID NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    content JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    signed_by UUID,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (study_id) REFERENCES studies(id),
    FOREIGN KEY (analysis_task_id) REFERENCES analysis_tasks(id)
) TABLESPACE medical_data_ts;

-- 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) TABLESPACE medical_data_ts;

-- 索引创建
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id) TABLESPACE medical_index_ts;
CREATE INDEX IF NOT EXISTS idx_patients_tenant ON patients(tenant_id) TABLESPACE medical_index_ts;
CREATE INDEX IF NOT EXISTS idx_studies_tenant ON studies(tenant_id) TABLESPACE medical_index_ts;
CREATE INDEX IF NOT EXISTS idx_studies_patient ON studies(patient_id) TABLESPACE medical_index_ts;
CREATE INDEX IF NOT EXISTS idx_series_study ON series(study_id) TABLESPACE medical_index_ts;
CREATE INDEX IF NOT EXISTS idx_instances_series ON instances(series_id) TABLESPACE medical_index_ts;
CREATE INDEX IF NOT EXISTS idx_analysis_tasks_study ON analysis_tasks(study_id) TABLESPACE medical_index_ts;
CREATE INDEX IF NOT EXISTS idx_analysis_tasks_status ON analysis_tasks(status) TABLESPACE medical_index_ts;
CREATE INDEX IF NOT EXISTS idx_reports_study ON reports(study_id) TABLESPACE medical_index_ts;
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id) TABLESPACE medical_index_ts;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id) TABLESPACE medical_index_ts;
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action) TABLESPACE medical_index_ts;

-- 租户表
CREATE TABLE IF NOT EXISTS tenants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) TABLESPACE medical_data_ts;

-- 创建根租户
INSERT INTO tenants (id, name, domain, status, settings)
VALUES (
    uuid_generate_v4(),
    'Default Tenant',
    'localhost',
    'active',
    '{"max_users": 100, "max_studies_per_month": 10000, "features": {"ai_analysis": true, "reporting": true}}'::jsonb
) ON CONFLICT DO NOTHING;

-- 插入初始用户
INSERT INTO users (id, email, password_hash, full_name, role, tenant_id, status)
VALUES (
    uuid_generate_v4(),
    'admin@example.com',
    crypt('admin123', gen_salt('bf')),
    'System Administrator',
    'admin',
    (SELECT id FROM tenants WHERE domain = 'localhost'),
    'active'
) ON CONFLICT DO NOTHING;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_studies_updated_at BEFORE UPDATE ON studies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON series
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instances_updated_at BEFORE UPDATE ON instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_tasks_updated_at BEFORE UPDATE ON analysis_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_logs_updated_at BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 策略和权限
-- 启用行级安全策略 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY users_tenant_isolation ON users
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY patients_tenant_isolation ON patients
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY studies_tenant_isolation ON studies
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY series_tenant_isolation ON series
    USING (EXISTS (SELECT 1 FROM studies s WHERE s.id = series.study_id AND s.tenant_id = current_setting('app.tenant_id')::uuid));

CREATE POLICY instances_tenant_isolation ON instances
    USING (EXISTS (SELECT 1 FROM instances i
                  JOIN series s ON i.series_id = s.id
                  JOIN studies st ON s.study_id = st.id
                  WHERE i.id = instances.id AND st.tenant_id = current_setting('app.tenant_id')::uuid));

CREATE POLICY analysis_tasks_tenant_isolation ON analysis_tasks
    USING (EXISTS (SELECT 1 FROM analysis_tasks at
                  JOIN studies st ON at.study_id = st.id
                  WHERE at.id = analysis_tasks.id AND st.tenant_id = current_setting('app.tenant_id')::uuid));

CREATE POLICY reports_tenant_isolation ON reports
    USING (EXISTS (SELECT 1 FROM reports r
                  JOIN studies st ON r.study_id = st.id
                  WHERE r.id = reports.id AND st.tenant_id = current_setting('app.tenant_id')::uuid));

CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- 创建医疗数据视图
CREATE OR REPLACE VIEW patient_studies AS
SELECT
    p.id as patient_id,
    p.first_name,
    p.last_name,
    p.birth_date,
    p.gender,
    s.id as study_id,
    s.study_uid,
    s.study_date,
    s.modality,
    s.body_part,
    s.status,
    COUNT(DISTINCT se.id) as series_count,
    COUNT(DISTINCT i.id) as instance_count
FROM patients p
LEFT JOIN studies s ON p.id = s.patient_id
LEFT JOIN series se ON s.id = se.study_id
LEFT JOIN instances i ON se.id = i.series_id
GROUP BY p.id, s.id;
