import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { pccService } from '@/services/pcc';
import { exportService } from '@/services/export';
import { PCCSubmission, PCCStatus } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Download, 
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  Filter
} from 'lucide-react';

const STATUS_OPTIONS: { value: PCCStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'more_info_required', label: 'More Info Required' }
];

export default function ManagePCC() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<PCCSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<PCCSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PCCStatus | 'all'>('all');
  
  // Status Update Modal
  const [selectedSubmission, setSelectedSubmission] = useState<PCCSubmission | null>(null);
  const [newStatus, setNewStatus] = useState<PCCStatus>('under_review');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchTerm, statusFilter]);

  const loadSubmissions = async () => {
    setIsLoading(true);
    const data = await pccService.getAll();
    setSubmissions(data.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
    setIsLoading(false);
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.referenceNumber.toLowerCase().includes(term) ||
        s.dealerName.toLowerCase().includes(term) ||
        s.vin.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    
    setFilteredSubmissions(filtered);
  };

  const handleStatusUpdate = async () => {
    if (!selectedSubmission) return;
    
    setIsUpdating(true);
    await pccService.updateStatus(selectedSubmission.id, newStatus, statusNotes);
    await loadSubmissions();
    setSelectedSubmission(null);
    setStatusNotes('');
    setIsUpdating(false);
  };

  const handleExport = async () => {
    await exportService.exportToCSV(
      filteredSubmissions,
      [
        { key: 'referenceNumber', header: 'Reference Number' },
        { key: 'dealerName', header: 'Dealer Name' },
        { key: 'brand', header: 'Brand' },
        { key: 'model', header: 'Model' },
        { key: 'vin', header: 'VIN' },
        { key: 'subtopic', header: 'Category' },
        { key: 'status', header: 'Status' },
        { key: 'createdAt', header: 'Submitted Date' }
      ],
      { filename: 'pcc_submissions', format: 'csv', module: 'dealer_pcc' }
    );
  };

  const openStatusModal = (submission: PCCSubmission, action: 'approve' | 'reject' | 'info' | 'review') => {
    setSelectedSubmission(submission);
    switch (action) {
      case 'approve':
        setNewStatus('approved');
        break;
      case 'reject':
        setNewStatus('rejected');
        break;
      case 'info':
        setNewStatus('more_info_required');
        break;
      case 'review':
        setNewStatus('under_review');
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Manage PCC Submissions"
        description="Review and process dealer PCC submissions"
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by reference, dealer, or VIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="status" className="sr-only">Status Filter</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PCCStatus | 'all')}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Dealer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No submissions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map(submission => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.referenceNumber}</TableCell>
                    <TableCell>{submission.dealerName}</TableCell>
                    <TableCell>
                      <span className="capitalize">{submission.brand}</span> {submission.model}
                    </TableCell>
                    <TableCell className="capitalize">{submission.subtopic}</TableCell>
                    <TableCell>
                      <StatusBadge status={submission.status} />
                    </TableCell>
                    <TableCell>
                      {new Date(submission.createdAt).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {submission.status !== 'approved' && submission.status !== 'rejected' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-success hover:text-success"
                              title="Approve"
                              onClick={() => openStatusModal(submission, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              title="Reject"
                              onClick={() => openStatusModal(submission, 'reject')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-warning hover:text-warning"
                              title="Request More Info"
                              onClick={() => openStatusModal(submission, 'info')}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Status Update Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newStatus === 'approved' && 'Approve Submission'}
              {newStatus === 'rejected' && 'Reject Submission'}
              {newStatus === 'more_info_required' && 'Request More Information'}
              {newStatus === 'under_review' && 'Mark as Under Review'}
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission?.referenceNumber} - {selectedSubmission?.dealerName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">
                {newStatus === 'more_info_required' ? 'What information is needed? *' : 'Notes (optional)'}
              </Label>
              <Textarea
                id="notes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder={
                  newStatus === 'more_info_required' 
                    ? 'Describe what additional information is required...'
                    : 'Add any notes about this decision...'
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdating || (newStatus === 'more_info_required' && !statusNotes.trim())}
              variant={newStatus === 'rejected' ? 'destructive' : 'default'}
            >
              {isUpdating ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
