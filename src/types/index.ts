// User and Role Types
export type DealerRole = 'master_technician' | 'service_manager' | 'service_head' | 'warranty_manager';
export type ManufacturerRole = 'admin' | 'super_admin';
export type UserRole = DealerRole | ManufacturerRole;

export interface User {
  id: string;
  email: string;
  employeeId: string;
  name: string;
  role: UserRole;
  dealerId?: string;
  dealerName?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Dealer {
  id: string;
  code: string;
  name: string;
  city: string;
  contactPerson: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

// Feature Flag Types
export type ModuleKey = 
  | 'dealer_pcc' 
  | 'api_registration' 
  | 'mt_meet' 
  | 'workshop_survey' 
  | 'warranty_survey' 
  | 'technical_awareness_survey';

export interface FeatureFlag {
  moduleKey: ModuleKey;
  enabled: boolean;
  lastModifiedBy: string;
  lastModifiedAt: string;
  reason?: string;
}

export interface FeatureFlagConfig {
  flags: Record<ModuleKey, FeatureFlag>;
}

// PCC Types
export type PCCStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'more_info_required';
export type Brand = 'volkswagen' | 'skoda';
export type PCCTopic = 'dealer_pcc' | 'long_term_pcc';
export type PCCSubtopic = 'engine' | 'transmission' | 'electrical' | 'suspension' | 'brakes' | 'body' | 'interior' | 'other';

export interface PCCSubmission {
  id: string;
  referenceNumber: string;
  status: PCCStatus;
  
  // Dealer Info
  dealerId: string;
  dealerCode: string;
  dealerName: string;
  contactPerson: string;
  email: string;
  
  // Vehicle Info
  brand: Brand;
  model: string;
  vin: string;
  registrationNo: string;
  productionDate: string;
  
  // Details & Classification
  topic: PCCTopic;
  subtopic: PCCSubtopic;
  escalatedToBrand: boolean;
  escalationNotes?: string;
  
  // Engine & Technical
  engineCode: string;
  gearboxCode: string;
  mileage: number;
  repairDate: string;
  
  // Complaint & Breakdown
  dissTicketNo?: string;
  warrantyClaimNo?: string;
  partDescription: string;
  damagePartNumber: string;
  repeatedRepair: boolean;
  breakdown: boolean;
  
  // Attachments
  attachments: Attachment[];
  
  // Declaration
  declarationAccepted: boolean;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastUpdatedBy?: string;
  statusHistory: StatusHistoryEntry[];
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface StatusHistoryEntry {
  status: PCCStatus;
  changedBy: string;
  changedAt: string;
  notes?: string;
}

// Audit Types
export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'approve' 
  | 'reject' 
  | 'status_change' 
  | 'flag_toggle' 
  | 'export' 
  | 'login' 
  | 'logout';

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  role: UserRole;
  module: ModuleKey | 'auth' | 'system';
  action: AuditAction;
  entityId?: string;
  entityType?: string;
  details?: Record<string, any>;
  notes?: string;
  timestamp: string;
  ipAddress?: string;
}

// Access Request Types
export interface AccessRequest {
  id: string;
  dealerCode: string;
  dealerName: string;
  city: string;
  contactPerson: string;
  email: string;
  phone: string;
  requestedRole: DealerRole;
  employeeId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedBy?: string;
  processedAt?: string;
  notes?: string;
}

// API Registration Types
export interface APIRegistration {
  id: string;
  brand: Brand;
  kvps: string;
  dealerName: string;
  city: string;
  serviceHead: ParticipantInfo;
  serviceManager?: ParticipantInfo;
  warrantyManager?: ParticipantInfo;
  masterTechnician?: ParticipantInfo;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  createdBy: string;
}

export interface ParticipantInfo {
  name: string;
  mobile: string;
  email: string;
  gender?: 'male' | 'female';
  tshirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
}

// Dashboard Types
export interface DashboardStats {
  total: number;
  byStatus: Record<PCCStatus, number>;
  bySubtopic: Record<PCCSubtopic, number>;
  approvalRate: number;
  averageTAT: number;
  recentSubmissions: PCCSubmission[];
  moreInfoQueue: PCCSubmission[];
}
