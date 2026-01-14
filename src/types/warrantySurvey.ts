// Warranty Survey Types

import { LikertScale, YesNo } from './survey';

export interface WarrantyParticipantInfo {
  name: string;
  brand: 'volkswagen' | 'skoda';
  dealershipCode: string;
  dealershipName: string;
  officialEmail: string;
  phone: string;
  designation: string;
}

export interface ClaimProcessSection {
  claimSubmissionEase: LikertScale;
  documentationClarity: LikertScale;
  systemUsability: LikertScale;
  responseTime: LikertScale;
  approvalProcess: LikertScale;
  rejectionCommunication: LikertScale;
  feedback: string;
}

export interface TechnicalSupportSection {
  supportAvailability: LikertScale;
  supportQuality: LikertScale;
  technicalGuidance: LikertScale;
  escalationProcess: LikertScale;
  resolutionTime: LikertScale;
  feedback: string;
}

export interface PartsAvailabilitySection {
  partsOrderingEase: LikertScale;
  partsDeliveryTime: LikertScale;
  partsQuality: LikertScale;
  backorderCommunication: LikertScale;
  returnProcess: LikertScale;
  feedback: string;
}

export interface TrainingSection {
  warrantyPolicyTraining: LikertScale;
  systemTraining: LikertScale;
  technicalTraining: LikertScale;
  trainingFrequency: YesNo;
  additionalTrainingNeeds: string;
  feedback: string;
}

export interface OverallSatisfactionSection {
  overallSatisfaction: LikertScale;
  warrantyProcessFairness: LikertScale;
  communicationQuality: LikertScale;
  improvementSuggestions: string;
  additionalComments: string;
}

export interface WarrantySurvey {
  id: string;
  participantInfo: WarrantyParticipantInfo;
  claimProcess: ClaimProcessSection;
  technicalSupport: TechnicalSupportSection;
  partsAvailability: PartsAvailabilitySection;
  training: TrainingSection;
  overallSatisfaction: OverallSatisfactionSection;
  status: 'draft' | 'submitted' | 'reviewed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface WarrantySurveyStats {
  totalSubmissions: number;
  completionRate: number;
  averageSatisfaction: {
    claimProcess: number;
    technicalSupport: number;
    partsAvailability: number;
    training: number;
    overall: number;
  };
  byBrand: Record<string, number>;
  byStatus: Record<string, number>;
  topPainPoints: { section: string; question: string; score: number }[];
  recentSubmissions: WarrantySurvey[];
}
