import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Copy, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RankedTopic {
  id: string;
  title: string;
  category: string | null;
  icon: string | null;
  score: number;
  matchedKeywords: string[];
  contentLength: number;
  preview: string;
}

interface RagResult {
  query: string;
  extractedKeywords: string[];
  isFunQuery: boolean;
  funEcosystemSeeded: boolean;
  fallbackUsed: boolean;
  totalMatched: number;
  usedInContext: number;
  topTopics: RankedTopic[];
  excludedTopics: RankedTopic[];
  pronounStyle: string;
  finalSystemPrompt: string;
  finalSystemPromptLength: number;
  finalMessages: Array<{ role: string; content: string }>;
  model: string;
}

const SAMPLES = [
  "FUN Profile có live stream chưa?",
  "Làm sao tạo tài khoản FUN Profile?",
  "Bé Camly Dương là ai?",
  "Divine Mantras là gì?",
];

export default function RagDebug() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RagResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const { toast } = useToast();

  const runTest = async (q?: string) => {
    const finalQuery = (q ?? query).trim();
    if (!finalQuery) return;
    if (q) setQuery(q);
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("rag-debug", {
        body: { query: finalQuery },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as RagResult);
    } catch (err) {
      toast({
        title: "Lỗi khi test RAG",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyJSON = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPrompt = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.finalSystemPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">RAG Debugger</h1>
          <p className="text-muted-foreground">
            Kiểm tra xem một câu hỏi sẽ retrieve những knowledge topics nào — dùng cùng logic với
            <code className="mx-1 px-1.5 py-0.5 bg-muted rounded text-xs">angel-ai-public</code>
            (endpoint Telegram bot đang gọi).
          </p>
        </div>

        {/* Input */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Nhập câu hỏi thử... (vd: FUN Profile có live stream chưa?)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runTest()}
              className="flex-1"
            />
            <Button onClick={() => runTest()} disabled={loading || !query.trim()} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Test RAG
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center mr-1">Gợi ý:</span>
            {SAMPLES.map((s) => (
              <button
                key={s}
                onClick={() => runTest(s)}
                disabled={loading}
                className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-muted/70 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </Card>

        {/* Result */}
        {result && (
          <>
            {/* Summary */}
            <Card className="p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-semibold">Tóm tắt</h2>
                <Button variant="ghost" size="sm" onClick={copyJSON} className="gap-2">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  Copy JSON
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Stat label="Keywords extract" value={result.extractedKeywords.length} />
                <Stat label="Tổng matched" value={result.totalMatched} />
                <Stat label="Dùng trong context" value={result.usedInContext} highlight />
                <Stat label="FUN query?" value={result.isFunQuery ? "Có" : "Không"} />
              </div>

              {(result.fallbackUsed || result.funEcosystemSeeded) && (
                <div className="space-y-2">
                  {result.fallbackUsed && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                      Fallback đã chạy — không có topic nào match keyword, đang dùng default.
                    </div>
                  )}
                  {result.funEcosystemSeeded && (
                    <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                      ✓ Đã seed các topic category <strong>FUN Ecosystem</strong>.
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Keywords đã extract:</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.extractedKeywords.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">(không có)</span>
                  )}
                  {result.extractedKeywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Top topics */}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-1">
                Top {result.topTopics.length} topics (gửi vào prompt)
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Đây chính là kiến thức mà bot Telegram sẽ "nhìn thấy" khi trả lời câu hỏi này.
              </p>
              <div className="space-y-3">
                {result.topTopics.map((t, i) => (
                  <TopicRow key={t.id} rank={i + 1} topic={t} used />
                ))}
                {result.topTopics.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Không có topic nào.</p>
                )}
              </div>
            </Card>

            {/* Excluded */}
            {result.excludedTopics.length > 0 && (
              <Card className="p-6 mb-6 opacity-70">
                <h2 className="text-lg font-semibold mb-1">
                  Bị loại ({result.excludedTopics.length})
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Match nhưng không lọt top 15 — bot KHÔNG thấy.
                </p>
                <div className="space-y-2">
                  {result.excludedTopics.map((t, i) => (
                    <TopicRow key={t.id} rank={16 + i} topic={t} />
                  ))}
                </div>
              </Card>
            )}

            {/* Final prompt sent to model */}
            <Card className="p-6 mb-6">
              <div className="flex items-start justify-between mb-2 gap-3 flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold">Prompt cuối cùng gửi tới model</h2>
                  <p className="text-xs text-muted-foreground">
                    Đây là <code className="px-1 bg-muted rounded">system</code> message thực tế model sẽ nhận
                    (ANGEL_AI base + xưng hô <Badge variant="outline" className="text-[10px] px-1.5 py-0 mx-1">{result.pronounStyle}</Badge>
                    + knowledge từ top {result.usedInContext} topics).
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={copyPrompt} className="gap-2 shrink-0">
                  {copiedPrompt ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  Copy prompt
                </Button>
              </div>
              <div className="flex gap-3 mb-3 text-xs text-muted-foreground">
                <span><strong>Model:</strong> {result.model}</span>
                <span>•</span>
                <span><strong>Length:</strong> {result.finalSystemPromptLength.toLocaleString()} chars</span>
                <span>•</span>
                <span><strong>~Tokens:</strong> ~{Math.ceil(result.finalSystemPromptLength / 4).toLocaleString()}</span>
              </div>
              <pre className="text-xs bg-muted/50 border rounded-lg p-4 overflow-auto max-h-[500px] whitespace-pre-wrap break-words font-mono">
{result.finalSystemPrompt}
              </pre>

              <details className="mt-4">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  Xem full messages array (system + user)
                </summary>
                <pre className="mt-2 text-xs bg-muted/30 border rounded-lg p-4 overflow-auto max-h-[300px] whitespace-pre-wrap break-words font-mono">
{JSON.stringify(result.finalMessages, null, 2)}
                </pre>
              </details>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? "bg-primary/10 border border-primary/30" : "bg-muted/50"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

function TopicRow({ rank, topic, used }: { rank: number; topic: RankedTopic; used?: boolean }) {
  return (
    <div
      className={`flex gap-3 p-3 rounded-lg border ${
        used ? "bg-green-50/50 border-green-200" : "bg-muted/30 border-border"
      }`}
    >
      <div className="flex flex-col items-center min-w-[40px]">
        <span className="text-xs text-muted-foreground">#{rank}</span>
        <span className="text-lg">{topic.icon || "✨"}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-medium text-sm">{topic.title}</h3>
          {topic.category && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{topic.category}</Badge>
          )}
          <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary hover:bg-primary/20">
            score {topic.score}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{topic.contentLength} chars</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-1.5">
          {topic.matchedKeywords.map((k) => (
            <span key={k} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">{k}</span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{topic.preview}</p>
      </div>
    </div>
  );
}
