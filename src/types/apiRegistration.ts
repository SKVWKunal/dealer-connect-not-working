// API Registration Types

export type RegistrationStatus = 'pending' | 'confirmed' | 'attended' | 'cancelled';
export type EventType = 'training' | 'meeting' | 'conference' | 'workshop';

export interface Event {
  id: string;
  title: string;
  description: string;
  eventType: EventType;
  date: string;
  time: string;
  venue: string;
  maxParticipants: number;
  currentParticipants: number;
  brand: 'volkswagen' | 'skoda' | 'both';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
}

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  dealerCode: string;
  designation: string;
  brand: 'volkswagen' | 'skoda';
  status: RegistrationStatus;
  registeredAt: string;
  confirmedAt?: string;
  attendedAt?: string;
  notes?: string;
}

export interface EventDashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  totalParticipants: number;
  confirmedParticipants: number;
  attendanceRate: number;
  byEventType: Record<EventType, number>;
  byBrand: Record<string, number>;
  recentRegistrations: Participant[];
}
