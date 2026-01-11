import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { pccService } from '@/services/pcc';
import { Brand, PCCTopic, PCCSubtopic, PCCConditionType } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, AlertCircle, Upload, X, Info } from 'lucide-react';
import {
  isValidVIN,
  isValidRegistrationNo,
  isValidPartNumber,
  isValidDISSTicket,
  isPositiveInteger,
  isDateInPast,
  isDateNotFuture,
  isValidFileSize
} from '@/utils/validation';

const MODELS = {
  volkswagen: ['Virtus', 'Taigun', 'Tiguan', 'Polo', 'Vento'],
  skoda: ['Slavia', 'Kushaq', 'Kodiaq', 'Octavia', 'Superb']
};

const SUBTOPICS: PCCSubtopic[] = ['engine', 'transmission', 'electrical', 'suspension', 'brakes', 'body', 'interior', 'other'];

// PCC Acceptance Criteria Configuration
const CONDITION_TYPES: { value: PCCConditionType; label: string; description: string }[] = [
  { value: 'warranty_cases', label: 'Warranty Cases', description: '≤ 2 years warranty period' },
  { value: 'post_warranty_cases', label: 'Post-Warranty Cases', description: '> 2 years warranty period' },
  { value: 'after_countermeasure', label: 'After Countermeasure', description: 'Cases after countermeasure applied' },
  { value: 'new_model_launch', label: 'New Model Launch', description: '≤ 3 months from date of sale' },
  { value: 'breakdown_cases', label: 'Breakdown Cases', description: 'Vehicle breakdown occurred' },
  { value: 'repeat_repairs', label: 'Repeat Repairs', description: 'Same VIN with ≥ 2 repairs' },
  { value: 'tpi_unavailable', label: 'TPI Not Available / Unsuccessful', description: 'TPI not available or repair unsuccessful' },
];

const ACCEPTANCE_CRITERIA = [
  { srNo: 1, warrantyPeriod: '≤ 2 years', conditionType: 'Warranty cases', minClaims: '≥ 5', faultCode: '1 identical fault code across all claims', repairWindow: 'Last 3 or 6 months', additional: '—' },
  { srNo: 2, warrantyPeriod: '> 2 years', conditionType: 'Post-warranty cases', minClaims: '≥ 10', faultCode: '1 identical fault code across all claims', repairWindow: 'Last 6 months', additional: '—' },
  { srNo: 3, warrantyPeriod: 'Any', conditionType: 'After countermeasure', minClaims: '≥ 3', faultCode: '1 identical fault code across all claims', repairWindow: 'Post countermeasure date', additional: '—' },
  { srNo: 4, warrantyPeriod: 'Any', conditionType: 'New model launch', minClaims: '≥ 3', faultCode: '1 identical fault code across all claims', repairWindow: '≤ 3 months from date of sale', additional: '—' },
  { srNo: 5, warrantyPeriod: 'Any', conditionType: 'Breakdown cases', minClaims: '≥ 3', faultCode: '1 identical fault code across all claims', repairWindow: 'No limit', additional: 'Breakdown flag = Yes' },
  { srNo: 6, warrantyPeriod: 'Any', conditionType: 'Repeat repairs', minClaims: '≥ 2', faultCode: '1 identical fault code', repairWindow: 'No limit', additional: 'Same VIN ≥ 2 repairs' },
  { srNo: 7, warrantyPeriod: 'Any', conditionType: 'TPI not available / TPI repair unsuccessful', minClaims: 'Not claim-based', faultCode: 'As observed', repairWindow: 'No limit', additional: 'TPI result = 0 or repair success = 0' },
];

interface FormData {
  brand: Brand | '';
  model: string;
  vin: string;
  registrationNo: string;
  productionDate: string;
  // Acceptance Criteria
  conditionType: PCCConditionType | '';
  warrantyPeriod: 'lte_2_years' | 'gt_2_years' | 'any' | '';
  numberOfClaims: string;
  faultCode: string;
  countermeasureDate: string;
  saleDate: string;
  numberOfRepairs: string;
  tpiResult: '' | '0' | '1';
  repairSuccess: '' | '0' | '1';
  // Other fields
  topic: PCCTopic;
  subtopic: PCCSubtopic | '';
  escalatedToBrand: boolean;
  escalationNotes: string;
  engineCode: string;
  gearboxCode: string;
  mileage: string;
  repairDate: string;
  dissTicketNo: string;
  warrantyClaimNo: string;
  partDescription: string;
  damagePartNumber: string;
  repeatedRepair: boolean;
  breakdown: boolean;
  declarationAccepted: boolean;
}

export default function SubmitPCC() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    brand: '',
    model: '',
    vin: '',
    registrationNo: '',
    productionDate: '',
    conditionType: '',
    warrantyPeriod: '',
    numberOfClaims: '',
    faultCode: '',
    countermeasureDate: '',
    saleDate: '',
    numberOfRepairs: '',
    tpiResult: '',
    repairSuccess: '',
    topic: 'dealer_pcc',
    subtopic: '',
    escalatedToBrand: false,
    escalationNotes: '',
    engineCode: '',
    gearboxCode: '',
    mileage: '',
    repairDate: '',
    dissTicketNo: '',
    warrantyClaimNo: '',
    partDescription: '',
    damagePartNumber: '',
    repeatedRepair: false,
    breakdown: false,
    declarationAccepted: false
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedReference, setSubmittedReference] = useState('');
  const [showCriteriaInfo, setShowCriteriaInfo] = useState(false);

  // Get the required criteria based on condition type
  const selectedCriteria = useMemo(() => {
    const conditionMap: Record<PCCConditionType, typeof ACCEPTANCE_CRITERIA[0]> = {
      warranty_cases: ACCEPTANCE_CRITERIA[0],
      post_warranty_cases: ACCEPTANCE_CRITERIA[1],
      after_countermeasure: ACCEPTANCE_CRITERIA[2],
      new_model_launch: ACCEPTANCE_CRITERIA[3],
      breakdown_cases: ACCEPTANCE_CRITERIA[4],
      repeat_repairs: ACCEPTANCE_CRITERIA[5],
      tpi_unavailable: ACCEPTANCE_CRITERIA[6],
    };
    return formData.conditionType ? conditionMap[formData.conditionType] : null;
  }, [formData.conditionType]);

  // Get minimum claims based on condition type
  const getMinClaims = (conditionType: PCCConditionType): number => {
    const minClaimsMap: Record<PCCConditionType, number> = {
      warranty_cases: 5,
      post_warranty_cases: 10,
      after_countermeasure: 3,
      new_model_launch: 3,
      breakdown_cases: 3,
      repeat_repairs: 2,
      tpi_unavailable: 0,
    };
    return minClaimsMap[conditionType];
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-set warranty period and breakdown flag based on condition type
      if (field === 'conditionType') {
        if (value === 'warranty_cases') {
          newData.warrantyPeriod = 'lte_2_years';
        } else if (value === 'post_warranty_cases') {
          newData.warrantyPeriod = 'gt_2_years';
        } else {
          newData.warrantyPeriod = 'any';
        }
        
        // Auto-set breakdown flag for breakdown cases
        if (value === 'breakdown_cases') {
          newData.breakdown = true;
        }
        
        // Auto-set repeated repair for repeat repairs
        if (value === 'repeat_repairs') {
          newData.repeatedRepair = true;
        }
      }
      
      return newData;
    });
    
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Vehicle Info
    if (!formData.brand) newErrors.brand = 'Brand is required';
    if (!formData.model) newErrors.model = 'Model is required';
    if (!formData.vin) {
      newErrors.vin = 'VIN is required';
    } else if (!isValidVIN(formData.vin)) {
      newErrors.vin = 'Invalid VIN format (17 alphanumeric characters)';
    }
    if (!formData.registrationNo) {
      newErrors.registrationNo = 'Registration No is required';
    } else if (!isValidRegistrationNo(formData.registrationNo)) {
      newErrors.registrationNo = 'Invalid registration format';
    }
    if (!formData.productionDate) {
      newErrors.productionDate = 'Production date is required';
    } else if (!isDateInPast(formData.productionDate)) {
      newErrors.productionDate = 'Production date must be in the past';
    }

    // Acceptance Criteria Validation
    if (!formData.conditionType) {
      newErrors.conditionType = 'Condition type is required';
    } else {
      const conditionType = formData.conditionType as PCCConditionType;
      const minClaims = getMinClaims(conditionType);
      
      // Validate number of claims (except for TPI unavailable)
      if (conditionType !== 'tpi_unavailable') {
        if (!formData.numberOfClaims) {
          newErrors.numberOfClaims = 'Number of claims is required';
        } else if (!isPositiveInteger(formData.numberOfClaims)) {
          newErrors.numberOfClaims = 'Must be a positive number';
        } else if (parseInt(formData.numberOfClaims) < minClaims) {
          newErrors.numberOfClaims = `Minimum ${minClaims} claims required for ${CONDITION_TYPES.find(c => c.value === conditionType)?.label}`;
        }
      }
      
      // Validate fault code
      if (!formData.faultCode) {
        newErrors.faultCode = 'Fault code is required';
      }
      
      // Condition-specific validations
      if (conditionType === 'after_countermeasure' && !formData.countermeasureDate) {
        newErrors.countermeasureDate = 'Countermeasure date is required';
      }
      
      if (conditionType === 'new_model_launch') {
        if (!formData.saleDate) {
          newErrors.saleDate = 'Sale date is required';
        } else {
          // Check if repair date is within 3 months of sale date
          const saleDate = new Date(formData.saleDate);
          const repairDate = formData.repairDate ? new Date(formData.repairDate) : new Date();
          const threeMonthsLater = new Date(saleDate);
          threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
          if (repairDate > threeMonthsLater) {
            newErrors.saleDate = 'Repair date must be within 3 months from sale date';
          }
        }
      }
      
      if (conditionType === 'breakdown_cases' && !formData.breakdown) {
        newErrors.breakdown = 'Breakdown flag must be Yes for breakdown cases';
      }
      
      if (conditionType === 'repeat_repairs') {
        if (!formData.numberOfRepairs) {
          newErrors.numberOfRepairs = 'Number of repairs is required';
        } else if (parseInt(formData.numberOfRepairs) < 2) {
          newErrors.numberOfRepairs = 'Minimum 2 repairs required for the same VIN';
        }
      }
      
      if (conditionType === 'tpi_unavailable') {
        if (formData.tpiResult !== '0' && formData.repairSuccess !== '0') {
          newErrors.tpiResult = 'TPI result or repair success must be 0';
        }
      }
    }

    // Details
    if (!formData.subtopic) newErrors.subtopic = 'Subtopic is required';

    // Technical
    if (!formData.engineCode) newErrors.engineCode = 'Engine code is required';
    if (!formData.gearboxCode) newErrors.gearboxCode = 'Gearbox code is required';
    if (!formData.mileage) {
      newErrors.mileage = 'Mileage is required';
    } else if (!isPositiveInteger(formData.mileage)) {
      newErrors.mileage = 'Mileage must be a positive number';
    }
    if (!formData.repairDate) {
      newErrors.repairDate = 'Repair date is required';
    } else if (!isDateNotFuture(formData.repairDate)) {
      newErrors.repairDate = 'Repair date cannot be in the future';
    }

    // Complaint
    if (formData.dissTicketNo && !isValidDISSTicket(formData.dissTicketNo)) {
      newErrors.dissTicketNo = 'DISS Ticket must be numeric';
    }
    if (!formData.partDescription) newErrors.partDescription = 'Part description is required';
    if (!formData.damagePartNumber) {
      newErrors.damagePartNumber = 'Damage part number is required';
    } else if (!isValidPartNumber(formData.damagePartNumber)) {
      newErrors.damagePartNumber = 'Part number can only contain letters and numbers';
    }

    // Declaration
    if (!formData.declarationAccepted) {
      newErrors.declarationAccepted = 'You must accept the declaration';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const errorMessages: string[] = [];

    files.forEach(file => {
      if (attachments.length + validFiles.length >= 3) {
        errorMessages.push('Maximum 3 attachments allowed');
        return;
      }
      if (!isValidFileSize(file.size, 500)) {
        errorMessages.push(`${file.name} exceeds 500MB limit`);
        return;
      }
      validFiles.push(file);
    });

    if (errorMessages.length > 0) {
      setErrors(prev => ({ ...prev, attachments: errorMessages.join('. ') }));
    }

    setAttachments(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const submission = await pccService.create({
        dealerId: user?.dealerId || '',
        dealerCode: 'DLR001',
        dealerName: user?.dealerName || '',
        contactPerson: user?.name || '',
        email: user?.email || '',
        brand: formData.brand as Brand,
        model: formData.model,
        vin: formData.vin.toUpperCase(),
        registrationNo: formData.registrationNo.toUpperCase(),
        productionDate: formData.productionDate,
        conditionType: formData.conditionType as PCCConditionType,
        warrantyPeriod: formData.warrantyPeriod as 'lte_2_years' | 'gt_2_years' | 'any',
        numberOfClaims: parseInt(formData.numberOfClaims) || 0,
        faultCode: formData.faultCode.toUpperCase(),
        countermeasureDate: formData.countermeasureDate || undefined,
        saleDate: formData.saleDate || undefined,
        numberOfRepairs: formData.numberOfRepairs ? parseInt(formData.numberOfRepairs) : undefined,
        tpiResult: formData.tpiResult ? (parseInt(formData.tpiResult) as 0 | 1) : undefined,
        repairSuccess: formData.repairSuccess ? (parseInt(formData.repairSuccess) as 0 | 1) : undefined,
        topic: formData.topic,
        subtopic: formData.subtopic as PCCSubtopic,
        escalatedToBrand: formData.escalatedToBrand,
        escalationNotes: formData.escalationNotes,
        engineCode: formData.engineCode,
        gearboxCode: formData.gearboxCode,
        mileage: parseInt(formData.mileage),
        repairDate: formData.repairDate,
        dissTicketNo: formData.dissTicketNo,
        warrantyClaimNo: formData.warrantyClaimNo,
        partDescription: formData.partDescription,
        damagePartNumber: formData.damagePartNumber.toUpperCase(),
        repeatedRepair: formData.repeatedRepair,
        breakdown: formData.breakdown,
        attachments: attachments.map(file => ({
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        })),
        declarationAccepted: formData.declarationAccepted,
        createdBy: user?.id || ''
      });

      setSubmittedReference(submission.referenceNumber);
      setShowSuccessModal(true);
    } catch (error) {
      setErrors({ submit: 'Failed to submit PCC. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Submit PCC"
        description="Product Concern Capture submission form"
      />

      {errors.submit && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Dealer Info (Read-only) */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="form-section-title">Dealer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Dealer Name</Label>
                <p className="font-medium">{user?.dealerName || 'Premium Motors Delhi'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Contact Person</Label>
                <p className="font-medium">{user?.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Dealer Code</Label>
                <p className="font-medium">DLR001</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="form-section-title">Vehicle Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Select value={formData.brand} onValueChange={(v) => { updateField('brand', v as Brand); updateField('model', ''); }}>
                  <SelectTrigger className={errors.brand ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volkswagen">Volkswagen</SelectItem>
                    <SelectItem value="skoda">Skoda</SelectItem>
                  </SelectContent>
                </Select>
                {errors.brand && <p className="text-xs text-destructive">{errors.brand}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Select value={formData.model} onValueChange={(v) => updateField('model', v)} disabled={!formData.brand}>
                  <SelectTrigger className={errors.model ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.brand && MODELS[formData.brand].map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.model && <p className="text-xs text-destructive">{errors.model}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vin">VIN *</Label>
                <Input
                  id="vin"
                  value={formData.vin}
                  onChange={(e) => updateField('vin', e.target.value.toUpperCase())}
                  placeholder="17-character VIN"
                  maxLength={17}
                  className={errors.vin ? 'border-destructive' : ''}
                />
                {errors.vin && <p className="text-xs text-destructive">{errors.vin}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationNo">Registration No *</Label>
                <Input
                  id="registrationNo"
                  value={formData.registrationNo}
                  onChange={(e) => updateField('registrationNo', e.target.value.toUpperCase())}
                  placeholder="e.g., DL01AB1234"
                  className={errors.registrationNo ? 'border-destructive' : ''}
                />
                {errors.registrationNo && <p className="text-xs text-destructive">{errors.registrationNo}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="productionDate">Production Date *</Label>
                <Input
                  id="productionDate"
                  type="date"
                  value={formData.productionDate}
                  onChange={(e) => updateField('productionDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={errors.productionDate ? 'border-destructive' : ''}
                />
                {errors.productionDate && <p className="text-xs text-destructive">{errors.productionDate}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PCC Acceptance Criteria */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="form-section-title mb-0">PCC Acceptance Criteria</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCriteriaInfo(true)}
              >
                <Info className="h-4 w-4 mr-1" />
                View Criteria Table
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="conditionType">Condition Type *</Label>
                <Select 
                  value={formData.conditionType} 
                  onValueChange={(v) => updateField('conditionType', v as PCCConditionType)}
                >
                  <SelectTrigger className={errors.conditionType ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select condition type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_TYPES.map(ct => (
                      <SelectItem key={ct.value} value={ct.value}>
                        {ct.label} - {ct.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.conditionType && <p className="text-xs text-destructive">{errors.conditionType}</p>}
              </div>

              {selectedCriteria && (
                <div className="md:col-span-2 p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-1">Requirements for {selectedCriteria.conditionType}:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Warranty Period: {selectedCriteria.warrantyPeriod}</li>
                    <li>Minimum Claims: {selectedCriteria.minClaims}</li>
                    <li>Fault Code: {selectedCriteria.faultCode}</li>
                    <li>Repair Date Window: {selectedCriteria.repairWindow}</li>
                    {selectedCriteria.additional !== '—' && <li>Additional: {selectedCriteria.additional}</li>}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="warrantyPeriod">Warranty Period *</Label>
                <Select 
                  value={formData.warrantyPeriod} 
                  onValueChange={(v) => updateField('warrantyPeriod', v as 'lte_2_years' | 'gt_2_years' | 'any')}
                  disabled={formData.conditionType === 'warranty_cases' || formData.conditionType === 'post_warranty_cases'}
                >
                  <SelectTrigger className={errors.warrantyPeriod ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select warranty period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lte_2_years">≤ 2 years</SelectItem>
                    <SelectItem value="gt_2_years">&gt; 2 years</SelectItem>
                    <SelectItem value="any">Any</SelectItem>
                  </SelectContent>
                </Select>
                {errors.warrantyPeriod && <p className="text-xs text-destructive">{errors.warrantyPeriod}</p>}
              </div>

              {formData.conditionType !== 'tpi_unavailable' && (
                <div className="space-y-2">
                  <Label htmlFor="numberOfClaims">
                    Number of Claims * 
                    {formData.conditionType && (
                      <span className="text-muted-foreground ml-1">
                        (Min: {getMinClaims(formData.conditionType as PCCConditionType)})
                      </span>
                    )}
                  </Label>
                  <Input
                    id="numberOfClaims"
                    type="number"
                    value={formData.numberOfClaims}
                    onChange={(e) => updateField('numberOfClaims', e.target.value)}
                    placeholder="Enter number of claims"
                    min="1"
                    className={errors.numberOfClaims ? 'border-destructive' : ''}
                  />
                  {errors.numberOfClaims && <p className="text-xs text-destructive">{errors.numberOfClaims}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="faultCode">Fault Code *</Label>
                <Input
                  id="faultCode"
                  value={formData.faultCode}
                  onChange={(e) => updateField('faultCode', e.target.value.toUpperCase())}
                  placeholder="e.g., P0299"
                  className={errors.faultCode ? 'border-destructive' : ''}
                />
                {errors.faultCode && <p className="text-xs text-destructive">{errors.faultCode}</p>}
              </div>

              {formData.conditionType === 'after_countermeasure' && (
                <div className="space-y-2">
                  <Label htmlFor="countermeasureDate">Countermeasure Date *</Label>
                  <Input
                    id="countermeasureDate"
                    type="date"
                    value={formData.countermeasureDate}
                    onChange={(e) => updateField('countermeasureDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={errors.countermeasureDate ? 'border-destructive' : ''}
                  />
                  {errors.countermeasureDate && <p className="text-xs text-destructive">{errors.countermeasureDate}</p>}
                </div>
              )}

              {formData.conditionType === 'new_model_launch' && (
                <div className="space-y-2">
                  <Label htmlFor="saleDate">Sale Date *</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) => updateField('saleDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={errors.saleDate ? 'border-destructive' : ''}
                  />
                  {errors.saleDate && <p className="text-xs text-destructive">{errors.saleDate}</p>}
                </div>
              )}

              {formData.conditionType === 'repeat_repairs' && (
                <div className="space-y-2">
                  <Label htmlFor="numberOfRepairs">Number of Repairs on Same VIN *</Label>
                  <Input
                    id="numberOfRepairs"
                    type="number"
                    value={formData.numberOfRepairs}
                    onChange={(e) => updateField('numberOfRepairs', e.target.value)}
                    placeholder="Minimum 2"
                    min="2"
                    className={errors.numberOfRepairs ? 'border-destructive' : ''}
                  />
                  {errors.numberOfRepairs && <p className="text-xs text-destructive">{errors.numberOfRepairs}</p>}
                </div>
              )}

              {formData.conditionType === 'tpi_unavailable' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tpiResult">TPI Result</Label>
                    <Select 
                      value={formData.tpiResult} 
                      onValueChange={(v) => updateField('tpiResult', v as '' | '0' | '1')}
                    >
                      <SelectTrigger className={errors.tpiResult ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select TPI result" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 - Not Available</SelectItem>
                        <SelectItem value="1">1 - Available</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.tpiResult && <p className="text-xs text-destructive">{errors.tpiResult}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="repairSuccess">Repair Success</Label>
                    <Select 
                      value={formData.repairSuccess} 
                      onValueChange={(v) => updateField('repairSuccess', v as '' | '0' | '1')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select repair success" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 - Unsuccessful</SelectItem>
                        <SelectItem value="1">1 - Successful</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details & Classification */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="form-section-title">Details & Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Select value={formData.topic} onValueChange={(v) => updateField('topic', v as PCCTopic)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dealer_pcc">Dealer PCC</SelectItem>
                    <SelectItem value="long_term_pcc">Long Term PCC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtopic">Subtopic *</Label>
                <Select value={formData.subtopic} onValueChange={(v) => updateField('subtopic', v as PCCSubtopic)}>
                  <SelectTrigger className={errors.subtopic ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select subtopic" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBTOPICS.map(st => (
                      <SelectItem key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subtopic && <p className="text-xs text-destructive">{errors.subtopic}</p>}
              </div>

              <div className="md:col-span-2 flex items-center space-x-2">
                <Checkbox
                  id="escalatedToBrand"
                  checked={formData.escalatedToBrand}
                  onCheckedChange={(checked) => {
                    updateField('escalatedToBrand', !!checked);
                    if (checked) setShowEscalationModal(true);
                  }}
                />
                <Label htmlFor="escalatedToBrand">Escalated to Brand</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engine & Technical */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="form-section-title">Engine & Technical Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="engineCode">Engine Code *</Label>
                <Input
                  id="engineCode"
                  value={formData.engineCode}
                  onChange={(e) => updateField('engineCode', e.target.value)}
                  placeholder="e.g., CZDA"
                  className={errors.engineCode ? 'border-destructive' : ''}
                />
                {errors.engineCode && <p className="text-xs text-destructive">{errors.engineCode}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gearboxCode">Gearbox Code *</Label>
                <Input
                  id="gearboxCode"
                  value={formData.gearboxCode}
                  onChange={(e) => updateField('gearboxCode', e.target.value)}
                  placeholder="e.g., DQ200"
                  className={errors.gearboxCode ? 'border-destructive' : ''}
                />
                {errors.gearboxCode && <p className="text-xs text-destructive">{errors.gearboxCode}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage (km) *</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => updateField('mileage', e.target.value)}
                  placeholder="e.g., 25000"
                  min="1"
                  className={errors.mileage ? 'border-destructive' : ''}
                />
                {errors.mileage && <p className="text-xs text-destructive">{errors.mileage}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="repairDate">Repair Date *</Label>
                <Input
                  id="repairDate"
                  type="date"
                  value={formData.repairDate}
                  onChange={(e) => updateField('repairDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={errors.repairDate ? 'border-destructive' : ''}
                />
                {errors.repairDate && <p className="text-xs text-destructive">{errors.repairDate}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complaint & Breakdown */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="form-section-title">Complaint & Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dissTicketNo">DISS Ticket No</Label>
                <Input
                  id="dissTicketNo"
                  value={formData.dissTicketNo}
                  onChange={(e) => updateField('dissTicketNo', e.target.value.replace(/\D/g, ''))}
                  placeholder="Numeric only"
                  className={errors.dissTicketNo ? 'border-destructive' : ''}
                />
                {errors.dissTicketNo && <p className="text-xs text-destructive">{errors.dissTicketNo}</p>}
                {formData.dissTicketNo && isValidDISSTicket(formData.dissTicketNo) && (
                  <a href={`#ticket-${formData.dissTicketNo}`} className="text-xs text-primary hover:underline">
                    View Ticket
                  </a>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="warrantyClaimNo">Warranty Claim No</Label>
                <Input
                  id="warrantyClaimNo"
                  value={formData.warrantyClaimNo}
                  onChange={(e) => updateField('warrantyClaimNo', e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="partDescription">Part Description *</Label>
                <Textarea
                  id="partDescription"
                  value={formData.partDescription}
                  onChange={(e) => updateField('partDescription', e.target.value)}
                  placeholder="Describe the affected part"
                  className={errors.partDescription ? 'border-destructive' : ''}
                />
                {errors.partDescription && <p className="text-xs text-destructive">{errors.partDescription}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="damagePartNumber">Damage Part Number *</Label>
                <Input
                  id="damagePartNumber"
                  value={formData.damagePartNumber}
                  onChange={(e) => updateField('damagePartNumber', e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                  placeholder="A-Z, 0-9 only"
                  className={errors.damagePartNumber ? 'border-destructive' : ''}
                />
                {errors.damagePartNumber && <p className="text-xs text-destructive">{errors.damagePartNumber}</p>}
              </div>

              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="repeatedRepair"
                    checked={formData.repeatedRepair}
                    onCheckedChange={(checked) => updateField('repeatedRepair', !!checked)}
                    disabled={formData.conditionType === 'repeat_repairs'}
                  />
                  <Label htmlFor="repeatedRepair">Repeated Repair</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="breakdown"
                    checked={formData.breakdown}
                    onCheckedChange={(checked) => updateField('breakdown', !!checked)}
                    disabled={formData.conditionType === 'breakdown_cases'}
                  />
                  <Label htmlFor="breakdown">Breakdown</Label>
                  {errors.breakdown && <span className="text-xs text-destructive">{errors.breakdown}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="form-section-title">Attachments</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload up to 3 files (max 500MB each)
            </p>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <input
                  type="file"
                  id="attachments"
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                  disabled={attachments.length >= 3}
                />
                <label
                  htmlFor="attachments"
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  Click to upload files
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <span className="text-xs text-muted-foreground mx-2">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 hover:bg-background rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.attachments && (
                <p className="text-xs text-destructive">{errors.attachments}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Declaration */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="declaration"
                checked={formData.declarationAccepted}
                onCheckedChange={(checked) => updateField('declarationAccepted', !!checked)}
                className={errors.declarationAccepted ? 'border-destructive' : ''}
              />
              <div>
                <Label htmlFor="declaration" className="text-sm">
                  I declare that all information provided is accurate and complete. I understand that 
                  false or misleading information may result in rejection of this submission.
                </Label>
                {errors.declarationAccepted && (
                  <p className="text-xs text-destructive mt-1">{errors.declarationAccepted}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit PCC'}
          </Button>
        </div>
      </form>

      {/* Criteria Info Dialog */}
      <Dialog open={showCriteriaInfo} onOpenChange={setShowCriteriaInfo}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PCC Acceptance Criteria</DialogTitle>
            <DialogDescription>
              Reference table for Dealer PCC submission requirements
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Sr.</TableHead>
                  <TableHead>Warranty Period</TableHead>
                  <TableHead>Condition Type</TableHead>
                  <TableHead>Min. Claims</TableHead>
                  <TableHead>Fault Code Requirement</TableHead>
                  <TableHead>Repair Date Window</TableHead>
                  <TableHead>Additional</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ACCEPTANCE_CRITERIA.map((criteria) => (
                  <TableRow key={criteria.srNo}>
                    <TableCell className="font-medium">{criteria.srNo}</TableCell>
                    <TableCell>{criteria.warrantyPeriod}</TableCell>
                    <TableCell>{criteria.conditionType}</TableCell>
                    <TableCell>{criteria.minClaims}</TableCell>
                    <TableCell className="text-xs">{criteria.faultCode}</TableCell>
                    <TableCell className="text-xs">{criteria.repairWindow}</TableCell>
                    <TableCell className="text-xs">{criteria.additional}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCriteriaInfo(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalation Notes Modal */}
      <Dialog open={showEscalationModal} onOpenChange={setShowEscalationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalation Notes</DialogTitle>
            <DialogDescription>
              Please provide details about why this issue is being escalated to the brand.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={formData.escalationNotes}
            onChange={(e) => updateField('escalationNotes', e.target.value)}
            placeholder="Enter escalation details..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEscalationModal(false);
              updateField('escalatedToBrand', false);
              updateField('escalationNotes', '');
            }}>
              Cancel
            </Button>
            <Button onClick={() => setShowEscalationModal(false)}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </div>
            <DialogTitle className="text-center">PCC Submitted Successfully</DialogTitle>
            <DialogDescription className="text-center">
              Your PCC submission has been received and is being processed.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Reference Number</p>
            <p className="text-2xl font-bold text-primary">{submittedReference}</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => navigate('/pcc/track')}>
              Track Status
            </Button>
            <Button onClick={() => {
              setShowSuccessModal(false);
              navigate('/dashboard');
            }}>
              Go to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
