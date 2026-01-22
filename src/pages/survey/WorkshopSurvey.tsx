import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionCard } from '@/components/survey/SectionCard';
import { LikertScale } from '@/components/survey/LikertScale';
import { YesNoToggle } from '@/components/survey/YesNoToggle';
import { MultiSelect } from '@/components/survey/MultiSelect';
import { useAuth } from '@/contexts/AuthContext';
import { workshopSurveyService } from '@/services/workshopSurvey';
import { WorkshopSurvey as WorkshopSurveyType } from '@/types/survey';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Wrench, 
  Monitor, 
  Tablet, 
  Package, 
  HeadphonesIcon,
  Save,
  Send,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

type SurveyStep = 'participant' | 'elsapro' | 'odis' | 'interactive' | 'tools' | 'wprc' | 'review';

const steps: { key: SurveyStep; label: string; icon: React.ReactNode }[] = [
  { key: 'participant', label: 'Participant Info', icon: <User className="h-4 w-4" /> },
  { key: 'elsapro', label: 'ElsaPro', icon: <Wrench className="h-4 w-4" /> },
  { key: 'odis', label: 'ODIS', icon: <Monitor className="h-4 w-4" /> },
  { key: 'interactive', label: 'Interactive Diagnosis', icon: <Tablet className="h-4 w-4" /> },
  { key: 'tools', label: 'Tools & Equipment', icon: <Package className="h-4 w-4" /> },
  { key: 'wprc', label: 'WPRC', icon: <HeadphonesIcon className="h-4 w-4" /> },
  { key: 'review', label: 'Review & Submit', icon: <Send className="h-4 w-4" /> },
];

const enhancementOptions = [
  { value: 'etka_mobile', label: 'ETKA Mobile' },
  { value: 'video_tpi', label: 'Video TPI' },
  { value: 'remote_support', label: 'Remote Support' },
  { value: 'utilization_analytics', label: 'Utilization Analytics' },
];

const initialFormData: Omit<WorkshopSurveyType, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'status'> = {
  participantInfo: {
    name: '',
    brand: 'volkswagen',
    dealershipCode: '',
    officialEmail: '',
    phone: '',
    workshopDesignation: '',
  },
  elsaPro: {
    satisfaction: 3,
    supportQuality: 3,
    operationsCodesAvailability: 3,
    manualContentQuality: 3,
    flowDiagramsClarity: 3,
    dissCodeAvailability: 3,
    maintenanceManualAccuracy: 3,
    feedback: '',
  },
  odis: {
    satisfaction: 3,
    supportResponseTime: 3,
    testPlanAvailability: 3,
    testPlanClarity: 3,
    hardwareModel: 'VAS6150E',
    feedback: '',
  },
  interactiveDiagnosis: {
    tabletAvailability: 'yes',
    supportQuality: 3,
    threeDRefitment: 3,
    threeDWiring: 3,
    diagnosticTreesClarity: 3,
    desiredEnhancements: [],
    impactStatements: '',
    overallExperience: 3,
    futureInterest: 'yes',
    reasonsForNotHavingTablet: '',
    feedback: '',
  },
  toolsEquipment: {
    savwToolsAvailability: 3,
    toolsQuality: 3,
    deliveryTimeliness: 3,
    communicationTAT: 3,
    orderingProcess: 3,
    vendorCoordination: 3,
    postDeliverySupport: 3,
    feedback: '',
  },
  wprc: {
    queryResolutionClarity: 3,
    responseSpeed: 3,
    performanceImprovement: 3,
    tciExpressPickup: 3,
    bookingEffectiveness: 3,
    packingSlipInfoSatisfaction: 3,
    qlikViewStatusUsefulness: 3,
    receivingNewsletters: 'yes',
    newsletterEffectiveness: 3,
    newsletterExpectations: '',
    feedback: '',
  },
};

export default function WorkshopSurvey() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<SurveyStep>('participant');
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  const updateParticipant = <K extends keyof typeof formData.participantInfo>(
    field: K,
    value: typeof formData.participantInfo[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      participantInfo: { ...prev.participantInfo, [field]: value }
    }));
  };

  const updateElsaPro = <K extends keyof typeof formData.elsaPro>(
    field: K,
    value: typeof formData.elsaPro[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      elsaPro: { ...prev.elsaPro, [field]: value }
    }));
  };

  const updateOdis = <K extends keyof typeof formData.odis>(
    field: K,
    value: typeof formData.odis[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      odis: { ...prev.odis, [field]: value }
    }));
  };

  const updateInteractive = <K extends keyof typeof formData.interactiveDiagnosis>(
    field: K,
    value: typeof formData.interactiveDiagnosis[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      interactiveDiagnosis: { ...prev.interactiveDiagnosis, [field]: value }
    }));
  };

  const updateTools = <K extends keyof typeof formData.toolsEquipment>(
    field: K,
    value: typeof formData.toolsEquipment[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      toolsEquipment: { ...prev.toolsEquipment, [field]: value }
    }));
  };

  const updateWprc = <K extends keyof typeof formData.wprc>(
    field: K,
    value: typeof formData.wprc[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      wprc: { ...prev.wprc, [field]: value }
    }));
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const survey: WorkshopSurveyType = {
        id: `WS-${Date.now()}`,
        ...formData,
        status: 'submitted',
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await workshopSurveyService.create(survey, user.id);

      toast({
        title: 'Survey Submitted',
        description: 'Thank you for completing the workshop system survey.',
      });

      navigate('/workshop-survey/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit survey. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user) return;

    try {
      const survey: WorkshopSurveyType = {
        id: `WS-${Date.now()}`,
        ...formData,
        status: 'draft',
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await workshopSurveyService.create(survey, user.id);

      toast({
        title: 'Draft Saved',
        description: 'Your survey progress has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save draft.',
        variant: 'destructive',
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'participant':
        return (
          <SectionCard title="Participant Information" icon={<User className="h-5 w-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.participantInfo.name}
                  onChange={e => updateParticipant('name', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Select
                  value={formData.participantInfo.brand}
                  onValueChange={v => updateParticipant('brand', v as 'volkswagen' | 'skoda')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volkswagen">Volkswagen</SelectItem>
                    <SelectItem value="skoda">Skoda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dealershipCode">Dealership Code *</Label>
                <Input
                  id="dealershipCode"
                  value={formData.participantInfo.dealershipCode}
                  onChange={e => updateParticipant('dealershipCode', e.target.value)}
                  placeholder="e.g., DLR001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Official Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.participantInfo.officialEmail}
                  onChange={e => updateParticipant('officialEmail', e.target.value)}
                  placeholder="your.email@dealer.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.participantInfo.phone}
                  onChange={e => updateParticipant('phone', e.target.value)}
                  placeholder="10-digit mobile number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Workshop Designation *</Label>
                <Input
                  id="designation"
                  value={formData.participantInfo.workshopDesignation}
                  onChange={e => updateParticipant('workshopDesignation', e.target.value)}
                  placeholder="e.g., Service Manager"
                />
              </div>
            </div>
          </SectionCard>
        );

      case 'elsapro':
        return (
          <SectionCard 
            title="ElsaPro Feedback" 
            description="Rate your experience with ElsaPro documentation and support system"
            icon={<Wrench className="h-5 w-5" />}
          >
            <div className="space-y-8">
              <LikertScale
                label="Overall satisfaction with ElsaPro"
                value={formData.elsaPro.satisfaction}
                onChange={v => updateElsaPro('satisfaction', v as 1 | 2 | 3 | 4 | 5)}
                required
              />
              
              <LikertScale
                label="Quality of support provided"
                value={formData.elsaPro.supportQuality}
                onChange={v => updateElsaPro('supportQuality', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Availability of operations codes"
                value={formData.elsaPro.operationsCodesAvailability}
                onChange={v => updateElsaPro('operationsCodesAvailability', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Quality of manual content"
                value={formData.elsaPro.manualContentQuality}
                onChange={v => updateElsaPro('manualContentQuality', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Clarity of flow diagrams"
                value={formData.elsaPro.flowDiagramsClarity}
                onChange={v => updateElsaPro('flowDiagramsClarity', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Availability of DISS codes"
                value={formData.elsaPro.dissCodeAvailability}
                onChange={v => updateElsaPro('dissCodeAvailability', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Accuracy of maintenance manual"
                value={formData.elsaPro.maintenanceManualAccuracy}
                onChange={v => updateElsaPro('maintenanceManualAccuracy', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <div className="space-y-2">
                <Label htmlFor="elsaproFeedback">Additional Feedback</Label>
                <Textarea
                  id="elsaproFeedback"
                  value={formData.elsaPro.feedback}
                  onChange={e => updateElsaPro('feedback', e.target.value)}
                  placeholder="Share any additional feedback about ElsaPro..."
                  rows={4}
                />
              </div>
            </div>
          </SectionCard>
        );

      case 'odis':
        return (
          <SectionCard 
            title="ODIS Feedback" 
            description="Rate your experience with ODIS diagnostic system"
            icon={<Monitor className="h-5 w-5" />}
          >
            <div className="space-y-8">
              <LikertScale
                label="Overall satisfaction with ODIS"
                value={formData.odis.satisfaction}
                onChange={v => updateOdis('satisfaction', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Support response time"
                value={formData.odis.supportResponseTime}
                onChange={v => updateOdis('supportResponseTime', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Availability of test plans"
                value={formData.odis.testPlanAvailability}
                onChange={v => updateOdis('testPlanAvailability', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Clarity of test plans"
                value={formData.odis.testPlanClarity}
                onChange={v => updateOdis('testPlanClarity', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <div className="space-y-2">
                <Label htmlFor="hardwareModel">Hardware Model Used *</Label>
              <Select
                  value={formData.odis.hardwareModel}
                  onValueChange={v => updateOdis('hardwareModel', v as 'VAS6150C' | 'VAS6150D' | 'VAS6150E' | 'VAS6150F')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VAS6150C">VAS6150C</SelectItem>
                    <SelectItem value="VAS6150D">VAS6150D</SelectItem>
                    <SelectItem value="VAS6150E">VAS6150E</SelectItem>
                    <SelectItem value="VAS6150F">VAS6150F</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="odisFeedback">Additional Feedback</Label>
                <Textarea
                  id="odisFeedback"
                  value={formData.odis.feedback}
                  onChange={e => updateOdis('feedback', e.target.value)}
                  placeholder="Share any additional feedback about ODIS..."
                  rows={4}
                />
              </div>
            </div>
          </SectionCard>
        );

      case 'interactive':
        return (
          <SectionCard 
            title="Interactive Diagnosis" 
            description="Rate your experience with tablet-based diagnostic tools"
            icon={<Tablet className="h-5 w-5" />}
          >
            <div className="space-y-8">
              <YesNoToggle
                label="Is diagnostic tablet available at your workshop?"
                value={formData.interactiveDiagnosis.tabletAvailability}
                onChange={v => updateInteractive('tabletAvailability', v)}
                required
              />

              {formData.interactiveDiagnosis.tabletAvailability === 'no' && (
                <div className="space-y-2">
                  <Label htmlFor="noTabletReason">Reason for not having tablet</Label>
                  <Textarea
                    id="noTabletReason"
                    value={formData.interactiveDiagnosis.reasonsForNotHavingTablet}
                    onChange={e => updateInteractive('reasonsForNotHavingTablet', e.target.value)}
                    placeholder="Please explain..."
                    rows={3}
                  />
                </div>
              )}

              <LikertScale
                label="Quality of support for interactive diagnosis"
                value={formData.interactiveDiagnosis.supportQuality}
                onChange={v => updateInteractive('supportQuality', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Usefulness of 3D refitment guides"
                value={formData.interactiveDiagnosis.threeDRefitment}
                onChange={v => updateInteractive('threeDRefitment', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Clarity of 3D wiring diagrams"
                value={formData.interactiveDiagnosis.threeDWiring}
                onChange={v => updateInteractive('threeDWiring', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Clarity of diagnostic trees"
                value={formData.interactiveDiagnosis.diagnosticTreesClarity}
                onChange={v => updateInteractive('diagnosticTreesClarity', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <MultiSelect
                label="Desired Enhancements"
                options={enhancementOptions}
                value={formData.interactiveDiagnosis.desiredEnhancements}
                onChange={v => updateInteractive('desiredEnhancements', v as ('etka_mobile' | 'video_tpi' | 'remote_support' | 'utilization_analytics')[])}
              />

              <div className="space-y-2">
                <Label htmlFor="impactStatements">Impact of interactive diagnosis on your work</Label>
                <Textarea
                  id="impactStatements"
                  value={formData.interactiveDiagnosis.impactStatements}
                  onChange={e => updateInteractive('impactStatements', e.target.value)}
                  placeholder="Describe how interactive diagnosis has impacted your workflow..."
                  rows={3}
                />
              </div>

              <LikertScale
                label="Overall experience with interactive diagnosis"
                value={formData.interactiveDiagnosis.overallExperience}
                onChange={v => updateInteractive('overallExperience', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <YesNoToggle
                label="Interested in future interactive diagnosis features?"
                value={formData.interactiveDiagnosis.futureInterest}
                onChange={v => updateInteractive('futureInterest', v)}
                required
              />

              <div className="space-y-2">
                <Label htmlFor="interactiveFeedback">Additional Feedback</Label>
                <Textarea
                  id="interactiveFeedback"
                  value={formData.interactiveDiagnosis.feedback}
                  onChange={e => updateInteractive('feedback', e.target.value)}
                  placeholder="Share any additional feedback..."
                  rows={4}
                />
              </div>
            </div>
          </SectionCard>
        );

      case 'tools':
        return (
          <SectionCard 
            title="Tools & Equipment (SAVW Tools Library)" 
            description="Rate your experience with tools and equipment services"
            icon={<Package className="h-5 w-5" />}
          >
            <div className="space-y-8">
              <LikertScale
                label="Availability of SAVW Tools"
                value={formData.toolsEquipment.savwToolsAvailability}
                onChange={v => updateTools('savwToolsAvailability', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Quality of tools"
                value={formData.toolsEquipment.toolsQuality}
                onChange={v => updateTools('toolsQuality', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Timeliness of delivery"
                value={formData.toolsEquipment.deliveryTimeliness}
                onChange={v => updateTools('deliveryTimeliness', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Communication turnaround time (TAT)"
                value={formData.toolsEquipment.communicationTAT}
                onChange={v => updateTools('communicationTAT', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Ease of ordering process"
                value={formData.toolsEquipment.orderingProcess}
                onChange={v => updateTools('orderingProcess', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Vendor coordination and payment process"
                value={formData.toolsEquipment.vendorCoordination}
                onChange={v => updateTools('vendorCoordination', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Post-delivery support"
                value={formData.toolsEquipment.postDeliverySupport}
                onChange={v => updateTools('postDeliverySupport', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <div className="space-y-2">
                <Label htmlFor="toolsFeedback">Additional Feedback</Label>
                <Textarea
                  id="toolsFeedback"
                  value={formData.toolsEquipment.feedback}
                  onChange={e => updateTools('feedback', e.target.value)}
                  placeholder="Share any additional feedback about tools and equipment..."
                  rows={4}
                />
              </div>
            </div>
          </SectionCard>
        );

      case 'wprc':
        return (
          <SectionCard 
            title="WPRC (Warranty Parts Return Centre)" 
            description="Rate your experience with WPRC services and logistics"
            icon={<HeadphonesIcon className="h-5 w-5" />}
          >
            <div className="space-y-8">
              <LikertScale
                label="Clarity of query resolution"
                value={formData.wprc.queryResolutionClarity}
                onChange={v => updateWprc('queryResolutionClarity', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Speed of response"
                value={formData.wprc.responseSpeed}
                onChange={v => updateWprc('responseSpeed', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Performance improvement over time"
                value={formData.wprc.performanceImprovement}
                onChange={v => updateWprc('performanceImprovement', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="TCI Express pickup effectiveness"
                value={formData.wprc.tciExpressPickup}
                onChange={v => updateWprc('tciExpressPickup', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Booking effectiveness"
                value={formData.wprc.bookingEffectiveness}
                onChange={v => updateWprc('bookingEffectiveness', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="Packing slip information satisfaction"
                value={formData.wprc.packingSlipInfoSatisfaction}
                onChange={v => updateWprc('packingSlipInfoSatisfaction', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <LikertScale
                label="QlikView status usefulness"
                value={formData.wprc.qlikViewStatusUsefulness}
                onChange={v => updateWprc('qlikViewStatusUsefulness', v as 1 | 2 | 3 | 4 | 5)}
                required
              />

              <YesNoToggle
                label="Are you receiving WPRC newsletters?"
                value={formData.wprc.receivingNewsletters}
                onChange={v => updateWprc('receivingNewsletters', v)}
                required
              />

              {formData.wprc.receivingNewsletters === 'yes' && (
                <LikertScale
                  label="Effectiveness of newsletters"
                  value={formData.wprc.newsletterEffectiveness}
                  onChange={v => updateWprc('newsletterEffectiveness', v as 1 | 2 | 3 | 4 | 5)}
                />
              )}

              <div className="space-y-2">
                <Label htmlFor="newsletterExpectations">Newsletter expectations / suggestions</Label>
                <Textarea
                  id="newsletterExpectations"
                  value={formData.wprc.newsletterExpectations}
                  onChange={e => updateWprc('newsletterExpectations', e.target.value)}
                  placeholder="What would you like to see in newsletters?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wprcFeedback">Additional Feedback</Label>
                <Textarea
                  id="wprcFeedback"
                  value={formData.wprc.feedback}
                  onChange={e => updateWprc('feedback', e.target.value)}
                  placeholder="Share any additional feedback about WPRC..."
                  rows={4}
                />
              </div>
            </div>
          </SectionCard>
        );

      case 'review':
        return (
          <SectionCard title="Review & Submit" icon={<Send className="h-5 w-5" />}>
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Participant</h4>
                <p className="text-sm text-muted-foreground">
                  {formData.participantInfo.name} • {formData.participantInfo.brand} • {formData.participantInfo.dealershipCode}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{formData.elsaPro.satisfaction}</p>
                  <p className="text-xs text-muted-foreground">ElsaPro</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{formData.odis.satisfaction}</p>
                  <p className="text-xs text-muted-foreground">ODIS</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{formData.interactiveDiagnosis.overallExperience}</p>
                  <p className="text-xs text-muted-foreground">Interactive</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{formData.toolsEquipment.toolsQuality}</p>
                  <p className="text-xs text-muted-foreground">Tools</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{formData.wprc.responseSpeed}</p>
                  <p className="text-xs text-muted-foreground">WPRC</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  By submitting this survey, you confirm that all information provided is accurate 
                  and reflects your genuine experience with the workshop systems.
                </p>
              </div>
            </div>
          </SectionCard>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workshop System Survey"
        description="Share your feedback on ElsaPro, ODIS, and other workshop systems"
        actions={
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
        }
      />

      {/* Progress Steps */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center justify-between overflow-x-auto">
          {steps.map((step, index) => (
            <button
              key={step.key}
              onClick={() => setCurrentStep(step.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                currentStep === step.key
                  ? 'bg-primary text-primary-foreground'
                  : index < currentStepIndex
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {step.icon}
              <span className="hidden md:inline">{step.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep === 'review' ? (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Survey'}
          </Button>
        ) : (
          <Button onClick={goNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
