import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, History, AlertTriangle, RefreshCw } from "lucide-react";

interface SystemPrompt {
  id: string;
  slug: string;
  category: string;
  label: string;
  description: string | null;
  content: string;
  is_active: boolean;
  updated_at: string;
}

interface HistoryRow {
  id: string;
  content: string;
  changed_at: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  core: "Core Identity",
  context: "Context Modes",
  pronoun: "Pronoun Styles",
  safety: "Safety",
};

export default function SystemPromptManager() {
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("system_prompts")
      .select("*")
      .order("category")
      .order("slug");
    if (error) {
      toast({ title: "Lỗi tải prompt", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    setPrompts(data || []);
    const nextDrafts: Record<string, string> = {};
    for (const p of data || []) nextDrafts[p.slug] = p.content;
    setDrafts(nextDrafts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (slug: string) => {
    setSavingSlug(slug);
    const { error } = await supabase.rpc("update_system_prompt", {
      _slug: slug,
      _content: drafts[slug] ?? "",
    });
    setSavingSlug(null);
    if (error) {
      toast({ title: "Lưu thất bại", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Đã lưu", description: `Prompt "${slug}" đã cập nhật.` });
    load();
  };

  const openHistory = async (slug: string) => {
    setHistoryOpen(slug);
    const { data } = await supabase
      .from("system_prompts_history")
      .select("id, content, changed_at")
      .eq("slug", slug)
      .order("changed_at", { ascending: false })
      .limit(20);
    setHistory(data || []);
  };

  const restoreFromHistory = (slug: string, content: string) => {
    setDrafts((d) => ({ ...d, [slug]: content }));
    setHistoryOpen(null);
    toast({ title: "Đã khôi phục", description: "Nội dung cũ đã được nạp vào editor. Nhấn Lưu để áp dụng." });
  };

  const categories = ["core", "context", "pronoun", "safety"];
  const isDirty = (p: SystemPrompt) => (drafts[p.slug] ?? "") !== p.content;

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">System Prompt Manager</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Xem và chỉnh sửa các phần system prompt của Angel AI. Mọi thay đổi có bản backup lịch sử.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" /> Tải lại
          </Button>
        </div>

        <Card className="p-4 border-amber-300/50 bg-amber-50/40">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-medium">Cảnh báo</p>
              <p className="text-amber-800/80 mt-1">
                Prompt là "não bộ" của Angel AI. Chỉnh sửa cẩn trọng. Nếu bảng DB chưa có row nào,
                edge function sẽ tự động seed bản mặc định vào lần chat kế tiếp — hãy chat thử 1 câu rồi bấm "Tải lại".
              </p>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : prompts.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Chưa có prompt nào trong DB. Hãy gửi 1 tin nhắn tới Angel AI, edge function sẽ tự seed mặc định, rồi bấm "Tải lại".
          </Card>
        ) : (
          <Tabs defaultValue="core">
            <TabsList>
              {categories.map((c) => {
                const count = prompts.filter((p) => p.category === c).length;
                if (count === 0) return null;
                return (
                  <TabsTrigger key={c} value={c}>
                    {CATEGORY_LABEL[c] || c} <Badge variant="secondary" className="ml-2">{count}</Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {categories.map((c) => (
              <TabsContent key={c} value={c} className="space-y-4 mt-4">
                {prompts.filter((p) => p.category === c).map((p) => (
                  <Card key={p.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{p.label}</h3>
                          <Badge variant="outline" className="font-mono text-xs">{p.slug}</Badge>
                          {!p.is_active && <Badge variant="destructive">inactive</Badge>}
                          {isDirty(p) && <Badge className="bg-amber-500">chưa lưu</Badge>}
                        </div>
                        {p.description && (
                          <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Cập nhật: {new Date(p.updated_at).toLocaleString("vi-VN")}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Sheet open={historyOpen === p.slug} onOpenChange={(o) => !o && setHistoryOpen(null)}>
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => openHistory(p.slug)}>
                              <History className="w-4 h-4 mr-1" /> Lịch sử
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                            <SheetHeader>
                              <SheetTitle>Lịch sử: {p.slug}</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4 space-y-3">
                              {history.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Chưa có bản lịch sử.</p>
                              ) : history.map((h) => (
                                <Card key={h.id} className="p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(h.changed_at).toLocaleString("vi-VN")}
                                    </span>
                                    <Button size="sm" variant="outline"
                                      onClick={() => restoreFromHistory(p.slug, h.content)}>
                                      Khôi phục vào editor
                                    </Button>
                                  </div>
                                  <pre className="text-xs whitespace-pre-wrap max-h-40 overflow-y-auto bg-muted p-2 rounded">
                                    {h.content.slice(0, 800)}{h.content.length > 800 ? "…" : ""}
                                  </pre>
                                </Card>
                              ))}
                            </div>
                          </SheetContent>
                        </Sheet>
                        <Button size="sm" onClick={() => save(p.slug)}
                          disabled={savingSlug === p.slug || !isDirty(p)}>
                          {savingSlug === p.slug
                            ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            : <Save className="w-4 h-4 mr-1" />}
                          Lưu
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={drafts[p.slug] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [p.slug]: e.target.value }))}
                      className="font-mono text-xs min-h-[300px]"
                      spellCheck={false}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {(drafts[p.slug] ?? "").length.toLocaleString()} ký tự
                    </p>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
