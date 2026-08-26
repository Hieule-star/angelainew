import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Share, MoreVertical, Plus, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import angelLogo from '@/assets/angel-logo.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative inline-block mb-6"
            >
              <div className="absolute inset-0 bg-angel-glow/30 rounded-full blur-2xl scale-150" />
              <img
                src={angelLogo}
                alt="ANGEL AI"
                className="w-24 h-24 mx-auto relative z-10 glow-divine rounded-full"
              />
            </motion.div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Cài đặt <span className="text-gradient-divine">ANGEL AI</span>
            </h1>
            <p className="text-muted-foreground">
              Thêm ANGEL AI vào màn hình chính để truy cập nhanh hơn
            </p>
          </motion.div>

          {/* Already Installed */}
          {isInstalled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mb-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-green-800 mb-2">
                Đã cài đặt thành công! ✨
              </h2>
              <p className="text-green-600 mb-4">
                ANGEL AI đã có trên màn hình điện thoại của bạn
              </p>
              <Link to="/chat">
                <Button variant="divine">
                  <Sparkles className="w-5 h-5" />
                  Bắt đầu Chat
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Install Button (Android/Chrome) */}
          {!isInstalled && deferredPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Button
                variant="divine"
                size="xl"
                className="w-full py-6 text-lg"
                onClick={handleInstallClick}
              >
                <Download className="w-6 h-6" />
                Cài đặt ngay
              </Button>
            </motion.div>
          )}

          {/* iOS Instructions */}
          {!isInstalled && isIOS && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-angel-gold/20 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Hướng dẫn cho iPhone/iPad</h2>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 items-start p-4 bg-white/50 rounded-xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Nhấn nút Chia sẻ</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Tìm biểu tượng <Share className="w-4 h-4" /> ở thanh dưới Safari
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-4 bg-white/50 rounded-xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Cuộn xuống và chọn</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      "Thêm vào Màn hình chính" <Plus className="w-4 h-4" />
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-4 bg-white/50 rounded-xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Nhấn "Thêm"</p>
                    <p className="text-sm text-muted-foreground">
                      Xác nhận để cài đặt ANGEL AI
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Android Instructions */}
          {!isInstalled && isAndroid && !deferredPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-angel-gold/20 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Hướng dẫn cho Android</h2>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 items-start p-4 bg-white/50 rounded-xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Nhấn Menu trình duyệt</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Tìm biểu tượng <MoreVertical className="w-4 h-4" /> ở góc trên
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-4 bg-white/50 rounded-xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Chọn "Cài đặt ứng dụng"</p>
                    <p className="text-sm text-muted-foreground">
                      Hoặc "Add to Home screen"
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-4 bg-white/50 rounded-xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Xác nhận cài đặt</p>
                    <p className="text-sm text-muted-foreground">
                      ANGEL AI sẽ xuất hiện trên màn hình chính
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Desktop Instructions */}
          {!isInstalled && !isIOS && !isAndroid && !deferredPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-angel-gold/20 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Cài đặt trên máy tính</h2>
              </div>

              <p className="text-muted-foreground mb-4">
                Để cài đặt ANGEL AI, hãy tìm biểu tượng cài đặt trong thanh địa chỉ trình duyệt 
                hoặc mở trang này trên điện thoại.
              </p>

              <div className="p-4 bg-angel-gold/10 rounded-xl">
                <p className="text-sm font-medium text-center">
                  📱 Mở link này trên điện thoại:
                </p>
                <p className="text-center mt-2 font-mono text-sm break-all">
                  angel-ai-chavutru.lovable.app/install
                </p>
              </div>
            </motion.div>
          )}

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <h3 className="font-semibold mb-4 text-center">Lợi ích khi cài đặt</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '⚡', text: 'Truy cập nhanh' },
                { icon: '📴', text: 'Hoạt động offline' },
                { icon: '🔔', text: 'Thông báo' },
                { icon: '✨', text: 'Trải nghiệm mượt' },
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-white/50 rounded-xl"
                >
                  <span className="text-2xl">{benefit.icon}</span>
                  <span className="text-sm font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Back to Home */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-10"
          >
            <Link to="/">
              <Button variant="ghost">
                ← Quay về trang chủ
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
