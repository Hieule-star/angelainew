import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Wallet, Sparkles, LogOut, Settings, MessageCircle, Code } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/userStore';
import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const { user, isAuthenticated, chatHistory, wallet } = useUserStore();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-angel-gold/20 flex items-center justify-center">
              <User className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Chưa đăng nhập</h1>
            <p className="text-muted-foreground mb-6">
              Đăng nhập để lưu lịch sử chat, tích lũy Light Points và kết nối ví
            </p>
            <Link to="/login">
              <Button variant="divine" size="lg">
                Đăng nhập ngay
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
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="relative inline-block mb-4">
              <motion.div
                className="w-24 h-24 rounded-full bg-angel-gold/20 flex items-center justify-center overflow-hidden glow-soft"
                animate={{ boxShadow: ['0 0 20px rgba(248, 227, 142, 0.3)', '0 0 40px rgba(248, 227, 142, 0.5)', '0 0 20px rgba(248, 227, 142, 0.3)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-primary" />
                )}
              </motion.div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-angel-gold rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-1">{user?.display_name}</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-angel-gold/20 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-angel-gold/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Light Points</span>
              </div>
              <p className="text-3xl font-bold text-gradient-divine">{user?.light_points || 0}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-angel-gold/20 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-angel-pink/30 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-secondary-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Tin nhắn</span>
              </div>
              <p className="text-3xl font-bold">{chatHistory.length}</p>
            </motion.div>
          </div>

          {/* Wallet Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-angel-gold/20 shadow-soft mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-angel-blue/50 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Ví Blockchain</h3>
                  <p className="text-xs text-muted-foreground">Camly Coin Balance</p>
                </div>
              </div>
              {wallet.connected ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Đã kết nối
                </span>
              ) : (
                <Link to="/wallet">
                  <Button variant="celestial" size="sm">
                    Kết nối
                  </Button>
                </Link>
              )}
            </div>
            {wallet.connected && (
              <div className="pt-4 border-t border-angel-gold/10">
                <p className="text-xs text-muted-foreground mb-1">Địa chỉ ví</p>
                <p className="text-sm font-mono bg-muted/50 px-3 py-2 rounded-lg truncate">
                  {wallet.address}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Camly Coin</span>
                  <span className="text-xl font-bold text-gradient-divine">{wallet.balance} CLY</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <Link to="/developers" className="block">
              <Button variant="holy" className="w-full justify-start" size="lg">
                <Code className="w-5 h-5" />
                API & Developers
              </Button>
            </Link>
            <Link to="/settings" className="block">
              <Button variant="holy" className="w-full justify-start" size="lg">
                <Settings className="w-5 h-5" />
                Cài đặt
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              size="lg"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              Đăng xuất
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
