import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { accessRequestStorage } from '@/services/storage';
import { DealerRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { isValidEmail, isValidPhone } from '@/utils/validation';

const ROLES: { value: DealerRole; label: string }[] = [
  { value: 'master_technician', label: 'Master Technician' },
  { value: 'service_manager', label: 'Service Manager' },
  { value: 'service_head', label: 'Service Head' },
  { value: 'warranty_manager', label: 'Warranty Manager' }
];

interface FormData {
  dealerCode: string;
  dealerName: string;
  city: string;
  contactPerson: string;
  email: string;
  phone: string;
  employeeId: string;
  requestedRole: DealerRole | '';
}

export default function RequestAccess() {
  const [formData, setFormData] = useState<FormData>({
    dealerCode: '',
    dealerName: '',
    city: '',
    contactPerson: '',
    email: '',
    phone: '',
    employeeId: '',
    requestedRole: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (!formData.dealerCode.trim()) newErrors.dealerCode = 'Dealer code is required';
    if (!formData.dealerName.trim()) newErrors.dealerName = 'Dealer name is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number (10 digits)';
    }
    
    if (!formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!formData.requestedRole) newErrors.requestedRole = 'Role is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    await accessRequestStorage.create({
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dealerCode: formData.dealerCode,
      dealerName: formData.dealerName,
      city: formData.city,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      employeeId: formData.employeeId,
      requestedRole: formData.requestedRole as DealerRole,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Request Submitted</h1>
          <p className="text-muted-foreground mb-6">
            Your access request has been submitted successfully. A manufacturer administrator 
            will review your request and send you an invitation if approved.
          </p>
          <Link to="/login">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Request Access</h1>
          <p className="text-muted-foreground mt-1">
            Submit your details to request portal access
          </p>
        </div>

        <div className="card-form">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dealerCode">Dealer Code *</Label>
                <Input
                  id="dealerCode"
                  value={formData.dealerCode}
                  onChange={(e) => updateField('dealerCode', e.target.value)}
                  placeholder="e.g., DLR001"
                  className={errors.dealerCode ? 'border-destructive' : ''}
                />
                {errors.dealerCode && <p className="text-xs text-destructive">{errors.dealerCode}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="e.g., New Delhi"
                  className={errors.city ? 'border-destructive' : ''}
                />
                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dealerName">Dealer Name *</Label>
              <Input
                id="dealerName"
                value={formData.dealerName}
                onChange={(e) => updateField('dealerName', e.target.value)}
                placeholder="e.g., Premium Motors Delhi"
                className={errors.dealerName ? 'border-destructive' : ''}
              />
              {errors.dealerName && <p className="text-xs text-destructive">{errors.dealerName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Your Name *</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => updateField('contactPerson', e.target.value)}
                placeholder="Full name"
                className={errors.contactPerson ? 'border-destructive' : ''}
              />
              {errors.contactPerson && <p className="text-xs text-destructive">{errors.contactPerson}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="you@dealer.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => updateField('employeeId', e.target.value)}
                  placeholder="Your employee ID"
                  className={errors.employeeId ? 'border-destructive' : ''}
                />
                {errors.employeeId && <p className="text-xs text-destructive">{errors.employeeId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Requested Role *</Label>
                <Select 
                  value={formData.requestedRole} 
                  onValueChange={(v) => updateField('requestedRole', v as DealerRole)}
                >
                  <SelectTrigger className={errors.requestedRole ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.requestedRole && <p className="text-xs text-destructive">{errors.requestedRole}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              <ArrowLeft className="h-4 w-4 inline mr-1" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
