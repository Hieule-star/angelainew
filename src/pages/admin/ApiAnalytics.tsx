import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, RefreshCw, Loader2, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface UsageLog {
  id: string;
  api_key_id: string;
  endpoint: string;
  status_code: number;
  response_time_ms: number;
  error_message: string | null;
  created_at: string;
  api_keys?: {
    name: string;
    key_prefix: string;
  };
}

interface DailyStats {
  date: string;
  requests: number;
  errors: number;
}

interface TopUser {
  name: string;
  key_prefix: string;
  count: number;
}

export default function ApiAnalytics() {
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<UsageLog[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [totalWeek, setTotalWeek] = useState(0);
  const [verificationRate, setVerificationRate] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState(0);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch recent logs
      const { data: logs, error: logsError } = await supabase
        .from('api_usage_logs')
        .select(`
          *,
          api_keys (name, key_prefix)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;
      setRecentLogs(logs || []);

      // Calculate today's total
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = (logs || []).filter(l => 
        l.created_at.startsWith(today)
      );
      setTotalToday(todayLogs.length);

      // Calculate week total
      const weekAgo = subDays(new Date(), 7);
      const weekLogs = (logs || []).filter(l => 
        new Date(l.created_at) >= weekAgo
      );
      setTotalWeek(weekLogs.length);

      // Calculate verification rate
      const needsVerification = (logs || []).filter(l => l.status_code >= 400).length;
      setVerificationRate(logs?.length ? Math.round((needsVerification / logs.length) * 100) : 0);

      // Calculate avg response time
      const responseTimes = (logs || [])
        .filter(l => l.response_time_ms)
        .map(l => l.response_time_ms);
      setAvgResponseTime(
        responseTimes.length 
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : 0
      );

      // Calculate daily stats for chart
      const stats: Record<string, { requests: number; errors: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        stats[date] = { requests: 0, errors: 0 };
      }
      
      (logs || []).forEach(log => {
        const date = log.created_at.split('T')[0];
        if (stats[date]) {
          stats[date].requests++;
          if (log.status_code >= 400) stats[date].errors++;
        }
      });

      setDailyStats(Object.entries(stats).map(([date, data]) => ({
        date: format(new Date(date), 'dd/MM'),
        ...data
      })));

      // Calculate top users
      const userCounts: Record<string, { name: string; key_prefix: string; count: number }> = {};
      (logs || []).forEach(log => {
        if (log.api_keys) {
          const key = log.api_key_id;
          if (!userCounts[key]) {
            userCounts[key] = {
              name: log.api_keys.name,
              key_prefix: log.api_keys.key_prefix,
              count: 0
            };
          }
          userCounts[key].count++;
        }
      });
      
      setTopUsers(
        Object.values(userCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      );

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Dữ liệu đang cập nhật",
        description: "Vui lòng làm mới trang để thử lại.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300) {
      return <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30">200</Badge>;
    } else if (code === 429) {
      return <Badge className="bg-orange-500/20 text-orange-600 hover:bg-orange-500/30">429</Badge>;
    } else if (code >= 400) {
      return <Badge className="bg-red-500/20 text-red-600 hover:bg-red-500/30">{code}</Badge>;
    }
    return <Badge variant="secondary">{code}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              API Analytics
            </h1>
            <p className="text-muted-foreground">
              Theo dõi usage và performance của ANGEL AI API
            </p>
          </div>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-2xl font-bold">{totalToday}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <BarChart3 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">{totalWeek}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Verification Rate</p>
                    <p className="text-2xl font-bold">{verificationRate}%</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Clock className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response</p>
                    <p className="text-2xl font-bold">{avgResponseTime}ms</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Requests Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Requests (7 Days)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="requests" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Top Users Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top Developers</h3>
                {topUsers.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topUsers} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          className="text-xs"
                          width={100}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="hsl(var(--primary))"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No usage data yet
                  </div>
                )}
              </Card>
            </div>

            {/* Recent Logs Table */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Recent API Requests</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Developer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No API requests yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentLogs.slice(0, 20).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), 'dd/MM HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          {log.api_keys ? (
                            <div>
                              <p className="text-sm font-medium">{log.api_keys.name}</p>
                              <code className="text-xs text-muted-foreground">
                                {log.api_keys.key_prefix}...
                              </code>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log.status_code)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.response_time_ms ? `${log.response_time_ms}ms` : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-red-500 max-w-xs truncate">
                          {log.error_message || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
