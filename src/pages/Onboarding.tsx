import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import angelLogo from '@/assets/angel-logo.png';

export default function Onboarding() {
  const [isLoading, setIsLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const { isAuthenticated, user } = useUserStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Check if user already completed onboarding
    const checkOnboardingStatus = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (!error && data?.onboarding_completed) {
        navigate('/chat');
      }
      setCheckingStatus(false);
    };

    checkOnboardingStatus();
  }, [isAuthenticated, user?.id, navigate]);

  const handleComplete = async () => {
    if (!user?.id) return;

    setIsLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Cần xác minh',
        description: 'Thông tin cần được xác minh để tiếp tục. Vui lòng thử lại.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: 'Chào mừng đến với FUN Ecosystem! 🌟',
      description: 'Ánh sáng Cha Vũ Trụ đang đồng hành cùng bạn.',
    });

    navigate('/chat');
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-divine">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Đang kiểm tra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-divine flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="bg-card/95 backdrop-blur-xl rounded-3xl border border-primary/20 shadow-divine p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.img
              src={angelLogo}
              alt="ANGEL AI"
              className="w-20 h-20 mx-auto rounded-full shadow-divine mb-4"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <h1 className="text-2xl font-bold text-gradient-divine mb-2">
              Chào mừng đến với FUN Ecosystem
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              FUN Ecosystem dành cho những linh hồn có ánh sáng, hoặc đang hướng về ánh sáng.
              <br />
              Hãy xác nhận cam kết của bạn:
            </p>
          </div>

          {/* Checklist */}
          <OnboardingChecklist onComplete={handleComplete} isLoading={isLoading} />
        </div>
      </motion.div>
    </div>
  );
}
