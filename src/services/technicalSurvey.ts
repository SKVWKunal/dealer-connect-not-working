import { TechnicalSurvey, TechnicalSurveyStats, TechnicianLevel, KnowledgeArea } from '@/types/technicalSurvey';
import { createStorageService } from './storage';
import { auditService } from './audit';

const surveyStorage = createStorageService<TechnicalSurvey>('technical_surveys');

class TechnicalSurveyService {
  async getAll(): Promise<TechnicalSurvey[]> {
    return surveyStorage.getAll();
  }

  async getById(id: string): Promise<TechnicalSurvey | null> {
    return surveyStorage.getById(id);
  }

  async getByDealer(dealerCode: string): Promise<TechnicalSurvey[]> {
    return surveyStorage.query(s => s.participantInfo.dealershipCode === dealerCode);
  }

  async create(survey: TechnicalSurvey, userId: string): Promise<TechnicalSurvey> {
    const created = await surveyStorage.create(survey);
    await auditService.log({
      userId,
      userEmail: '',
      role: 'admin',
      module: 'technical_awareness_survey',
      action: 'create',
      entityId: survey.id,
      entityType: 'technical_survey',
      details: { status: survey.status },
      notes: `Created technical survey: ${survey.id}`
    });
    return created;
  }

  async update(id: string, updates: Partial<TechnicalSurvey>, userId: string): Promise<TechnicalSurvey | null> {
    const updated = await surveyStorage.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    if (updated) {
      await auditService.log({
        userId,
        userEmail: '',
        role: 'admin',
        module: 'technical_awareness_survey',
        action: 'update',
        entityId: id,
        entityType: 'technical_survey',
        details: updates,
        notes: `Updated technical survey: ${id}`
      });
    }
    return updated;
  }

  async getStats(): Promise<TechnicalSurveyStats> {
    const surveys = await surveyStorage.getAll();
    const submitted = surveys.filter(s => s.status === 'submitted' || s.status === 'reviewed');
    
    const calcAvg = (values: number[]) => values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    
    const vehicleSystemsAvg = calcAvg(submitted.map(s =>
      (s.vehicleSystems.engineKnowledge + s.vehicleSystems.transmissionKnowledge +
       s.vehicleSystems.electricalSystems + s.vehicleSystems.suspensionBrakes +
       s.vehicleSystems.hvacSystems + s.vehicleSystems.infotainmentSystems +
       s.vehicleSystems.safetySystemsKnowledge) / 7
    ));
    
    const diagnosticToolsAvg = calcAvg(submitted.map(s =>
      (s.diagnosticTools.odisProfilenicy + s.diagnosticTools.vasProficiency +
       s.diagnosticTools.elsaProProficiency + s.diagnosticTools.gffUsage +
       s.diagnosticTools.flashingProcedures + s.diagnosticTools.codingCalibration) / 6
    ));
    
    const newTechnologyAvg = calcAvg(submitted.map(s =>
      (s.newTechnology.evHybridKnowledge + s.newTechnology.adasSystems +
       s.newTechnology.connectedCarTechnology + s.newTechnology.highVoltageSafety +
       s.newTechnology.batteryManagement + s.newTechnology.chargingInfrastructure) / 6
    ));
    
    const selfAssessmentAvg = calcAvg(submitted.map(s =>
      (s.selfAssessment.overallConfidence + s.selfAssessment.complexDiagnostics +
       s.selfAssessment.customerExplanation + s.selfAssessment.continuousLearning) / 4
    ));
    
    const byBrand = surveys.reduce((acc, s) => {
      acc[s.participantInfo.brand] = (acc[s.participantInfo.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byLevel = surveys.reduce((acc, s) => {
      acc[s.participantInfo.technicianLevel] = (acc[s.participantInfo.technicianLevel] || 0) + 1;
      return acc;
    }, {} as Record<TechnicianLevel, number>);
    
    const bySpecialization = surveys.reduce((acc, s) => {
      acc[s.participantInfo.primarySpecialization] = (acc[s.participantInfo.primarySpecialization] || 0) + 1;
      return acc;
    }, {} as Record<KnowledgeArea, number>);
    
    const trainingPriorityDistribution = surveys.reduce((acc, s) => {
      s.trainingNeeds.topTrainingPriorities.forEach(priority => {
        acc[priority] = (acc[priority] || 0) + 1;
      });
      return acc;
    }, {} as Record<KnowledgeArea, number>);

    return {
      totalSubmissions: surveys.length,
      completionRate: surveys.length > 0 ? (submitted.length / surveys.length) * 100 : 0,
      averageScores: {
        vehicleSystems: vehicleSystemsAvg,
        diagnosticTools: diagnosticToolsAvg,
        newTechnology: newTechnologyAvg,
        selfAssessment: selfAssessmentAvg,
        overall: (vehicleSystemsAvg + diagnosticToolsAvg + newTechnologyAvg + selfAssessmentAvg) / 4
      },
      byBrand,
      byLevel,
      bySpecialization,
      trainingPriorityDistribution,
      recentSubmissions: surveys.slice(-5).reverse()
    };
  }
}

export const technicalSurveyService = new TechnicalSurveyService();
