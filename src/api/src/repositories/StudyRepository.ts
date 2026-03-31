// Study Repository - PostgreSQL
import { Study } from '../types';
import { pgQuery } from '../database/postgres';

export interface CreateStudyParams {
  id?: string;
  studyInstanceUid?: string;
  patientId: string;
  studyDate: string;
  studyTime?: string;
  modality: string;
  bodyPart?: string;
  description?: string;
  physicianName?: string;
  tenantId: string;
}

export interface UpdateStudyParams {
  bodyPart?: string;
  description?: string;
  physicianName?: string;
  status?: 'pending' | 'processing' | 'completed' | 'archived';
  seriesCount?: number;
  instanceCount?: number;
}

export class StudyRepository {
  async findById(id: string, tenantId: string): Promise<Study | null> {
    const result = await pgQuery(
      `SELECT id, study_instance_uid as "studyInstanceUid", patient_id as "patientId",
              study_date as "studyDate", study_time as "studyTime", modality, body_part as "bodyPart",
              description, physician_name as "physicianName", status, series_count as "seriesCount",
              instance_count as "instanceCount", tenant_id as "tenantId",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM studies WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  async findByStudyInstanceUid(studyInstanceUid: string, tenantId: string): Promise<Study | null> {
    const result = await pgQuery(
      `SELECT id, study_instance_uid as "studyInstanceUid", patient_id as "patientId",
              study_date as "studyDate", study_time as "studyTime", modality, body_part as "bodyPart",
              description, physician_name as "physicianName", status, series_count as "seriesCount",
              instance_count as "instanceCount", tenant_id as "tenantId",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM studies WHERE study_instance_uid = $1 AND tenant_id = $2`,
      [studyInstanceUid, tenantId]
    );
    return result.rows[0] || null;
  }

  async create(params: CreateStudyParams): Promise<Study> {
    const result = await pgQuery(
      `INSERT INTO studies (id, study_instance_uid, patient_id, study_date, study_time, modality,
                            body_part, description, physician_name, tenant_id, status, series_count, instance_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 0, 0)
       RETURNING id, study_instance_uid as "studyInstanceUid", patient_id as "patientId",
                 study_date as "studyDate", study_time as "studyTime", modality, body_part as "bodyPart",
                 description, physician_name as "physicianName", status, series_count as "seriesCount",
                 instance_count as "instanceCount", tenant_id as "tenantId",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [
        params.id || `s_${Date.now()}`,
        params.studyInstanceUid || null,
        params.patientId,
        params.studyDate,
        params.studyTime || null,
        params.modality,
        params.bodyPart || null,
        params.description || null,
        params.physicianName || null,
        params.tenantId,
      ]
    );
    return result.rows[0];
  }

  async update(id: string, tenantId: string, params: UpdateStudyParams): Promise<Study | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (params.bodyPart !== undefined) {
      setClauses.push(`body_part = $${index}`);
      values.push(params.bodyPart);
      index++;
    }
    if (params.description !== undefined) {
      setClauses.push(`description = $${index}`);
      values.push(params.description);
      index++;
    }
    if (params.physicianName !== undefined) {
      setClauses.push(`physician_name = $${index}`);
      values.push(params.physicianName);
      index++;
    }
    if (params.status !== undefined) {
      setClauses.push(`status = $${index}`);
      values.push(params.status);
      index++;
    }
    if (params.seriesCount !== undefined) {
      setClauses.push(`series_count = $${index}`);
      values.push(params.seriesCount);
      index++;
    }
    if (params.instanceCount !== undefined) {
      setClauses.push(`instance_count = $${index}`);
      values.push(params.instanceCount);
      index++;
    }

    if (setClauses.length === 0) {
      return this.findById(id, tenantId);
    }

    values.push(id);
    values.push(tenantId);

    const result = await pgQuery(
      `UPDATE studies SET ${setClauses.join(', ')}
       WHERE id = $${index} AND tenant_id = $${index + 1}
       RETURNING id, study_instance_uid as "studyInstanceUid", patient_id as "patientId",
                 study_date as "studyDate", study_time as "studyTime", modality, body_part as "bodyPart",
                 description, physician_name as "physicianName", status, series_count as "seriesCount",
                 instance_count as "instanceCount", tenant_id as "tenantId",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );
    return result.rows[0] || null;
  }

  async listByTenant(
    tenantId: string,
    limit = 100,
    offset = 0,
    patientId?: string,
    modality?: string,
    status?: string
  ): Promise<Study[]> {
    let query = `
      SELECT id, study_instance_uid as "studyInstanceUid", patient_id as "patientId",
             study_date as "studyDate", study_time as "studyTime", modality, body_part as "bodyPart",
             description, physician_name as "physicianName", status, series_count as "seriesCount",
             instance_count as "instanceCount", tenant_id as "tenantId",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM studies WHERE tenant_id = $1
    `;
    const values: any[] = [tenantId];
    let index = 2;

    if (patientId) {
      query += ` AND patient_id = $${index}`;
      values.push(patientId);
      index++;
    }
    if (modality) {
      query += ` AND modality = $${index}`;
      values.push(modality);
      index++;
    }
    if (status) {
      query += ` AND status = $${index}`;
      values.push(status);
      index++;
    }

    query += ` ORDER BY study_date DESC, created_at DESC`;
    query += ` LIMIT $${index} OFFSET $${index + 1}`;
    values.push(limit, offset);

    const result = await pgQuery(query, values);
    return result.rows;
  }

  async countByTenant(
    tenantId: string,
    patientId?: string,
    modality?: string,
    status?: string
  ): Promise<number> {
    let query = `SELECT COUNT(*) FROM studies WHERE tenant_id = $1`;
    const values: any[] = [tenantId];
    let index = 2;

    if (patientId) {
      query += ` AND patient_id = $${index}`;
      values.push(patientId);
      index++;
    }
    if (modality) {
      query += ` AND modality = $${index}`;
      values.push(modality);
      index++;
    }
    if (status) {
      query += ` AND status = $${index}`;
      values.push(status);
      index++;
    }

    const result = await pgQuery(query, values);
    return parseInt(result.rows[0].count, 10);
  }
}

export const studyRepository = new StudyRepository();
