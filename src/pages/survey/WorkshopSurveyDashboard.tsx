import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { workshopSurveyService } from '@/services/workshopSurvey';
import { SurveyDashboardStats } from '@/types/survey';
import { useAuth } from '@/contexts/AuthContext';
import { exportService } from '@/services/export';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  FileText, 
  TrendingUp, 
  Users, 
  BarChart3,
  Download,
  Plus,
  Star
} from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--destructive))'];

export default function WorkshopSurveyDashboard() {
  const navigate = useNavigate();
  const { user, isManufacturer, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<SurveyDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await workshopSurveyService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!user || !stats) return;
    const surveys = await workshopSurveyService.getAll();
    const exportData = surveys.map(s => ({
      id: s.id,
      name: s.participantInfo.name,
      brand: s.participantInfo.brand,
      dealershipCode: s.participantInfo.dealershipCode,
      status: s.status,
    }));
    // Simple CSV export
    const headers = ['ID', 'Name', 'Brand', 'Dealership', 'Status'];
    const rows = exportData.map(r => [r.id, r.name, r.brand, r.dealershipCode, r.status]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workshop-survey-export.csv';
    a.click();
  };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
      </div>
    );
  }

  const satisfactionData = [
    { subject: 'ElsaPro', score: stats.averageSatisfaction.elsaPro, fullMark: 5 },
    { subject: 'ODIS', score: stats.averageSatisfaction.odis, fullMark: 5 },
    { subject: 'Interactive', score: stats.averageSatisfaction.interactiveDiagnosis, fullMark: 5 },
    { subject: 'Tools', score: stats.averageSatisfaction.toolsEquipment, fullMark: 5 },
    { subject: 'WPRC', score: stats.averageSatisfaction.wprc, fullMark: 5 },
  ];

  const brandData = Object.entries(stats.byBrand).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const statusData = Object.entries(stats.byStatus).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workshop Survey Dashboard"
        description="Overview of workshop system survey responses and satisfaction metrics"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => navigate('/workshop-survey/submit')}>
              <Plus className="h-4 w-4 mr-2" />
              New Survey
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Submissions"
          value={stats.totalSubmissions}
          icon={FileText}
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate.toFixed(1)}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Overall Satisfaction"
          value={`${stats.averageSatisfaction.overall.toFixed(1)} / 5`}
          icon={Star}
        />
        <StatCard
          title="Unique Dealers"
          value={Object.keys(stats.byBrand).length > 0 ? stats.totalSubmissions : 0}
          icon={Users}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Satisfaction Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Satisfaction by Section</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.totalSubmissions > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={satisfactionData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brand Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submissions by Brand</CardTitle>
          </CardHeader>
          <CardContent>
            {brandData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={brandData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {brandData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Average Satisfaction Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.totalSubmissions > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={satisfactionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis dataKey="subject" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => value.toFixed(2)} />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No submissions yet. Be the first to complete a survey!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pain Points & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pain Points */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Areas Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topPainPoints.length > 0 ? (
              <div className="space-y-3">
                {stats.topPainPoints.map((point, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{point.section}</p>
                      <p className="text-xs text-muted-foreground">{point.question}</p>
                    </div>
                    <div className={`text-lg font-bold ${point.score < 3 ? 'text-destructive' : point.score < 4 ? 'text-warning' : 'text-success'}`}>
                      {point.score.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentSubmissions.map((survey) => (
                  <div key={survey.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{survey.participantInfo.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {survey.participantInfo.brand} • {survey.participantInfo.dealershipCode}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      survey.status === 'submitted' ? 'bg-primary/10 text-primary' : 
                      survey.status === 'reviewed' ? 'bg-success/10 text-success' : 
                      'bg-muted text-muted-foreground'
                    }`}>
                      {survey.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No submissions yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
