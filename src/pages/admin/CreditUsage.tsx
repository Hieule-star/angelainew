import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Wallet,
  RefreshCw,
  Loader2,
  Activity,
  Coins,
  AlertCircle,
  Timer,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

type DailyRow = { day: string; requests: number; tokens: number; errors: number };
type EndpointRow = { endpoint: string; requests: number; tokens: number };
type ModelRow = { model: string; requests: number; tokens: number };
type KeyRow = {
  api_key_id: string | null;
  key_name: string;
  email: string;
  key_prefix: string;
  requests: number;
  tokens: number;
};

interface Summary {
  days: number;
  start: string;
  totals: { requests: number; tokens: number; errors: number; avg_latency_ms: number };
  daily: DailyRow[];
  by_endpoint: EndpointRow[];
  by_model: ModelRow[];
  by_key: KeyRow[];
}

const RANGES = [
  { label: '7 ngày', days: 7 },
  { label: '30 ngày', days: 30 },
];

export default function CreditUsage() {
  const { toast } = useToast();
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Summary | null>(null);

  const load = async (d: number) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.rpc('get_credit_usage_summary' as never, {
        p_days: d,
      } as never);
      if (error) throw error;
      setData(res as unknown as Summary);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi tải dữ liệu';
      toast({ title: 'Không tải được', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(days);
  }, [days]);

  const totalTokens = data?.totals.tokens ?? 0;
  const errorRate = data && data.totals.requests > 0
    ? ((data.totals.errors / data.totals.requests) * 100).toFixed(1)
    : '0.0';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Wallet className="w-6 h-6 text-primary" /> Credit Usage
            </h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi requests, tokens và phân bổ theo endpoint / model / API key.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {RANGES.map((r) => (
              <Button
                key={r.days}
                variant={days === r.days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDays(r.days)}
              >
                {r.label}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => load(days)} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi icon={<Activity className="w-4 h-4" />} label="Total requests" value={data?.totals.requests ?? 0} />
          <Kpi icon={<Coins className="w-4 h-4" />} label="Total tokens" value={totalTokens.toLocaleString()} />
          <Kpi icon={<Timer className="w-4 h-4" />} label="Avg latency" value={`${data?.totals.avg_latency_ms ?? 0} ms`} />
          <Kpi icon={<AlertCircle className="w-4 h-4" />} label="Error rate" value={`${errorRate}%`} />
        </div>

        {/* Daily chart */}
        <Card className="p-4">
          <h2 className="font-medium mb-3">Usage theo ngày</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={(data?.daily ?? []).map(d => ({ ...d, day: format(new Date(d.day), 'dd/MM') }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="requests" stroke="hsl(var(--primary))" strokeWidth={2} name="Requests" />
                <Line yAxisId="right" type="monotone" dataKey="tokens" stroke="hsl(var(--accent-foreground))" strokeWidth={2} name="Tokens" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h2 className="font-medium mb-3">Top endpoint</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(data?.by_endpoint ?? []).slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="endpoint" type="category" className="text-xs" width={140} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="requests" fill="hsl(var(--primary))" name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="font-medium mb-3">Top model (theo tokens)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(data?.by_model ?? []).slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="model" type="category" className="text-xs" width={140} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="tokens" fill="hsl(var(--accent-foreground))" name="Tokens" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Top key */}
        <Card className="p-4">
          <h2 className="font-medium mb-3">Top API key / user</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">% requests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.by_key ?? []).map((k, i) => {
                const pct = data && data.totals.requests > 0
                  ? ((k.requests / data.totals.requests) * 100).toFixed(1)
                  : '0.0';
                return (
                  <TableRow key={k.api_key_id ?? `null-${i}`}>
                    <TableCell className="font-medium">{k.key_name}</TableCell>
                    <TableCell className="text-muted-foreground">{k.email}</TableCell>
                    <TableCell className="font-mono text-xs">{k.key_prefix}</TableCell>
                    <TableCell className="text-right">{k.requests.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{k.tokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{pct}%</TableCell>
                  </TableRow>
                );
              })}
              {(!data || data.by_key.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    Chưa có dữ liệu trong khoảng này.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <p className="text-xs text-muted-foreground">
          Dữ liệu lấy từ <code>api_usage_logs</code>. Tokens là proxy cho credit AI Gateway (token càng cao → credit càng nhiều). Số credit thực còn lại của workspace xem ở Lovable Settings → Plans & credits.
        </p>
      </div>
    </AdminLayout>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon}{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </Card>
  );
}
