import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAdminRole() {
      // Get session directly from Supabase to avoid race condition with store
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        setLoading(false);
        navigate('/login');
        return;
      }

      const userId = currentSession.user.id;

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: userId,
          _role: 'admin',
        });

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
          navigate('/');
        } else {
          setIsAdmin(data === true);
          if (!data) {
            navigate('/');
          }
        }
      } catch (err) {
        console.error('Admin check failed:', err);
        setIsAdmin(false);
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    checkAdminRole();
  }, [navigate]);

  return { isAdmin, loading };
}
