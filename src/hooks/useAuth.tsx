import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

type UserRole = Database["public"]["Enums"]["user_role"];

export function useAuth() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check current session when component mounts
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setRole(null);
        setLoading(false);
        navigate('/auth');
        return;
      }
      fetchUserRole(session.user.id);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setRole(null);
        navigate('/auth');
      } else if (event === 'SIGNED_IN' && session) {
        await fetchUserRole(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  async function fetchUserRole(userId: string) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      setRole(profile?.role || null);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }

  // Helper functions to check roles
  const isCustomer = role === 'customer';
  const isWorker = role === 'worker';
  const isAdmin = role === 'admin';

  // Helper function to check if user can access worker features
  const hasWorkerAccess = isWorker || isAdmin;

  return {
    role,
    loading,
    isCustomer,
    isWorker,
    isAdmin,
    hasWorkerAccess,
  };
}