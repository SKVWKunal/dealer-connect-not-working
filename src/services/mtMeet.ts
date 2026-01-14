import { MTMeetEvent, MTMeetParticipant, MTMeetFeedback, MTMeetDashboardStats } from '@/types/mtMeet';
import { createStorageService } from './storage';
import { auditService } from './audit';

const meetStorage = createStorageService<MTMeetEvent>('mt_meets');
const participantStorage = createStorageService<MTMeetParticipant>('mt_participants');
const feedbackStorage = createStorageService<MTMeetFeedback>('mt_feedback');

class MTMeetService {
  // Meet Management
  async getAllMeets(): Promise<MTMeetEvent[]> {
    return meetStorage.getAll();
  }

  async getMeetById(id: string): Promise<MTMeetEvent | null> {
    return meetStorage.getById(id);
  }

  async createMeet(meet: MTMeetEvent, userId: string): Promise<MTMeetEvent> {
    const created = await meetStorage.create(meet);
    await auditService.log({
      userId,
      userEmail: '',
      role: 'admin',
      module: 'mt_meet',
      action: 'create',
      entityId: meet.id,
      entityType: 'mt_meet',
      details: { title: meet.title, date: meet.date },
      notes: `Created MT Meet: ${meet.title}`
    });
    return created;
  }

  async updateMeet(id: string, updates: Partial<MTMeetEvent>, userId: string): Promise<MTMeetEvent | null> {
    const updated = await meetStorage.update(id, updates);
    if (updated) {
      await auditService.log({
        userId,
        userEmail: '',
        role: 'admin',
        module: 'mt_meet',
        action: 'update',
        entityId: id,
        entityType: 'mt_meet',
        details: updates,
        notes: `Updated MT Meet: ${id}`
      });
    }
    return updated;
  }

  // Participant Management
  async getParticipantsByMeet(meetId: string): Promise<MTMeetParticipant[]> {
    return participantStorage.query(p => p.meetId === meetId);
  }

  async registerParticipant(participant: MTMeetParticipant, userId: string): Promise<MTMeetParticipant> {
    const created = await participantStorage.create(participant);
    
    const meet = await meetStorage.getById(participant.meetId);
    if (meet) {
      await meetStorage.update(participant.meetId, {
        currentParticipants: meet.currentParticipants + 1
      });
    }

    await auditService.log({
      userId,
      userEmail: '',
      role: 'admin',
      module: 'mt_meet',
      action: 'create',
      entityId: participant.id,
      entityType: 'mt_participant',
      details: { name: participant.name, meetId: participant.meetId },
      notes: `Registered MT participant: ${participant.name}`
    });
    return created;
  }

  async updateParticipantStatus(id: string, status: MTMeetParticipant['status'], userId: string): Promise<MTMeetParticipant | null> {
    const updated = await participantStorage.update(id, { status });
    if (updated) {
      await auditService.log({
        userId,
        userEmail: '',
        role: 'admin',
        module: 'mt_meet',
        action: 'update',
        entityId: id,
        entityType: 'mt_participant',
        details: { status },
        notes: `Updated MT participant status to: ${status}`
      });
    }
    return updated;
  }

  // Feedback Management
  async submitFeedback(feedback: MTMeetFeedback, userId: string): Promise<MTMeetFeedback> {
    const created = await feedbackStorage.create(feedback);
    await participantStorage.update(feedback.participantId, { feedbackSubmitted: true });
    
    await auditService.log({
      userId,
      userEmail: '',
      role: 'admin',
      module: 'mt_meet',
      action: 'create',
      entityId: feedback.id,
      entityType: 'mt_feedback',
      details: { meetId: feedback.meetId, rating: feedback.overallRating },
      notes: `Submitted MT Meet feedback`
    });
    return created;
  }

  async getFeedbackByMeet(meetId: string): Promise<MTMeetFeedback[]> {
    return feedbackStorage.query(f => f.meetId === meetId);
  }

  async getDashboardStats(): Promise<MTMeetDashboardStats> {
    const meets = await meetStorage.getAll();
    const participants = await participantStorage.getAll();
    const feedback = await feedbackStorage.getAll();
    
    const now = new Date();
    const upcomingMeets = meets.filter(m => new Date(m.date) > now);
    const attendedParticipants = participants.filter(p => p.status === 'attended');
    
    const averageRating = feedback.length > 0
      ? feedback.reduce((sum, f) => sum + f.overallRating, 0) / feedback.length
      : 0;
    
    const byBrand = participants.reduce((acc, p) => {
      acc[p.brand] = (acc[p.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byCity = meets.reduce((acc, m) => {
      acc[m.city] = (acc[m.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalMeets: meets.length,
      upcomingMeets: upcomingMeets.length,
      totalAttendees: participants.length,
      averageRating,
      attendanceRate: participants.length > 0 ? (attendedParticipants.length / participants.length) * 100 : 0,
      byBrand,
      byCity,
      recentMeets: meets.slice(-5).reverse()
    };
  }
}

export const mtMeetService = new MTMeetService();
