// MT Meet (Master Technician Meet) Types

export type MTMeetStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
export type AttendanceStatus = 'registered' | 'confirmed' | 'attended' | 'absent';

export interface MTMeetEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  city: string;
  brand: 'volkswagen' | 'skoda' | 'both';
  agenda: AgendaItem[];
  maxParticipants: number;
  currentParticipants: number;
  status: MTMeetStatus;
  createdBy: string;
  createdAt: string;
}

export interface AgendaItem {
  id: string;
  time: string;
  title: string;
  speaker?: string;
  duration: number; // in minutes
}

export interface MTMeetParticipant {
  id: string;
  meetId: string;
  technicianId: string;
  name: string;
  email: string;
  phone: string;
  dealerCode: string;
  dealerName: string;
  designation: string;
  yearsOfExperience: number;
  specialization: string;
  brand: 'volkswagen' | 'skoda';
  status: AttendanceStatus;
  registeredAt: string;
  feedbackSubmitted?: boolean;
}

export interface MTMeetFeedback {
  id: string;
  meetId: string;
  participantId: string;
  overallRating: 1 | 2 | 3 | 4 | 5;
  contentQuality: 1 | 2 | 3 | 4 | 5;
  venueRating: 1 | 2 | 3 | 4 | 5;
  organizationRating: 1 | 2 | 3 | 4 | 5;
  speakerRating: 1 | 2 | 3 | 4 | 5;
  keyTakeaways: string;
  suggestions: string;
  wouldRecommend: boolean;
  submittedAt: string;
}

export interface MTMeetDashboardStats {
  totalMeets: number;
  upcomingMeets: number;
  totalAttendees: number;
  averageRating: number;
  attendanceRate: number;
  byBrand: Record<string, number>;
  byCity: Record<string, number>;
  recentMeets: MTMeetEvent[];
}
