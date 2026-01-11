/**
 * PCC (Product Concern Capture) Service
 * 
 * Handles PCC submission creation, updates, and status management.
 */

import { PCCSubmission, PCCStatus, DashboardStats } from '@/types';
import { pccStorage } from './storage';
import { auditService } from './audit';
import { authService } from './auth';

class PCCService {
  private generateReferenceNumber(): string {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 9000) + 1000;
    return `PCC-IN-${year}-${sequence}`;
  }

  private generateId(): string {
    return `pcc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async create(submission: Omit<PCCSubmission, 'id' | 'referenceNumber' | 'status' | 'createdAt' | 'updatedAt' | 'statusHistory'>): Promise<PCCSubmission> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date().toISOString();
    const newSubmission: PCCSubmission = {
      ...submission,
      id: this.generateId(),
      referenceNumber: this.generateReferenceNumber(),
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          status: 'submitted',
          changedBy: user.id,
          changedAt: now,
          notes: 'Initial submission'
        }
      ]
    };

    await pccStorage.create(newSubmission);

    await auditService.log({
      userId: user.id,
      userEmail: user.email,
      role: user.role,
      module: 'dealer_pcc',
      action: 'create',
      entityId: newSubmission.id,
      entityType: 'pcc_submission',
      details: { referenceNumber: newSubmission.referenceNumber },
      notes: `Created PCC submission ${newSubmission.referenceNumber}`
    });

    return newSubmission;
  }

  async getById(id: string): Promise<PCCSubmission | null> {
    return pccStorage.getById(id);
  }

  async getByReference(referenceNumber: string): Promise<PCCSubmission | null> {
    const submissions = await pccStorage.query(
      s => s.referenceNumber === referenceNumber
    );
    return submissions[0] || null;
  }

  async getByDealer(dealerId: string): Promise<PCCSubmission[]> {
    return pccStorage.query(s => s.dealerId === dealerId);
  }

  async getAll(): Promise<PCCSubmission[]> {
    return pccStorage.getAll();
  }

  async updateStatus(
    id: string, 
    newStatus: PCCStatus, 
    notes?: string
  ): Promise<PCCSubmission | null> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const submission = await pccStorage.getById(id);
    if (!submission) return null;

    const now = new Date().toISOString();
    const historyEntry = {
      status: newStatus,
      changedBy: user.id,
      changedAt: now,
      notes
    };

    const updated = await pccStorage.update(id, {
      status: newStatus,
      updatedAt: now,
      lastUpdatedBy: user.id,
      statusHistory: [...submission.statusHistory, historyEntry]
    });

    await auditService.log({
      userId: user.id,
      userEmail: user.email,
      role: user.role,
      module: 'dealer_pcc',
      action: 'status_change',
      entityId: id,
      entityType: 'pcc_submission',
      details: { 
        previousStatus: submission.status, 
        newStatus,
        referenceNumber: submission.referenceNumber 
      },
      notes: notes || `Status changed from ${submission.status} to ${newStatus}`
    });

    return updated;
  }

  async getDashboardStats(dealerId?: string): Promise<DashboardStats> {
    let submissions = await pccStorage.getAll();
    
    if (dealerId) {
      submissions = submissions.filter(s => s.dealerId === dealerId);
    }

    const byStatus: Record<PCCStatus, number> = {
      draft: 0,
      submitted: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      more_info_required: 0
    };

    const bySubtopic: Record<string, number> = {
      engine: 0,
      transmission: 0,
      electrical: 0,
      suspension: 0,
      brakes: 0,
      body: 0,
      interior: 0,
      other: 0
    };

    let totalTAT = 0;
    let completedCount = 0;

    submissions.forEach(s => {
      byStatus[s.status]++;
      bySubtopic[s.subtopic]++;

      if (s.status === 'approved' || s.status === 'rejected') {
        const created = new Date(s.createdAt).getTime();
        const updated = new Date(s.updatedAt).getTime();
        totalTAT += (updated - created) / (1000 * 60 * 60 * 24); // Days
        completedCount++;
      }
    });

    const total = submissions.length;
    const approvalRate = total > 0 ? (byStatus.approved / total) * 100 : 0;
    const averageTAT = completedCount > 0 ? totalTAT / completedCount : 0;

    const recentSubmissions = submissions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const moreInfoQueue = submissions.filter(s => s.status === 'more_info_required');

    return {
      total,
      byStatus,
      bySubtopic: bySubtopic as any,
      approvalRate,
      averageTAT,
      recentSubmissions,
      moreInfoQueue
    };
  }
}

export const pccService = new PCCService();
