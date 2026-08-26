import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, MessageSquare, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Stats {
  totalUsers: number;
  totalTopics: number;
  totalMessages: number;
  totalAdmins: number;
}

interface CategoryData {
  name: string;
  value: number;
}

const COLORS = ['hsl(45, 85%, 65%)', 'hsl(340, 70%, 70%)', 'hsl(195, 70%, 60%)', 'hsl(160, 60%, 50%)', 'hsl(280, 60%, 60%)'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTopics: 0,
    totalMessages: 0,
    totalAdmins: 0,
  });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, topicsRes, messagesRes, adminsRes, categoriesRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('knowledge_topics').select('id', { count: 'exact', head: true }).eq('status' as never, 'active' as never),
          supabase.from('chat_history').select('id', { count: 'exact', head: true }),
          supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
          supabase.from('knowledge_topics').select('category').eq('status' as never, 'active' as never),
        ]);

        setStats({
          totalUsers: usersRes.count || 0,
          totalTopics: topicsRes.count || 0,
          totalMessages: messagesRes.count || 0,
          totalAdmins: adminsRes.count || 0,
        });

        // Process category data
        if (categoriesRes.data) {
          const categoryCount = categoriesRes.data.reduce((acc: Record<string, number>, item) => {
            const cat = item.category || 'Không phân loại';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
          }, {});

          setCategoryData(
            Object.entries(categoryCount).map(([name, value]) => ({ name, value }))
          );
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const quickActions = [
    { title: 'Thêm Knowledge', url: '/admin/knowledge', icon: BookOpen },
    { title: 'Quản lý Users', url: '/admin/users', icon: Users },
    { title: 'Xem Chat Analytics', url: '/admin/chat', icon: MessageSquare },
    { title: 'Phân quyền', url: '/admin/roles', icon: Shield },
  ];

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Tổng quan hệ thống ANGEL AI</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatsCard
            title="Tổng Users"
            value={loading ? '...' : stats.totalUsers}
            icon={Users}
            description="Người dùng đã đăng ký"
          />
          <StatsCard
            title="Knowledge Topics"
            value={loading ? '...' : stats.totalTopics}
            icon={BookOpen}
            description="Bài viết trong hệ thống"
          />
          <StatsCard
            title="Tin nhắn Chat"
            value={loading ? '...' : stats.totalMessages}
            icon={MessageSquare}
            description="Tổng số tin nhắn"
          />
          <StatsCard
            title="Admins"
            value={loading ? '...' : stats.totalAdmins}
            icon={Shield}
            description="Quản trị viên"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Phân bố Knowledge theo Category</h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  {loading ? 'Đang tải...' : 'Chưa có dữ liệu'}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Hành động nhanh</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link key={action.url} to={action.url}>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto py-4 hover:bg-primary/5 hover:border-primary"
                    >
                      <div className="flex items-center gap-3">
                        <action.icon className="w-5 h-5 text-primary" />
                        <span>{action.title}</span>
                      </div>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
