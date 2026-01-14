import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { apiRegistrationService } from '@/services/apiRegistration';
import { EventDashboardStats } from '@/types/apiRegistration';
import { Calendar, Users, CheckCircle, TrendingUp, Plus } from 'lucide-react';

export default function APIRegistration() {
  const [stats, setStats] = useState<EventDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await apiRegistrationService.getDashboardStats();
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
        title="API Registration"
        description="Manage event registrations and participant tracking"
        actions={<Button><Plus className="h-4 w-4 mr-2" />Create Event</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Events" value={stats?.totalEvents || 0} icon={<Calendar className="h-5 w-5" />} />
        <StatCard title="Upcoming Events" value={stats?.upcomingEvents || 0} icon={<Calendar className="h-5 w-5" />} trend="up" />
        <StatCard title="Total Participants" value={stats?.totalParticipants || 0} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Attendance Rate" value={`${(stats?.attendanceRate || 0).toFixed(1)}%`} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentRegistrations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No registrations yet. Create an event to get started.</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentRegistrations.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.dealerCode} • {p.designation}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${p.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.status}
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
