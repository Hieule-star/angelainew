import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/userStore';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const { setUser, setSession, logout } = useUserStore();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);

        if (session?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);

          if (event === 'SIGNED_IN') {
            // Best-effort sync with FUN core platform
            setTimeout(() => {
              triggerFunApiSync(session.user.id);
            }, 100);
          }
        } else {
          setUser(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
        setTimeout(() => triggerFunApiSync(session.user.id), 100);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const triggerFunApiSync = async (userId: string, attempt = 1) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('fun_id')
        .eq('id', userId)
        .maybeSingle();
      if (profile?.fun_id) return;

      const { data, error } = await supabase.functions.invoke('fun-api-sync-user');
      if (error || !(data as any)?.ok) {
        if (attempt < 2) {
          setTimeout(() => triggerFunApiSync(userId, attempt + 1), 5000);
        } else {
          console.warn('[fun-api-sync-user] failed:', error || (data as any)?.error);
        }
      }
    } catch (err) {
      console.warn('[fun-api-sync-user] exception:', err);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (profile) {
      setUser({
        id: profile.id,
        email: profile.email || '',
        display_name: profile.display_name || '',
        avatar_url: profile.avatar_url || '',
        light_points: profile.light_points || 0,
        created_at: profile.created_at,
      });
    }
  };


  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      logout();
    }
    return { error };
  };

  return {
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };
}
