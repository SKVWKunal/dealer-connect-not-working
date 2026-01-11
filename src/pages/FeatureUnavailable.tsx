import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Settings, ArrowLeft } from 'lucide-react';

export default function FeatureUnavailable() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Feature Unavailable</h1>
          <p className="text-muted-foreground mb-6">
            This module is currently disabled. Please contact your administrator if you 
            believe you should have access to this feature.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            {isSuperAdmin() && (
              <Button onClick={() => navigate('/modules')}>
                <Settings className="h-4 w-4 mr-2" />
                Module Management
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
