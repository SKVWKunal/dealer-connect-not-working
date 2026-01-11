import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import { pccService } from '@/services/pcc';
import { DashboardStats, PCCSubmission } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

export default function Dashboard() {
  const { user, isDealer, isManufacturer, isSuperAdmin } = useAuth();
  const { isModuleEnabled } = useFeatureFlags();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    setIsLoading(true);
    const dealerId = isDealer() ? user?.dealerId : undefined;
    const data = await pccService.getDashboardStats(dealerId);
    setStats(data);
    setIsLoading(false);
  };

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const subtopicData = Object.entries(stats.bySubtopic).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const statusData = [
    { name: 'Submitted', value: stats.byStatus.submitted, color: 'hsl(var(--info))' },
    { name: 'Under Review', value: stats.byStatus.under_review, color: 'hsl(var(--warning))' },
    { name: 'Approved', value: stats.byStatus.approved, color: 'hsl(var(--success))' },
    { name: 'Rejected', value: stats.byStatus.rejected, color: 'hsl(var(--destructive))' },
    { name: 'More Info', value: stats.byStatus.more_info_required, color: 'hsl(var(--accent))' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name}`}
        description={isDealer() ? `${user?.dealerName} Dashboard` : 'Manufacturer Overview'}
        actions={
          isDealer() && isModuleEnabled('dealer_pcc') && (
            <Button onClick={() => navigate('/pcc/submit')}>
              <Plus className="h-4 w-4 mr-2" />
              New PCC Submission
            </Button>
          )
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Submissions"
          value={stats.total}
          icon={FileText}
        />
        <StatCard
          title="Pending Review"
          value={stats.byStatus.submitted + stats.byStatus.under_review}
          description="Awaiting action"
          icon={Clock}
        />
        <StatCard
          title="Approval Rate"
          value={`${stats.approvalRate.toFixed(1)}%`}
          icon={CheckCircle}
          trend={stats.approvalRate > 50 ? { value: 5, isPositive: true } : undefined}
        />
        <StatCard
          title="Average TAT"
          value={`${stats.averageTAT.toFixed(1)} days`}
          description="Turn around time"
          icon={TrendingUp}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subtopic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submissions by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subtopicData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions & Action Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Submissions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/pcc/track')}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentSubmissions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No submissions yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{submission.referenceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {submission.brand.toUpperCase()} {submission.model} • {submission.subtopic}
                      </p>
                    </div>
                    <StatusBadge status={submission.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* More Info Required Queue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Action Required
            </CardTitle>
            {stats.moreInfoQueue.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {stats.moreInfoQueue.length} pending
              </span>
            )}
          </CardHeader>
          <CardContent>
            {stats.moreInfoQueue.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
                <p className="text-muted-foreground">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.moreInfoQueue.slice(0, 5).map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded-lg cursor-pointer hover:bg-warning/20 transition-colors"
                    onClick={() => navigate(`/pcc/track?ref=${submission.referenceNumber}`)}
                  >
                    <div>
                      <p className="font-medium text-sm">{submission.referenceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {submission.statusHistory[submission.statusHistory.length - 1]?.notes || 'Additional information requested'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-warning" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Super Admin */}
      {isSuperAdmin() && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" onClick={() => navigate('/modules')}>
                Module Management
              </Button>
              <Button variant="outline" onClick={() => navigate('/users')}>
                User Management
              </Button>
              <Button variant="outline" onClick={() => navigate('/access-requests')}>
                Access Requests
              </Button>
              <Button variant="outline" onClick={() => navigate('/audit-logs')}>
                Audit Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
