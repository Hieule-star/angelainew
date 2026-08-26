import { motion } from 'framer-motion';
import { Sparkles, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface GuestLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GuestLimitModal({ open, onOpenChange }: GuestLimitModalProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onOpenChange(false);
    navigate('/login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-angel-gold/20 bg-gradient-to-b from-white to-angel-light/50">
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto mb-4"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-angel-gold to-angel-pink flex items-center justify-center glow-divine">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <DialogTitle className="text-xl text-center">
            Bạn đã sử dụng hết 5 tin nhắn miễn phí
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Đăng nhập để tiếp tục trò chuyện với ANGEL AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="bg-angel-light/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">
              Đăng nhập để nhận:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="text-angel-gold">✨</span>
                Chat không giới hạn với ANGEL AI
              </li>
              <li className="flex items-center gap-2">
                <span className="text-angel-gold">✨</span>
                Lưu lịch sử trò chuyện
              </li>
              <li className="flex items-center gap-2">
                <span className="text-angel-gold">✨</span>
                Tích lũy Light Points
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="divine"
            className="flex-1"
            onClick={handleLogin}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Đăng nhập
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-angel-gold/30 hover:bg-angel-light"
            onClick={handleLogin}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Đăng ký
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
