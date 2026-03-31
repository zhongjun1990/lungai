// User Repository - PostgreSQL
import { User } from '../types';
import { pgQuery } from '../database/postgres';
import bcrypt from 'bcryptjs';

export interface CreateUserParams {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'radiologist' | 'technician' | 'viewer';
  tenantId: string;
}

export interface UpdateUserParams {
  fullName?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await pgQuery(
      'SELECT id, email, full_name as "fullName", role, tenant_id as "tenantId", status, created_at as "createdAt", updated_at as "updatedAt", last_login_at as "lastLoginAt" FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await pgQuery(
      'SELECT id, email, full_name as "fullName", role, tenant_id as "tenantId", status, created_at as "createdAt", updated_at as "updatedAt", last_login_at as "lastLoginAt" FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findByEmailAndTenant(email: string, tenantId: string): Promise<User | null> {
    const result = await pgQuery(
      'SELECT id, email, full_name as "fullName", role, tenant_id as "tenantId", status, created_at as "createdAt", updated_at as "updatedAt", last_login_at as "lastLoginAt" FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );
    return result.rows[0] || null;
  }

  async verifyPassword(email: string, password: string, tenantId: string): Promise<User | null> {
    const result = await pgQuery(
      'SELECT * FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );
    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;

    // Update last login time
    await this.updateLastLogin(user.id);

    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      tenantId: user.tenant_id,
      status: user.status,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: user.last_login_at,
    };
  }

  async updateLastLogin(id: string): Promise<void> {
    await pgQuery(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  async create(params: CreateUserParams): Promise<User> {
    const passwordHash = await bcrypt.hash(params.password, 12);
    const result = await pgQuery(
      `INSERT INTO users (email, password_hash, full_name, role, tenant_id, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id, email, full_name as "fullName", role, tenant_id as "tenantId", status, created_at as "createdAt", updated_at as "updatedAt"`,
      [params.email, passwordHash, params.fullName, params.role, params.tenantId]
    );
    return result.rows[0];
  }

  async update(id: string, params: UpdateUserParams): Promise<User | null> {
    const setClauses: string[] = [];
    const values: (string | Date)[] = [];
    let index = 1;

    if (params.fullName !== undefined) {
      setClauses.push(`full_name = $${index}`);
      values.push(params.fullName);
      index++;
    }
    if (params.status !== undefined) {
      setClauses.push(`status = $${index}`);
      values.push(params.status);
      index++;
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await pgQuery(
      `UPDATE users SET ${setClauses.join(', ')}
       WHERE id = $${index}
       RETURNING id, email, full_name as "fullName", role, tenant_id as "tenantId", status, created_at as "createdAt", updated_at as "updatedAt", last_login_at as "lastLoginAt"`,
      values
    );
    return result.rows[0] || null;
  }

  async listByTenant(tenantId: string, limit = 100, offset = 0): Promise<User[]> {
    const result = await pgQuery(
      `SELECT id, email, full_name as "fullName", role, tenant_id as "tenantId", status, created_at as "createdAt", updated_at as "updatedAt", last_login_at as "lastLoginAt"
       FROM users WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );
    return result.rows;
  }
}

export const userRepository = new UserRepository();
