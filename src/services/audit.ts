/**
 * Audit Service
 * 
 * Records all significant actions for compliance and debugging.
 * Captures: userId, role, module, action, timestamp, and optional details.
 */

import { AuditLog, AuditAction, UserRole, ModuleKey } from '@/types';
import { auditStorage } from './storage';

interface AuditLogInput {
  userId: string;
  userEmail: string;
  role: UserRole;
  module: ModuleKey | 'auth' | 'system';
  action: AuditAction;
  entityId?: string;
  entityType?: string;
  details?: Record<string, any>;
  notes?: string;
}

class AuditService {
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async log(input: AuditLogInput): Promise<AuditLog> {
    const auditLog: AuditLog = {
      id: this.generateId(),
      ...input,
      timestamp: new Date().toISOString()
    };

    await auditStorage.create(auditLog);
    return auditLog;
  }

  async getAll(): Promise<AuditLog[]> {
    const logs = await auditStorage.getAll();
    return logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getByUser(userId: string): Promise<AuditLog[]> {
    return auditStorage.query(log => log.userId === userId);
  }

  async getByModule(module: ModuleKey | 'auth' | 'system'): Promise<AuditLog[]> {
    return auditStorage.query(log => log.module === module);
  }

  async getByAction(action: AuditAction): Promise<AuditLog[]> {
    return auditStorage.query(log => log.action === action);
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    return auditStorage.query(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  async getByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return auditStorage.query(
      log => log.entityType === entityType && log.entityId === entityId
    );
  }
}

export const auditService = new AuditService();
