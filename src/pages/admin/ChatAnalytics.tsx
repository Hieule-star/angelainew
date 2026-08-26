import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Loader2, Calendar, TrendingUp } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChatMessage {
  id: string;
  message: string;
  role: string;
  created_at: string | null;
  user_id: string;
  user_email?: string;
}

interface DailyStats {
  date: string;
  count: number;
}

export default function ChatAnalytics() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);
  const [todayMessages, setTodayMessages] = useState(0);
  const [uniqueUsers, setUniqueUsers] = useState(0);

  useEffect(() => {
    async function fetchChatData() {
      try {
        // Fetch recent messages
        const { data: chatData, error: chatError } = await supabase
          .from('chat_history')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (chatError) throw chatError;

        // Get user emails for messages
        const userIds = [...new Set((chatData || []).map((m) => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        const messagesWithEmail = (chatData || []).map((msg) => ({
          ...msg,
          user_email: profiles?.find((p) => p.id === msg.user_id)?.email || 'Unknown',
        }));

        setMessages(messagesWithEmail);
        setTotalMessages(chatData?.length || 0);
        setUniqueUsers(userIds.length);

        // Calculate today's messages
        const today = new Date();
        const todayStart = startOfDay(today);
        const todayEnd = endOfDay(today);
        const todayCount = (chatData || []).filter((m) => {
          const msgDate = new Date(m.created_at || 0);
          return msgDate >= todayStart && msgDate <= todayEnd;
        }).length;
        setTodayMessages(todayCount);

        // Calculate daily stats for last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(today, 6 - i);
          return {
            date: format(date, 'dd/MM'),
            fullDate: date,
            count: 0,
          };
        });

        (chatData || []).forEach((msg) => {
          const msgDate = new Date(msg.created_at || 0);
          const dayIndex = last7Days.findIndex((d) => {
            const dayStart = startOfDay(d.fullDate);
            const dayEnd = endOfDay(d.fullDate);
            return msgDate >= dayStart && msgDate <= dayEnd;
          });
          if (dayIndex !== -1) {
            last7Days[dayIndex].count++;
          }
        });

        setDailyStats(last7Days.map(({ date, count }) => ({ date, count })));
      } catch (err) {
        console.error('Error fetching chat data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchChatData();
  }, []);

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Chat Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Thống kê và phân tích hoạt động chat
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <StatsCard
            title="Tổng tin nhắn"
            value={loading ? '...' : totalMessages}
            icon={MessageSquare}
            description="Trong 100 tin gần nhất"
          />
          <StatsCard
            title="Tin nhắn hôm nay"
            value={loading ? '...' : todayMessages}
            icon={Calendar}
            description="Từ 00:00 đến hiện tại"
          />
          <StatsCard
            title="Users hoạt động"
            value={loading ? '...' : uniqueUsers}
            icon={TrendingUp}
            description="Đã gửi tin nhắn"
          />
        </motion.div>

        {/* Daily Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tin nhắn 7 ngày qua</h3>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        {/* Recent Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Tin nhắn gần đây</h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="max-w-[400px]">Message</TableHead>
                    <TableHead>Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Chưa có tin nhắn nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    messages.slice(0, 20).map((msg) => (
                      <TableRow key={msg.id}>
                        <TableCell className="font-medium text-sm">
                          {msg.user_email}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              msg.role === 'user'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            }`}
                          >
                            {msg.role}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[400px]">
                          <p className="line-clamp-2 text-sm">{msg.message}</p>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {msg.created_at
                            ? format(new Date(msg.created_at), 'dd/MM HH:mm')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
