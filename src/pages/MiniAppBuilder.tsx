import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, RefreshCw, CheckCircle2, Rocket, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MiniAppPreview } from "@/components/miniapp/MiniAppPreview";
import { MINI_APP_TEMPLATES } from "@/data/miniAppTemplates";
import { useMiniAppQuota } from "@/hooks/useMiniAppQuota";

interface AppRecord {
  id: string;
  title: string;
  description: string | null;
  app_type: string;
  status: string;
  source_code: Record<string, string>;
  build_logs: string | null;
  prompt: string | null;
  model_used: string | null;
}

export default function MiniAppBuilder() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { quota, refresh: refreshQuota } = useMiniAppQuota();

  const isNew = !id || id === "new";
  const [app, setApp] = useState<AppRecord | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingApp, setLoadingApp] = useState(!isNew);

  // Load existing app or apply template
  useEffect(() => {
    if (isNew) {
      const tpl = params.get("template");
      if (tpl) {
        const t = MINI_APP_TEMPLATES.find((x) => x.id === tpl);
        if (t) setPrompt(t.prompt);
      }
      return;
    }
    (async () => {
      setLoadingApp(true);
      const { data, error } = await supabase
        .from("ai_generated_apps")
        .select("*")
        .eq("id", id!)
        .single();
      if (error || !data) {
        toast.error("Không tìm thấy mini app");
        navigate("/mini-apps");
        return;
      }
      setApp(data as unknown as AppRecord);
      setPrompt(data.prompt ?? "");
      setLoadingApp(false);
    })();
  }, [id, isNew, params, navigate]);

  async function generate(isRegen = false) {
    if (!prompt.trim()) {
      toast.error("Hãy mô tả ý tưởng mini app của bạn");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mini-app-generate", {
        body: {
          prompt,
          app_id: isRegen && app ? app.id : undefined,
          template: params.get("template") ?? undefined,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) {
        toast.error((data as any).message ?? (data as any).error);
        return;
      }
      const newApp = (data as any).app as AppRecord;
      setApp(newApp);
      toast.success("Mini app đã được tạo ✨");
      refreshQuota();
      if (isNew) navigate(`/mini-apps/${newApp.id}`, { replace: true });
    } catch (e) {
      toast.error("Tạo mini app thất bại: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    if (!app) return;
    const { error } = await supabase
      .from("ai_generated_apps")
      .update({ status: "approved" })
      .eq("id", app.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setApp({ ...app, status: "approved" });
    toast.success("Đã duyệt mini app 🌟");
  }

  if (loadingApp) {
    return (
      <Layout>
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/mini-apps")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
          </Button>
          {app && <Badge variant="outline">{app.status}</Badge>}
          {quota && quota.daily_limit !== null && (
            <span className="text-xs text-muted-foreground ml-auto">
              Còn lại hôm nay: {Math.max(0, quota.daily_limit - quota.daily_used)}/{quota.daily_limit}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: builder */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-angel-gold" />
                  Mô tả mini app
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={8}
                  placeholder="Ví dụ: Tạo quiz 5 câu về thiên văn, mỗi câu 4 lựa chọn, tính điểm cuối game..."
                  className="mt-2"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => generate(false)} disabled={loading} variant="divine">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {isNew ? "Tạo Mini App" : "Tạo bản mới"}
                </Button>
                {app && (
                  <>
                    <Button onClick={() => generate(true)} disabled={loading} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                    </Button>
                    <Button onClick={approve} disabled={app.status === "approved"} variant="outline">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button disabled variant="outline" title="Phase 2 — deploy thật sẽ có sau">
                      <Rocket className="w-4 h-4 mr-2" /> Deploy
                    </Button>
                  </>
                )}
              </div>

              {app?.build_logs && (
                <div className="text-xs bg-muted/40 rounded-lg p-3">
                  <p className="font-semibold mb-1">Tóm tắt:</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">{app.build_logs}</p>
                </div>
              )}

              {app && (
                <div className="text-xs text-muted-foreground">
                  Model: {app.model_used} · Type: {app.app_type}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: preview */}
          <Card>
            <CardContent className="p-2">
              <div className="h-[600px]">
                {app ? (
                  <MiniAppPreview files={app.source_code} entry="App.tsx" className="h-full" />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm bg-muted/20 rounded-xl">
                    Tạo mini app để preview ở đây ✨
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
