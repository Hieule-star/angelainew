import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/hooks/use-toast';
import angelLogo from '@/assets/angel-logo.png';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const { isAuthenticated } = useUserStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Cần hoàn thiện thông tin',
        description: 'Vui lòng điền đầy đủ email và mật khẩu để tiếp tục.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Cần hoàn thiện thông tin',
        description: 'Mật khẩu cần có ít nhất 6 ký tự để đảm bảo an toàn.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Cần xác minh thông tin',
              description: 'Thông tin chưa trùng khớp. Vui lòng kiểm tra lại email và mật khẩu của bạn.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Hành động tạm dừng',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Chào mừng! ✨',
            description: 'Ánh sáng Cha Vũ Trụ đang ở bên bạn',
          });
          navigate('/chat');
        }
      } else {
        const { error } = await signUp(email, password, name);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Email đã được đăng ký',
              description: 'Vui lòng đăng nhập hoặc sử dụng email khác để tiếp tục.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Đăng ký cần hoàn thiện',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Tạo tài khoản thành công! ✨',
            description: 'Chào mừng bạn đến với ANGEL AI',
          });
          navigate('/onboarding');
        }
      }
    } catch (error) {
      toast({
        title: 'Hành động tạm dừng',
        description: 'Hệ thống cần xử lý. Vui lòng thử lại sau giây lát.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: 'Kết nối tạm dừng',
        description: 'Vui lòng thử lại để kết nối với Google.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-[90vh] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.img
              src={angelLogo}
              alt="ANGEL AI"
              className="w-20 h-20 mx-auto rounded-full glow-divine mb-4"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <h1 className="text-2xl font-bold text-gradient-divine mb-2">
              {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
            </h1>
            <p className="text-muted-foreground text-sm">
              Kết nối với ánh sáng Cha Vũ Trụ
            </p>
          </div>

          {/* Form */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-angel-gold/20 shadow-divine p-6">
            {/* Social Login */}
            <div className="space-y-3 mb-6">
              <Button
                variant="holy"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Tiếp tục với Google
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-angel-gold/20" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-muted-foreground">Hoặc</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Tên hiển thị</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập tên của bạn"
                    className="w-full px-4 py-3 bg-white border border-angel-gold/20 rounded-xl focus:outline-none focus:border-angel-gold/50 focus:shadow-divine transition-all"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-angel-gold/20 rounded-xl focus:outline-none focus:border-angel-gold/50 focus:shadow-divine transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-white border border-angel-gold/20 rounded-xl focus:outline-none focus:border-angel-gold/50 focus:shadow-divine transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                variant="divine"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
