// Workshop Survey Types

export type LikertScale = 1 | 2 | 3 | 4 | 5;
export type SatisfactionRating = 'very_satisfied' | 'satisfied' | 'neutral' | 'dissatisfied' | 'very_dissatisfied';
export type YesNo = 'yes' | 'no';
export type HardwareModel = 'VAS6150C' | 'VAS6150D' | 'VAS6150E' | 'VAS6150F';
export type DesiredEnhancement = 'etka_mobile' | 'video_tpi' | 'remote_support' | 'utilization_analytics';

export interface ParticipantInfo {
  name: string;
  brand: 'volkswagen' | 'skoda';
  dealershipCode: string;
  officialEmail: string;
  phone: string;
  workshopDesignation: string;
}

export interface ElsaProSection {
  satisfaction: LikertScale;
  supportQuality: LikertScale;
  operationsCodesAvailability: LikertScale;
  manualContentQuality: LikertScale;
  flowDiagramsClarity: LikertScale;
  dissCodeAvailability: LikertScale;
  maintenanceManualAccuracy: LikertScale;
  feedback: string;
}

export interface OdisSection {
  satisfaction: LikertScale;
  supportResponseTime: LikertScale;
  testPlanAvailability: LikertScale;
  testPlanClarity: LikertScale;
  hardwareModel: HardwareModel;
  feedback: string;
}

export interface InteractiveDiagnosisSection {
  tabletAvailability: YesNo;
  supportQuality: LikertScale;
  threeDRefitment: LikertScale;
  threeDWiring: LikertScale;
  diagnosticTreesClarity: LikertScale;
  desiredEnhancements: DesiredEnhancement[];
  impactStatements: string;
  overallExperience: LikertScale;
  futureInterest: YesNo;
  reasonsForNotHavingTablet?: string;
  feedback: string;
}

export interface ToolsEquipmentSection {
  savwToolsAvailability: LikertScale;
  toolsQuality: LikertScale;
  deliveryTimeliness: LikertScale;
  communicationTAT: LikertScale;
  orderingProcess: LikertScale;
  vendorCoordination: LikertScale;
  postDeliverySupport: LikertScale;
  feedback: string;
}

export interface WprcSection {
  queryResolutionClarity: LikertScale;
  responseSpeed: LikertScale;
  performanceImprovement: LikertScale;
  tciExpressPickup: LikertScale;
  bookingEffectiveness: LikertScale;
  packingSlipInfoSatisfaction: LikertScale;
  qlikViewStatusUsefulness: LikertScale;
  receivingNewsletters: YesNo;
  newsletterEffectiveness: LikertScale;
  newsletterExpectations: string;
  feedback: string;
}

export interface WorkshopSurvey {
  id: string;
  participantInfo: ParticipantInfo;
  elsaPro: ElsaProSection;
  odis: OdisSection;
  interactiveDiagnosis: InteractiveDiagnosisSection;
  toolsEquipment: ToolsEquipmentSection;
  wprc: WprcSection;
  status: 'draft' | 'submitted' | 'reviewed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface SurveyDashboardStats {
  totalSubmissions: number;
  completionRate: number;
  averageSatisfaction: {
    elsaPro: number;
    odis: number;
    interactiveDiagnosis: number;
    toolsEquipment: number;
    wprc: number;
    overall: number;
  };
  byBrand: Record<string, number>;
  byStatus: Record<string, number>;
  topPainPoints: { section: string; question: string; score: number }[];
  recentSubmissions: WorkshopSurvey[];
}
