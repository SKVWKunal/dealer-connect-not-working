import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { warrantySurveyService } from '@/services/warrantySurvey';
import { WarrantySurveyStats } from '@/types/warrantySurvey';
import { FileSpreadsheet, TrendingUp, Star, Plus } from 'lucide-react';

export default function WarrantySurveyDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<WarrantySurveyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await warrantySurveyService.getStats();
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warranty Survey"
        description="Collect and analyze warranty process feedback"
        actions={<Button onClick={() => navigate('/warranty-survey/submit')}><Plus className="h-4 w-4 mr-2" />New Survey</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Submissions" value={stats?.totalSubmissions || 0} icon={FileSpreadsheet} />
        <StatCard title="Completion Rate" value={`${(stats?.completionRate || 0).toFixed(1)}%`} icon={TrendingUp} />
        <StatCard title="Claim Process" value={(stats?.averageSatisfaction.claimProcess || 0).toFixed(1)} icon={Star} />
        <StatCard title="Overall Satisfaction" value={(stats?.averageSatisfaction.overall || 0).toFixed(1)} icon={Star} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentSubmissions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No surveys submitted yet.</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentSubmissions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{s.participantInfo.name}</p>
                    <p className="text-sm text-muted-foreground">{s.participantInfo.dealershipCode} • {s.participantInfo.brand}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${s.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
