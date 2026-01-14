import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { mtMeetService } from '@/services/mtMeet';
import { MTMeetDashboardStats } from '@/types/mtMeet';
import { Calendar, Users, Star, TrendingUp, Plus } from 'lucide-react';

export default function MTMeet() {
  const [stats, setStats] = useState<MTMeetDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await mtMeetService.getDashboardStats();
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
        title="MT Meet"
        description="Master Technician meeting and event management"
        actions={<Button><Plus className="h-4 w-4 mr-2" />Schedule Meet</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Meets" value={stats?.totalMeets || 0} icon={<Calendar className="h-5 w-5" />} />
        <StatCard title="Upcoming Meets" value={stats?.upcomingMeets || 0} icon={<Calendar className="h-5 w-5" />} trend="up" />
        <StatCard title="Total Attendees" value={stats?.totalAttendees || 0} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Avg Rating" value={stats?.averageRating.toFixed(1) || '0'} icon={<Star className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent MT Meets</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentMeets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No meets scheduled yet. Create one to get started.</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentMeets.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <p className="text-sm text-muted-foreground">{m.city} • {new Date(m.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${m.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {m.status}
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
