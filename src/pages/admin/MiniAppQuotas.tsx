import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { toast } from "sonner";

interface Quota {
  id: string;
  role: string;
  daily_limit: number | null;
  monthly_limit: number | null;
  burst_per_hour: number | null;
  token_budget: number | null;
  bonus_quota: number | null;
}

export default function MiniAppQuotas() {
  const [rows, setRows] = useState<Quota[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    const { data } = await (supabase as any).from("mini_app_quotas").select("*").order("role");
    setRows((data ?? []) as Quota[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(row: Quota) {
    setSaving(row.id);
    const { error } = await (supabase as any)
      .from("mini_app_quotas")
      .update({
        daily_limit: row.daily_limit,
        monthly_limit: row.monthly_limit,
        burst_per_hour: row.burst_per_hour,
        token_budget: row.token_budget,
        bonus_quota: row.bonus_quota,
      })
      .eq("id", row.id);
    setSaving(null);
    if (error) toast.error(error.message);
    else toast.success(`Đã lưu quota cho ${row.role}`);
  }

  function update(id: string, field: keyof Quota, value: string) {
    const v = value === "" ? null : parseInt(value, 10);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: v } : r)));
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl">
        <h1 className="text-2xl font-bold mb-2">Mini App Quotas</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Quản lý giới hạn mini app theo role. Để trống = unlimited.
        </p>

        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <Card key={row.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base capitalize">{row.role}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                    <Field label="Daily limit" value={row.daily_limit} onChange={(v) => update(row.id, "daily_limit", v)} />
                    <Field label="Monthly limit" value={row.monthly_limit} onChange={(v) => update(row.id, "monthly_limit", v)} />
                    <Field label="Burst / hour" value={row.burst_per_hour} onChange={(v) => update(row.id, "burst_per_hour", v)} />
                    <Field label="Token budget" value={row.token_budget} onChange={(v) => update(row.id, "token_budget", v)} />
                    <Field label="Bonus quota" value={row.bonus_quota} onChange={(v) => update(row.id, "bonus_quota", v)} />
                  </div>
                  <Button size="sm" onClick={() => save(row)} disabled={saving === row.id}>
                    {saving === row.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Lưu
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Field({ label, value, onChange }: { label: string; value: number | null; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="∞"
        className="mt-1"
      />
    </div>
  );
}
