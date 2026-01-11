/**
 * Workshop Survey Service
 * Handles CRUD operations for workshop system surveys
 */

import { WorkshopSurvey, SurveyDashboardStats } from '@/types/survey';
import { auditService } from './audit';

const STORAGE_KEY = 'vw_portal_workshop_surveys';

const getItems = (): WorkshopSurvey[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const setItems = (items: WorkshopSurvey[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const workshopSurveyService = {
  async getAll(): Promise<WorkshopSurvey[]> {
    return getItems();
  },

  async getById(id: string): Promise<WorkshopSurvey | null> {
    const items = getItems();
    return items.find(item => item.id === id) || null;
  },

  async getByDealerCode(dealerCode: string): Promise<WorkshopSurvey[]> {
    const items = getItems();
    return items.filter(item => item.participantInfo.dealershipCode === dealerCode);
  },

  async create(survey: WorkshopSurvey, userId: string): Promise<WorkshopSurvey> {
    const items = getItems();
    items.push(survey);
    setItems(items);
    
    await auditService.log({
      userId,
      userEmail: '',
      role: 'master_technician',
      module: 'workshop_survey',
      action: 'create',
      entityId: survey.id,
      entityType: 'workshop_survey',
      details: { dealerCode: survey.participantInfo.dealershipCode }
    });
    
    return survey;
  },

  async update(id: string, updates: Partial<WorkshopSurvey>, userId: string): Promise<WorkshopSurvey | null> {
    const items = getItems();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    setItems(items);
    
    await auditService.log({
      userId,
      userEmail: '',
      role: 'master_technician',
      module: 'workshop_survey',
      action: 'update',
      entityId: id,
      entityType: 'workshop_survey'
    });
    
    return items[index];
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const items = getItems();
    const newItems = items.filter(item => item.id !== id);
    if (newItems.length === items.length) return false;
    
    setItems(newItems);
    
    await auditService.log({
      userId,
      userEmail: '',
      role: 'admin',
      module: 'workshop_survey',
      action: 'delete',
      entityId: id,
      entityType: 'workshop_survey'
    });
    
    return true;
  },

  async getDashboardStats(): Promise<SurveyDashboardStats> {
    const surveys = getItems();
    const submittedSurveys = surveys.filter(s => s.status !== 'draft');
    
    const calculateAvgLikert = (values: number[]): number => {
      if (values.length === 0) return 0;
      return values.reduce((a, b) => a + b, 0) / values.length;
    };

    const getElsaProAvg = (s: WorkshopSurvey) => {
      const vals = [
        s.elsaPro.satisfaction,
        s.elsaPro.supportQuality,
        s.elsaPro.operationsCodesAvailability,
        s.elsaPro.manualContentQuality,
        s.elsaPro.flowDiagramsClarity,
        s.elsaPro.dissCodeAvailability,
        s.elsaPro.maintenanceManualAccuracy
      ];
      return calculateAvgLikert(vals);
    };

    const getOdisAvg = (s: WorkshopSurvey) => {
      const vals = [
        s.odis.satisfaction,
        s.odis.supportResponseTime,
        s.odis.testPlanAvailability,
        s.odis.testPlanClarity
      ];
      return calculateAvgLikert(vals);
    };

    const getInteractiveAvg = (s: WorkshopSurvey) => {
      const vals = [
        s.interactiveDiagnosis.supportQuality,
        s.interactiveDiagnosis.threeDRefitment,
        s.interactiveDiagnosis.threeDWiring,
        s.interactiveDiagnosis.diagnosticTreesClarity,
        s.interactiveDiagnosis.overallExperience
      ];
      return calculateAvgLikert(vals);
    };

    const getToolsAvg = (s: WorkshopSurvey) => {
      const vals = [
        s.toolsEquipment.savwToolsAvailability,
        s.toolsEquipment.toolsQuality,
        s.toolsEquipment.deliveryTimeliness,
        s.toolsEquipment.communicationTAT,
        s.toolsEquipment.orderingProcess,
        s.toolsEquipment.vendorCoordination,
        s.toolsEquipment.postDeliverySupport
      ];
      return calculateAvgLikert(vals);
    };

    const getWprcAvg = (s: WorkshopSurvey) => {
      const vals = [
        s.wprc.queryResolutionClarity,
        s.wprc.responseSpeed,
        s.wprc.performanceImprovement,
        s.wprc.tciExpressPickup,
        s.wprc.bookingEffectiveness,
        s.wprc.packingSlipInfoSatisfaction,
        s.wprc.qlikViewStatusUsefulness
      ];
      return calculateAvgLikert(vals);
    };

    const elsaProScores = submittedSurveys.map(getElsaProAvg);
    const odisScores = submittedSurveys.map(getOdisAvg);
    const interactiveScores = submittedSurveys.map(getInteractiveAvg);
    const toolsScores = submittedSurveys.map(getToolsAvg);
    const wprcScores = submittedSurveys.map(getWprcAvg);

    const allScores = [...elsaProScores, ...odisScores, ...interactiveScores, ...toolsScores, ...wprcScores];

    // Count by brand
    const byBrand: Record<string, number> = {};
    submittedSurveys.forEach(s => {
      const brand = s.participantInfo.brand;
      byBrand[brand] = (byBrand[brand] || 0) + 1;
    });

    // Count by status
    const byStatus: Record<string, number> = {};
    surveys.forEach(s => {
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    });

    // Identify pain points (lowest scoring questions)
    const painPoints: { section: string; question: string; score: number }[] = [];
    if (submittedSurveys.length > 0) {
      painPoints.push(
        { section: 'ElsaPro', question: 'Satisfaction', score: calculateAvgLikert(elsaProScores) },
        { section: 'ODIS', question: 'Satisfaction', score: calculateAvgLikert(odisScores) },
        { section: 'Interactive Diagnosis', question: 'Overall Experience', score: calculateAvgLikert(interactiveScores) },
        { section: 'Tools & Equipment', question: 'Quality', score: calculateAvgLikert(toolsScores) },
        { section: 'WPRC', question: 'Response Speed', score: calculateAvgLikert(wprcScores) }
      );
      painPoints.sort((a, b) => a.score - b.score);
    }

    return {
      totalSubmissions: submittedSurveys.length,
      completionRate: surveys.length > 0 ? (submittedSurveys.length / surveys.length) * 100 : 0,
      averageSatisfaction: {
        elsaPro: calculateAvgLikert(elsaProScores),
        odis: calculateAvgLikert(odisScores),
        interactiveDiagnosis: calculateAvgLikert(interactiveScores),
        toolsEquipment: calculateAvgLikert(toolsScores),
        wprc: calculateAvgLikert(wprcScores),
        overall: calculateAvgLikert(allScores)
      },
      byBrand,
      byStatus,
      topPainPoints: painPoints.slice(0, 5),
      recentSubmissions: submittedSurveys.slice(-5).reverse()
    };
  }
};
