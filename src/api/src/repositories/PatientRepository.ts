// Patient Repository - PostgreSQL
import { Patient } from '../types';
import { pgQuery } from '../database/postgres';

export interface CreatePatientParams {
  id?: string;
  mrn: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  tenantId: string;
}

export interface UpdatePatientParams {
  mrn?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
}

export class PatientRepository {
  async findById(id: string, tenantId: string): Promise<Patient | null> {
    const result = await pgQuery(
      `SELECT id, mrn, first_name as "firstName", last_name as "lastName",
              birth_date as "birthDate", gender, tenant_id as "tenantId",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM patients WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  async findByMrn(mrn: string, tenantId: string): Promise<Patient | null> {
    const result = await pgQuery(
      `SELECT id, mrn, first_name as "firstName", last_name as "lastName",
              birth_date as "birthDate", gender, tenant_id as "tenantId",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM patients WHERE mrn = $1 AND tenant_id = $2`,
      [mrn, tenantId]
    );
    return result.rows[0] || null;
  }

  async create(params: CreatePatientParams): Promise<Patient> {
    const result = await pgQuery(
      `INSERT INTO patients (id, mrn, first_name, last_name, birth_date, gender, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, mrn, first_name as "firstName", last_name as "lastName",
                 birth_date as "birthDate", gender, tenant_id as "tenantId",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [params.id || `p_${Date.now()}`, params.mrn, params.firstName, params.lastName, params.birthDate, params.gender, params.tenantId]
    );
    return result.rows[0];
  }

  async update(id: string, tenantId: string, params: UpdatePatientParams): Promise<Patient | null> {
    const setClauses: string[] = [];
    const values: (string | Date)[] = [];
    let index = 1;

    if (params.mrn !== undefined) {
      setClauses.push(`mrn = $${index}`);
      values.push(params.mrn);
      index++;
    }
    if (params.firstName !== undefined) {
      setClauses.push(`first_name = $${index}`);
      values.push(params.firstName);
      index++;
    }
    if (params.lastName !== undefined) {
      setClauses.push(`last_name = $${index}`);
      values.push(params.lastName);
      index++;
    }
    if (params.birthDate !== undefined) {
      setClauses.push(`birth_date = $${index}`);
      values.push(params.birthDate);
      index++;
    }
    if (params.gender !== undefined) {
      setClauses.push(`gender = $${index}`);
      values.push(params.gender);
      index++;
    }

    if (setClauses.length === 0) {
      return this.findById(id, tenantId);
    }

    values.push(id);
    values.push(tenantId);

    const result = await pgQuery(
      `UPDATE patients SET ${setClauses.join(', ')}
       WHERE id = $${index} AND tenant_id = $${index + 1}
       RETURNING id, mrn, first_name as "firstName", last_name as "lastName",
                 birth_date as "birthDate", gender, tenant_id as "tenantId",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );
    return result.rows[0] || null;
  }

  async listByTenant(
    tenantId: string,
    limit = 100,
    offset = 0,
    search?: string
  ): Promise<Patient[]> {
    let query = `
      SELECT id, mrn, first_name as "firstName", last_name as "lastName",
             birth_date as "birthDate", gender, tenant_id as "tenantId",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM patients WHERE tenant_id = $1
    `;
    const values: (string | number)[] = [tenantId];

    if (search) {
      query += ` AND (first_name ILIKE $2 OR last_name ILIKE $2 OR mrn ILIKE $2)`;
      values.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;
    query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pgQuery(query, values);
    return result.rows;
  }

  async countByTenant(tenantId: string, search?: string): Promise<number> {
    let query = `SELECT COUNT(*) FROM patients WHERE tenant_id = $1`;
    const values: (string | number)[] = [tenantId];

    if (search) {
      query += ` AND (first_name ILIKE $2 OR last_name ILIKE $2 OR mrn ILIKE $2)`;
      values.push(`%${search}%`);
    }

    const result = await pgQuery(query, values);
    return parseInt(result.rows[0].count, 10);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await pgQuery(
      'DELETE FROM patients WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rowCount > 0;
  }
}

export const patientRepository = new PatientRepository();
