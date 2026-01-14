import { WarrantySurvey, WarrantySurveyStats } from '@/types/warrantySurvey';
import { createStorageService } from './storage';
import { auditService } from './audit';

const surveyStorage = createStorageService<WarrantySurvey>('warranty_surveys');

class WarrantySurveyService {
  async getAll(): Promise<WarrantySurvey[]> {
    return surveyStorage.getAll();
  }

  async getById(id: string): Promise<WarrantySurvey | null> {
    return surveyStorage.getById(id);
  }

  async getByDealer(dealerCode: string): Promise<WarrantySurvey[]> {
    return surveyStorage.query(s => s.participantInfo.dealershipCode === dealerCode);
  }

  async create(survey: WarrantySurvey, userId: string): Promise<WarrantySurvey> {
    const created = await surveyStorage.create(survey);
    await auditService.log({
      userId,
      userEmail: '',
      role: 'admin',
      module: 'warranty_survey',
      action: 'create',
      entityId: survey.id,
      entityType: 'warranty_survey',
      details: { status: survey.status },
      notes: `Created warranty survey: ${survey.id}`
    });
    return created;
  }

  async update(id: string, updates: Partial<WarrantySurvey>, userId: string): Promise<WarrantySurvey | null> {
    const updated = await surveyStorage.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    if (updated) {
      await auditService.log({
        userId,
        userEmail: '',
        role: 'admin',
        module: 'warranty_survey',
        action: 'update',
        entityId: id,
        entityType: 'warranty_survey',
        details: updates,
        notes: `Updated warranty survey: ${id}`
      });
    }
    return updated;
  }

  async getStats(): Promise<WarrantySurveyStats> {
    const surveys = await surveyStorage.getAll();
    const submitted = surveys.filter(s => s.status === 'submitted' || s.status === 'reviewed');
    
    const calcAvg = (values: number[]) => values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    
    const claimProcessAvg = calcAvg(submitted.map(s => 
      (s.claimProcess.claimSubmissionEase + s.claimProcess.documentationClarity + 
       s.claimProcess.systemUsability + s.claimProcess.responseTime + 
       s.claimProcess.approvalProcess + s.claimProcess.rejectionCommunication) / 6
    ));
    
    const technicalSupportAvg = calcAvg(submitted.map(s =>
      (s.technicalSupport.supportAvailability + s.technicalSupport.supportQuality +
       s.technicalSupport.technicalGuidance + s.technicalSupport.escalationProcess +
       s.technicalSupport.resolutionTime) / 5
    ));
    
    const partsAvailabilityAvg = calcAvg(submitted.map(s =>
      (s.partsAvailability.partsOrderingEase + s.partsAvailability.partsDeliveryTime +
       s.partsAvailability.partsQuality + s.partsAvailability.backorderCommunication +
       s.partsAvailability.returnProcess) / 5
    ));
    
    const trainingAvg = calcAvg(submitted.map(s =>
      (s.training.warrantyPolicyTraining + s.training.systemTraining + s.training.technicalTraining) / 3
    ));
    
    const overallAvg = calcAvg(submitted.map(s => s.overallSatisfaction.overallSatisfaction));
    
    const byBrand = surveys.reduce((acc, s) => {
      acc[s.participantInfo.brand] = (acc[s.participantInfo.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byStatus = surveys.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSubmissions: surveys.length,
      completionRate: surveys.length > 0 ? (submitted.length / surveys.length) * 100 : 0,
      averageSatisfaction: {
        claimProcess: claimProcessAvg,
        technicalSupport: technicalSupportAvg,
        partsAvailability: partsAvailabilityAvg,
        training: trainingAvg,
        overall: overallAvg
      },
      byBrand,
      byStatus,
      topPainPoints: [],
      recentSubmissions: surveys.slice(-5).reverse()
    };
  }
}

export const warrantySurveyService = new WarrantySurveyService();
