import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserStore } from "@/stores/userStore";
import { useMiniAppQuota } from "@/hooks/useMiniAppQuota";
import { MINI_APP_TEMPLATES } from "@/data/miniAppTemplates";

interface AppRow {
  id: string;
  title: string;
  description: string | null;
  app_type: string;
  status: string;
  created_at: string;
}

export default function MiniApps() {
  const { isAuthenticated } = useUserStore();
  const { quota } = useMiniAppQuota();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      const { data } = await supabase
        .from("ai_generated_apps")
        .select("id,title,description,app_type,status,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      setApps((data ?? []) as AppRow[]);
      setLoading(false);
    })();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">Đăng nhập để tạo Mini App ✨</p>
          <Link to="/login"><Button variant="divine">Đăng nhập</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="text-angel-gold" /> Mini App Builder
            </h1>
            <p className="text-muted-foreground mt-1">
              Mô tả ý tưởng — Angel AI tạo mini app/game React + Tailwind preview ngay tại đây.
            </p>
          </div>
          {quota && (
            <div className="text-sm text-right">
              <Badge variant="outline" className="mb-1">{quota.role}</Badge>
              <p className="text-muted-foreground">
                {quota.daily_limit === null
                  ? "Không giới hạn"
                  : `${quota.daily_used}/${quota.daily_limit} hôm nay`}
              </p>
            </div>
          )}
        </div>

        {/* Templates */}
        <h2 className="text-xl font-semibold mb-3">Bắt đầu nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {MINI_APP_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => navigate(`/mini-apps/new?template=${tpl.id}`)}
              className="text-left p-4 rounded-xl border border-border bg-white hover:border-angel-gold hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-2">{tpl.emoji}</div>
              <div className="font-semibold">{tpl.title}</div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tpl.description}</p>
            </button>
          ))}
          <button
            onClick={() => navigate("/mini-apps/new")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-angel-gold/40 hover:bg-angel-gold/5 transition-all"
          >
            <Plus className="w-8 h-8 mb-2 text-angel-gold" />
            <span className="font-semibold">Custom</span>
            <span className="text-xs text-muted-foreground mt-1">Mô tả ý tưởng riêng</span>
          </button>
        </div>

        {/* My apps */}
        <h2 className="text-xl font-semibold mb-3">Mini app của bạn</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
        ) : apps.length === 0 ? (
          <p className="text-muted-foreground text-sm">Chưa có mini app nào — hãy chọn template hoặc Custom ở trên ✨</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {apps.map((app) => (
              <Card
                key={app.id}
                className="cursor-pointer hover:border-angel-gold transition-all"
                onClick={() => navigate(`/mini-apps/${app.id}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="truncate">{app.title}</span>
                    <Badge variant="outline" className="text-xs">{app.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{app.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {app.app_type} · {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
