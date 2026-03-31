-- AI Medical Imaging SaaS - Initial Database Schema
-- PostgreSQL Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'radiologist', 'technician', 'viewer')),
  tenant_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role);

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mrn VARCHAR(100) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  birth_date DATE NOT NULL,
  gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'other', 'unknown')),
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mrn, tenant_id)
);

CREATE INDEX idx_patients_mrn ON patients(mrn);
CREATE INDEX idx_patients_tenant_id ON patients(tenant_id);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);

-- Studies Table
CREATE TABLE IF NOT EXISTS studies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_instance_uid VARCHAR(255) UNIQUE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  study_date DATE NOT NULL,
  study_time TIME WITH TIME ZONE,
  modality VARCHAR(50) NOT NULL,
  body_part VARCHAR(100),
  description TEXT,
  physician_name VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'archived')),
  series_count INTEGER NOT NULL DEFAULT 0,
  instance_count INTEGER NOT NULL DEFAULT 0,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_studies_patient_id ON studies(patient_id);
CREATE INDEX idx_studies_study_uid ON studies(study_instance_uid);
CREATE INDEX idx_studies_tenant_id ON studies(tenant_id);
CREATE INDEX idx_studies_modality ON studies(modality);
CREATE INDEX idx_studies_study_date ON studies(study_date);

-- Analysis Tasks Table
CREATE TABLE IF NOT EXISTS analysis_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  model_id VARCHAR(255) NOT NULL,
  model_version VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER NOT NULL DEFAULT 5,
  parameters JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analysis_tasks_study_id ON analysis_tasks(study_id);
CREATE INDEX idx_analysis_tasks_status ON analysis_tasks(status);
CREATE INDEX idx_analysis_tasks_priority ON analysis_tasks(priority);
CREATE INDEX idx_analysis_tasks_created_at ON analysis_tasks(created_at);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  analysis_task_id UUID REFERENCES analysis_tasks(id) ON DELETE SET NULL,
  template_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'signed', 'archived')),
  content JSONB,
  signed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_study_id ON reports(study_id);
CREATE INDEX idx_reports_analysis_task_id ON reports(analysis_task_id);
CREATE INDEX idx_reports_status ON reports(status);

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_studies_updated_at BEFORE UPDATE ON studies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_tasks_updated_at BEFORE UPDATE ON analysis_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (id, email, password_hash, full_name, role, tenant_id, status)
VALUES (
  '7c9e6679-7425-40de-944b-e07fc1f90ae8',
  'admin@hospital.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWjPpW8p8G',
  'System Administrator',
  'admin',
  '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Insert default doctor user (password: doctor123)
INSERT INTO users (id, email, password_hash, full_name, role, tenant_id, status)
VALUES (
  '7c9e6679-7425-40de-944b-e07fc1f90ae9',
  'doctor@hospital.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWjPpW8p8G',
  'Dr. Zhang Wei',
  'radiologist',
  '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  'active'
) ON CONFLICT (email) DO NOTHING;
