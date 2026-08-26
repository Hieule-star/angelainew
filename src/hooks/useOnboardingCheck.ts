import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/userStore';

export function useOnboardingCheck() {
  const [isChecking, setIsChecking] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const { isAuthenticated, user } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    const checkOnboarding = async () => {
      // Skip check for unauthenticated users
      if (!isAuthenticated || !user?.id) {
        setIsChecking(false);
        setOnboardingCompleted(true); // Allow guests to access
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        setIsChecking(false);
        return;
      }

      const completed = data?.onboarding_completed ?? false;
      setOnboardingCompleted(completed);

      if (!completed) {
        navigate('/onboarding');
      }

      setIsChecking(false);
    };

    checkOnboarding();
  }, [isAuthenticated, user?.id, navigate]);

  return { isChecking, onboardingCompleted };
}
