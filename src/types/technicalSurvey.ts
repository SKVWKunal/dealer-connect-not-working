// Technical Awareness Survey Types

import { LikertScale, YesNo } from './survey';

export type TechnicianLevel = 'junior' | 'senior' | 'master' | 'specialist';
export type KnowledgeArea = 'electrical' | 'mechanical' | 'diagnostic' | 'bodywork' | 'paint' | 'hvac';

export interface TechnicalParticipantInfo {
  name: string;
  brand: 'volkswagen' | 'skoda';
  dealershipCode: string;
  dealershipName: string;
  officialEmail: string;
  phone: string;
  designation: string;
  technicianLevel: TechnicianLevel;
  yearsOfExperience: number;
  primarySpecialization: KnowledgeArea;
}

export interface VehicleSystemsSection {
  engineKnowledge: LikertScale;
  transmissionKnowledge: LikertScale;
  electricalSystems: LikertScale;
  suspensionBrakes: LikertScale;
  hvacSystems: LikertScale;
  infotainmentSystems: LikertScale;
  safetySystemsKnowledge: LikertScale;
  feedback: string;
}

export interface DiagnosticToolsSection {
  odisProfilenicy: LikertScale;
  vasProficiency: LikertScale;
  elsaProProficiency: LikertScale;
  gffUsage: LikertScale;
  flashingProcedures: LikertScale;
  codingCalibration: LikertScale;
  feedback: string;
}

export interface NewTechnologySection {
  evHybridKnowledge: LikertScale;
  adasSystems: LikertScale;
  connectedCarTechnology: LikertScale;
  highVoltageSafety: LikertScale;
  batteryManagement: LikertScale;
  chargingInfrastructure: LikertScale;
  interestInTraining: YesNo;
  feedback: string;
}

export interface TrainingNeedsSection {
  currentTrainingAdequacy: LikertScale;
  preferredTrainingMode: 'classroom' | 'online' | 'hands-on' | 'hybrid';
  topTrainingPriorities: KnowledgeArea[];
  certificationInterest: YesNo;
  challengingAreas: string;
  feedback: string;
}

export interface SelfAssessmentSection {
  overallConfidence: LikertScale;
  complexDiagnostics: LikertScale;
  customerExplanation: LikertScale;
  knowledgeSharing: YesNo;
  continuousLearning: LikertScale;
  careerGoals: string;
}

export interface TechnicalSurvey {
  id: string;
  participantInfo: TechnicalParticipantInfo;
  vehicleSystems: VehicleSystemsSection;
  diagnosticTools: DiagnosticToolsSection;
  newTechnology: NewTechnologySection;
  trainingNeeds: TrainingNeedsSection;
  selfAssessment: SelfAssessmentSection;
  status: 'draft' | 'submitted' | 'reviewed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface TechnicalSurveyStats {
  totalSubmissions: number;
  completionRate: number;
  averageScores: {
    vehicleSystems: number;
    diagnosticTools: number;
    newTechnology: number;
    selfAssessment: number;
    overall: number;
  };
  byBrand: Record<string, number>;
  byLevel: Record<TechnicianLevel, number>;
  bySpecialization: Record<KnowledgeArea, number>;
  trainingPriorityDistribution: Record<KnowledgeArea, number>;
  recentSubmissions: TechnicalSurvey[];
}
