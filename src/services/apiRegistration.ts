import { Event, Participant, EventDashboardStats } from '@/types/apiRegistration';
import { createStorageService } from './storage';
import { auditService } from './audit';

const eventStorage = createStorageService<Event>('api_events');
const participantStorage = createStorageService<Participant>('api_participants');

class APIRegistrationService {
  // Event Management
  async getAllEvents(): Promise<Event[]> {
    return eventStorage.getAll();
  }

  async getEventById(id: string): Promise<Event | null> {
    return eventStorage.getById(id);
  }

  async createEvent(event: Event, userId: string): Promise<Event> {
    const created = await eventStorage.create(event);
    await auditService.log({
      userId,
      userEmail: '',
      role: 'admin',
      module: 'api_registration',
      action: 'create',
      entityId: event.id,
      entityType: 'event',
      details: { title: event.title, date: event.date },
      notes: `Created event: ${event.title}`
    });
    return created;
  }

  async updateEvent(id: string, updates: Partial<Event>, userId: string): Promise<Event | null> {
    const updated = await eventStorage.update(id, updates);
    if (updated) {
      await auditService.log({
        userId,
        userEmail: '',
        role: 'admin',
        module: 'api_registration',
        action: 'update',
        entityId: id,
        entityType: 'event',
        details: updates,
        notes: `Updated event: ${id}`
      });
    }
    return updated;
  }

  // Participant Management
  async getParticipantsByEvent(eventId: string): Promise<Participant[]> {
    return participantStorage.query(p => p.eventId === eventId);
  }

  async registerParticipant(participant: Participant, userId: string): Promise<Participant> {
    const created = await participantStorage.create(participant);
    
    // Update event participant count
    const event = await eventStorage.getById(participant.eventId);
    if (event) {
      await eventStorage.update(participant.eventId, {
        currentParticipants: event.currentParticipants + 1
      });
    }

    await auditService.log({
      userId,
      userEmail: '',
      role: 'admin',
      module: 'api_registration',
      action: 'create',
      entityId: participant.id,
      entityType: 'participant',
      details: { name: participant.name, eventId: participant.eventId },
      notes: `Registered participant: ${participant.name}`
    });
    return created;
  }

  async updateParticipantStatus(id: string, status: Participant['status'], userId: string): Promise<Participant | null> {
    const updates: Partial<Participant> = { status };
    if (status === 'confirmed') updates.confirmedAt = new Date().toISOString();
    if (status === 'attended') updates.attendedAt = new Date().toISOString();
    
    const updated = await participantStorage.update(id, updates);
    if (updated) {
      await auditService.log({
        userId,
        userEmail: '',
        role: 'admin',
        module: 'api_registration',
        action: 'update',
        entityId: id,
        entityType: 'participant',
        details: { status },
        notes: `Updated participant status to: ${status}`
      });
    }
    return updated;
  }

  async getDashboardStats(): Promise<EventDashboardStats> {
    const events = await eventStorage.getAll();
    const participants = await participantStorage.getAll();
    
    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.date) > now);
    const confirmedParticipants = participants.filter(p => p.status === 'confirmed' || p.status === 'attended');
    const attendedParticipants = participants.filter(p => p.status === 'attended');
    
    const byEventType = events.reduce((acc, e) => {
      acc[e.eventType] = (acc[e.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byBrand = participants.reduce((acc, p) => {
      acc[p.brand] = (acc[p.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: events.length,
      upcomingEvents: upcomingEvents.length,
      totalParticipants: participants.length,
      confirmedParticipants: confirmedParticipants.length,
      attendanceRate: participants.length > 0 ? (attendedParticipants.length / participants.length) * 100 : 0,
      byEventType: byEventType as Record<string, number>,
      byBrand,
      recentRegistrations: participants.slice(-5).reverse()
    };
  }
}

export const apiRegistrationService = new APIRegistrationService();
