import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MiniAppQuotaStatus {
  role: string;
  daily_used: number;
  daily_limit: number | null;
  monthly_used: number;
  monthly_limit: number | null;
  burst_per_hour: number | null;
  token_budget: number | null;
  allowed: boolean;
}

export function useMiniAppQuota() {
  const [quota, setQuota] = useState<MiniAppQuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase.rpc as any)("get_mini_app_quota_status", {});
    if (!error && data) setQuota(data as MiniAppQuotaStatus);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { quota, loading, refresh };
}
