import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bell, Globe, Shield, HelpCircle, ChevronRight, Moon, Sun } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/userStore';

const settingsGroups = [
  {
    title: 'Tùy chọn',
    items: [
      {
        icon: Bell,
        label: 'Thông báo',
        description: 'Quản lý cài đặt thông báo',
        action: 'toggle',
      },
      {
        icon: Globe,
        label: 'Ngôn ngữ',
        description: 'Tiếng Việt',
        action: 'select',
      },
    ],
  },
  {
    title: 'Bảo mật',
    items: [
      {
        icon: Shield,
        label: 'Quyền riêng tư',
        description: 'Quản lý dữ liệu và quyền riêng tư',
        action: 'link',
      },
    ],
  },
  {
    title: 'Hỗ trợ',
    items: [
      {
        icon: HelpCircle,
        label: 'Trợ giúp',
        description: 'FAQ và hướng dẫn sử dụng',
        action: 'link',
      },
    ],
  },
];

export default function Settings() {
  const { isAuthenticated } = useUserStore();

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <h1 className="text-2xl font-bold mb-3">Cài đặt</h1>
            <p className="text-muted-foreground mb-6">
              Đăng nhập để truy cập cài đặt
            </p>
            <Link to="/login">
              <Button variant="divine" size="lg">
                Đăng nhập
              </Button>
            </Link>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">Cài đặt</h1>
            <p className="text-muted-foreground">Tùy chỉnh trải nghiệm ANGEL AI</p>
          </motion.div>

          {/* Theme Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-angel-gold/20 shadow-soft mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-angel-gold/20 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Giao diện</p>
                  <p className="text-sm text-muted-foreground">Chế độ sáng</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-1 bg-muted rounded-full">
                <button className="p-2 bg-white rounded-full shadow-sm">
                  <Sun className="w-4 h-4" />
                </button>
                <button className="p-2 text-muted-foreground">
                  <Moon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Settings Groups */}
          {settingsGroups.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (groupIndex + 2) }}
              className="mb-6"
            >
              <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                {group.title}
              </h2>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-angel-gold/20 shadow-soft overflow-hidden">
                {group.items.map((item, itemIndex) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between p-4 hover:bg-angel-gold/5 cursor-pointer transition-colors ${
                      itemIndex !== group.items.length - 1 ? 'border-b border-angel-gold/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-angel-gold/10 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Future Features Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 bg-angel-gold/5 rounded-2xl border border-angel-gold/20 text-center"
          >
            <p className="text-sm font-medium mb-2">🚀 Tính năng sắp ra mắt</p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <span className="px-3 py-1 bg-white/60 rounded-full">Video Call AI</span>
              <span className="px-3 py-1 bg-white/60 rounded-full">AI Coaching</span>
              <span className="px-3 py-1 bg-white/60 rounded-full">Meditation Voice</span>
              <span className="px-3 py-1 bg-white/60 rounded-full">Task Manager</span>
            </div>
          </motion.div>

          {/* Version */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            ANGEL AI v1.0.0 • FUN Ecosystem
          </p>
        </div>
      </div>
    </Layout>
  );
}
