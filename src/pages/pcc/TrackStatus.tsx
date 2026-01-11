import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pccService } from '@/services/pcc';
import { PCCSubmission } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Car,
  Wrench,
  Calendar
} from 'lucide-react';

export default function TrackStatus() {
  const [searchParams] = useSearchParams();
  const [referenceNumber, setReferenceNumber] = useState(searchParams.get('ref') || '');
  const [submission, setSubmission] = useState<PCCSubmission | null>(null);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchParams.get('ref')) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    if (!referenceNumber.trim()) {
      setError('Please enter a reference number');
      return;
    }

    setIsSearching(true);
    setError('');
    setSubmission(null);

    const result = await pccService.getByReference(referenceNumber.trim().toUpperCase());

    if (result) {
      setSubmission(result);
    } else {
      setError('No submission found with this reference number');
    }

    setIsSearching(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'under_review':
      case 'submitted':
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Your submission is in queue for review by the manufacturer team.';
      case 'under_review':
        return 'A team member is currently reviewing your submission.';
      case 'more_info_required':
        return 'Please provide additional information as requested.';
      case 'approved':
        return 'Your PCC has been approved. No further action required.';
      case 'rejected':
        return 'Your PCC has been rejected. Please review the feedback.';
      default:
        return 'Status pending...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Track Status"
        description="Enter your PCC reference number to view the current status"
      />

      {/* Search Box */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="reference" className="sr-only">Reference Number</Label>
              <Input
                id="reference"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                placeholder="Enter reference number (e.g., PCC-IN-2024-1001)"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Searching...' : 'Track'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {submission && (
        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{submission.referenceNumber}</CardTitle>
                <StatusBadge status={submission.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                {getStatusIcon(submission.status)}
                <div>
                  <p className="font-medium">Next Expected Action</p>
                  <p className="text-sm text-muted-foreground">{getNextAction(submission.status)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vehicle Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand</span>
                  <span className="font-medium capitalize">{submission.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model</span>
                  <span className="font-medium">{submission.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VIN</span>
                  <span className="font-medium font-mono text-sm">{submission.vin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registration</span>
                  <span className="font-medium">{submission.registrationNo}</span>
                </div>
              </CardContent>
            </Card>

            {/* Issue Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Issue Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium capitalize">{submission.subtopic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Part Number</span>
                  <span className="font-medium font-mono">{submission.damagePartNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mileage</span>
                  <span className="font-medium">{submission.mileage.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Breakdown</span>
                  <span className="font-medium">{submission.breakdown ? 'Yes' : 'No'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {submission.statusHistory.map((entry, index) => (
                  <div key={index} className="flex gap-4 pb-6 last:pb-0">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ${
                        index === submission.statusHistory.length - 1 
                          ? 'bg-primary' 
                          : 'bg-muted-foreground/30'
                      }`} />
                      {index < submission.statusHistory.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-1" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={entry.status} />
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.changedAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* More Info Required Action */}
          {submission.status === 'more_info_required' && (
            <Alert className="border-warning bg-warning/10">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertDescription>
                <span className="font-medium">Action Required:</span>{' '}
                {submission.statusHistory[submission.statusHistory.length - 1]?.notes || 
                  'Please provide additional information to proceed with your submission.'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Empty State */}
      {!submission && !error && !isSearching && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Track Your PCC Submission</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Enter the reference number you received after submitting your PCC to view 
                the current status and timeline.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
