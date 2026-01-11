import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import { ModuleKey } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  FileText, 
  Calendar, 
  Users, 
  FileSpreadsheet, 
  Shield,
  AlertTriangle,
  Clock
} from 'lucide-react';

const MODULE_ICONS: Record<ModuleKey, React.ReactNode> = {
  dealer_pcc: <FileText className="h-6 w-6" />,
  api_registration: <Calendar className="h-6 w-6" />,
  mt_meet: <Users className="h-6 w-6" />,
  workshop_survey: <FileSpreadsheet className="h-6 w-6" />,
  warranty_survey: <FileSpreadsheet className="h-6 w-6" />,
  technical_awareness_survey: <FileSpreadsheet className="h-6 w-6" />
};

export default function ModuleManagement() {
  const { user } = useAuth();
  const { flags, setModuleFlag, getModuleInfo } = useFeatureFlags();
  
  const [pendingChange, setPendingChange] = useState<{
    moduleKey: ModuleKey;
    enabled: boolean;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = (moduleKey: ModuleKey, enabled: boolean) => {
    // Prevent disabling PCC module
    if (moduleKey === 'dealer_pcc' && !enabled) {
      return;
    }
    setPendingChange({ moduleKey, enabled });
  };

  const confirmChange = async () => {
    if (!pendingChange || !user) return;
    
    setIsUpdating(true);
    await setModuleFlag(pendingChange.moduleKey, pendingChange.enabled, user.id, reason);
    setIsUpdating(false);
    setPendingChange(null);
    setReason('');
  };

  const moduleKeys = Object.keys(flags) as ModuleKey[];

  return (
    <div>
      <PageHeader
        title="Module Management"
        description="Enable or disable application modules. Changes take effect immediately."
      />

      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Only Super Admins can manage module availability. All changes are logged for audit purposes.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {moduleKeys.map(moduleKey => {
          const flag = flags[moduleKey];
          const info = getModuleInfo(moduleKey);
          const isPCC = moduleKey === 'dealer_pcc';
          
          return (
            <Card key={moduleKey} className={!flag.enabled ? 'opacity-60' : ''}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${flag.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {MODULE_ICONS[moduleKey]}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {info.name}
                        {isPCC && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Core Module
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{info.description}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={(checked) => handleToggle(moduleKey, checked)}
                    disabled={isPCC}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      Last modified: {new Date(flag.lastModifiedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {flag.reason && (
                    <div>
                      <span className="text-muted-foreground">Reason: {flag.reason}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <Dialog open={!!pendingChange} onOpenChange={(open) => !open && setPendingChange(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Module {pendingChange?.enabled ? 'Activation' : 'Deactivation'}
            </DialogTitle>
            <DialogDescription>
              You are about to {pendingChange?.enabled ? 'enable' : 'disable'} the{' '}
              <strong>{pendingChange && getModuleInfo(pendingChange.moduleKey).name}</strong> module.
              {!pendingChange?.enabled && (
                <span className="block mt-2 text-warning">
                  Disabling this module will hide it from all users and prevent access to its features.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for change (optional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for this change..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingChange(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmChange}
              disabled={isUpdating}
              variant={pendingChange?.enabled ? 'default' : 'destructive'}
            >
              {isUpdating ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
