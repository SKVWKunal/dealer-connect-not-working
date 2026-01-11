import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { pccService } from '@/services/pcc';
import { Brand, PCCTopic, PCCSubtopic } from '@/types';
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
import { CheckCircle, AlertCircle, Upload, X } from 'lucide-react';
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

interface FormData {
  brand: Brand | '';
  model: string;
  vin: string;
  registrationNo: string;
  productionDate: string;
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

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        dealerCode: 'DLR001', // Would come from user context
        dealerName: user?.dealerName || '',
        contactPerson: user?.name || '',
        email: user?.email || '',
        brand: formData.brand as Brand,
        model: formData.model,
        vin: formData.vin.toUpperCase(),
        registrationNo: formData.registrationNo.toUpperCase(),
        productionDate: formData.productionDate,
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
                  />
                  <Label htmlFor="repeatedRepair">Repeated Repair</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="breakdown"
                    checked={formData.breakdown}
                    onCheckedChange={(checked) => updateField('breakdown', !!checked)}
                  />
                  <Label htmlFor="breakdown">Breakdown</Label>
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
