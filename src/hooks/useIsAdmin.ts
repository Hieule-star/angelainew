import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/userStore';

/**
 * Simple hook to check if current user has admin role.
 * Does NOT perform any redirects - just returns the admin status.
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { session } = useUserStore();

  useEffect(() => {
    async function checkAdminRole() {
      if (!session?.user?.id) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin',
        });

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }
      } catch (err) {
        console.error('Admin check failed:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminRole();
  }, [session?.user?.id]);

  return { isAdmin, loading };
}
