import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  Key,
  Sparkles,
  Shield,
  Gauge,
  BookOpen,
  PlayCircle,
  Loader2,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { Link } from "react-router-dom";

const ENDPOINT =
  "https://sasbfslupxdsaqifnqzx.supabase.co/functions/v1/angel-ai-public";

export default function Integration() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("angel_xxxxxxxxxxxxxxxx");

  // Mini playground state
  const [tryQuestion, setTryQuestion] = useState("Giải thích 8 Thần Chú giúp mình");
  const [tryLoading, setTryLoading] = useState(false);
  const [tryAnswer, setTryAnswer] = useState<string>("");
  const [tryError, setTryError] = useState<string>("");

  const copy = (text: string, label = "Đã copy") => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} ✨` });
  };

  const runTry = async () => {
    setTryError("");
    setTryAnswer("");
    if (!apiKey || apiKey.includes("xxxx")) {
      setTryError("Dán API key thật ở ô phía trên trước nhé.");
      return;
    }
    setTryLoading(true);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: tryQuestion }],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTryError(data?.error || `HTTP ${res.status}`);
      } else {
        setTryAnswer(data.message || JSON.stringify(data));
      }
    } catch (e: any) {
      setTryError(e?.message || "Network error");
    } finally {
      setTryLoading(false);
    }
  };

  const curlSnippet = `curl -X POST ${ENDPOINT} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      { "role": "user", "content": "Giải thích 8 Thần Chú giúp mình" }
    ]
  }'`;

  const jsSnippet = `const res = await fetch("${ENDPOINT}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: [
      { role: "user", content: "Giải thích 8 Thần Chú giúp mình" },
    ],
  }),
});
const data = await res.json();
console.log(data.message);`;

  const pySnippet = `import requests

res = requests.post(
    "${ENDPOINT}",
    headers={
        "Authorization": "Bearer ${apiKey}",
        "Content-Type": "application/json",
    },
    json={
        "messages": [
            {"role": "user", "content": "Giải thích 8 Thần Chú giúp mình"},
        ],
    },
    timeout=60,
)
print(res.json()["message"])`;

  const reactWidget = `// AngelChatWidget.tsx — copy-paste vào React app của bạn
import { useState } from "react";

const ENDPOINT = "${ENDPOINT}";
// ⚠️ Production: KHÔNG nhúng key trực tiếp ở frontend.
// Hãy proxy qua server/Cloudflare Worker (xem tab "Cloudflare Worker").
const API_KEY = import.meta.env.VITE_ANGEL_KEY!;

type Msg = { role: "user" | "assistant"; content: string };

export default function AngelChatWidget() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const next: Msg[] = [...messages, { role: "user", content: input }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: \`Bearer \${API_KEY}\`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-3">
      <div className="space-y-2 h-80 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <span className="inline-block px-3 py-2 rounded-lg bg-gray-100">
              {m.content}
            </span>
          </div>
        ))}
        {loading && <p className="text-sm text-gray-400">Angel đang trả lời…</p>}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Hỏi Angel AI…"
        />
        <button onClick={send} className="px-4 py-2 bg-black text-white rounded">
          Gửi
        </button>
      </div>
    </div>
  );
}`;

  const workerSnippet = `// Cloudflare Worker: giấu API key, chỉ expose proxy endpoint cho frontend.
// Deploy worker, set secret ANGEL_API_KEY, rồi frontend gọi worker URL thay vì gọi thẳng Angel.

export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const body = await req.text();
    const upstream = await fetch("${ENDPOINT}", {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${env.ANGEL_API_KEY}\`,
        "Content-Type": "application/json",
      },
      body,
    });
    const data = await upstream.text();
    return new Response(data, {
      status: upstream.status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  },
};`;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" /> Public API
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Tích hợp Angel AI
          </h1>
          <p className="text-muted-foreground text-lg">
            Gọi Angel AI từ ứng dụng của bạn với cùng knowledge base như bản
            chính chủ — RAG đầy đủ về FUN Ecosystem, 8 Thần Chú, Hiến Pháp FUN
            Kingdom, các bài dẫn thiền và hơn thế.
          </p>
        </div>

        {/* Quickstart */}
        <Card className="p-6 border-primary/20 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="font-medium">Quickstart trong 3 bước</p>
          </div>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <div>
                <p className="font-medium">Lấy API key</p>
                <p className="text-muted-foreground">
                  Vào <Link to="/developers" className="text-primary underline">/developers</Link> tự tạo developer key (miễn phí, 1.000 req/ngày), hoặc nhờ admin cấp key riêng cho tổ chức.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <div>
                <p className="font-medium">Dán key vào ô bên dưới</p>
                <p className="text-muted-foreground">Mọi snippet trên trang sẽ tự nhúng key thật. Key chỉ lưu trong trình duyệt.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <div>
                <p className="font-medium">Bấm "Try it" để test thật</p>
                <p className="text-muted-foreground">Gọi thẳng endpoint Angel AI và xem câu trả lời ngay tại đây.</p>
              </div>
            </li>
          </ol>
        </Card>

        {/* Key input */}
        <Card className="p-5 space-y-3 border-primary/20">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            <p className="font-medium">API key của bạn</p>
          </div>
          <Input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="angel_xxxxxxxxxxxxxxxx"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Dán key vào đây để các snippet bên dưới tự nhúng key thật. Key chỉ
            lưu trong React state — không gửi đi đâu cả.
          </p>
        </Card>

        {/* Try it playground */}
        <Card className="p-5 space-y-3 border-primary/20">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-primary" />
            <p className="font-medium">Try it — test trực tiếp</p>
          </div>
          <Textarea
            value={tryQuestion}
            onChange={(e) => setTryQuestion(e.target.value)}
            placeholder="Hỏi Angel AI bất cứ điều gì…"
            rows={2}
          />
          <Button onClick={runTry} disabled={tryLoading}>
            {tryLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
            Gọi Angel AI
          </Button>
          {tryError && (
            <div className="text-sm text-destructive bg-destructive/10 rounded p-3">
              {tryError}
            </div>
          )}
          {tryAnswer && (
            <div className="bg-muted rounded p-4 text-sm whitespace-pre-wrap">
              {tryAnswer}
            </div>
          )}
        </Card>

        {/* Endpoint */}
        <Card className="p-5 space-y-3">
          <p className="font-medium">Endpoint</p>
          <div className="flex items-center gap-2 bg-muted rounded-md p-3">
            <code className="text-xs md:text-sm flex-1 break-all">{`POST ${ENDPOINT}`}</code>
            <Button size="sm" variant="ghost" onClick={() => copy(ENDPOINT, "Đã copy endpoint")}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Header bắt buộc:{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              Authorization: Bearer angel_xxx
            </code>
          </p>
        </Card>

        {/* Snippets */}
        <Card className="p-5 space-y-4">
          <p className="font-medium">Ví dụ tích hợp</p>
          <Tabs defaultValue="curl">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="js">JavaScript</TabsTrigger>
              <TabsTrigger value="py">Python</TabsTrigger>
              <TabsTrigger value="react">React Widget</TabsTrigger>
              <TabsTrigger value="worker">Cloudflare Worker</TabsTrigger>
            </TabsList>
            {[
              { v: "curl", code: curlSnippet },
              { v: "js", code: jsSnippet },
              { v: "py", code: pySnippet },
              { v: "react", code: reactWidget },
              { v: "worker", code: workerSnippet },
            ].map(({ v, code }) => (
              <TabsContent key={v} value={v}>
                <div className="relative">
                  <pre className="bg-muted rounded-md p-4 text-xs md:text-sm overflow-x-auto max-h-[480px]">
                    <code>{code}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copy(code, "Đã copy snippet")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>

        {/* Response schema */}
        <Card className="p-5 space-y-3">
          <p className="font-medium">Response</p>
          <pre className="bg-muted rounded-md p-4 text-xs md:text-sm overflow-x-auto">
            <code>{`{
  "message": "...câu trả lời của Angel AI (đã RAG knowledge base)...",
  "model": "google/gemini-3.1-flash-lite",
  "usage": { "prompt_tokens": 1234, "completion_tokens": 256 }
}`}</code>
          </pre>
          <p className="text-sm text-muted-foreground">
            Trường <code>messages</code> theo chuẩn OpenAI:{" "}
            <code>{`{ role: "user" | "assistant" | "system", content: string }`}</code>
            . Gửi nguyên lịch sử hội thoại để Angel AI giữ ngữ cảnh.
          </p>
        </Card>

        {/* Best practices */}
        <Card className="p-5 space-y-3 border-primary/20">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <p className="font-medium">Best practices</p>
          </div>
          <ul className="text-sm space-y-2">
            {[
              "Không nhúng API key trực tiếp ở frontend production — proxy qua server hoặc Cloudflare Worker.",
              "Gửi đủ lịch sử messages để Angel AI giữ ngữ cảnh hội thoại (tối đa ~20 lượt gần nhất là đủ).",
              "Render reply bằng markdown (react-markdown) để format đẹp như bản chính chủ.",
              "Bật retry với exponential backoff cho lỗi 5xx, dừng khi gặp 401 hoặc 429.",
              "Theo dõi quota tại /developers/keys để tránh hết hạn mức trong giờ cao điểm.",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Limits / errors */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" />
              <p className="font-medium">Giới hạn</p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>Mặc định 1.000 requests / ngày / key</li>
              <li>Quota có thể nâng theo thoả thuận</li>
              <li>Mỗi key được log chi tiết để minh bạch sử dụng</li>
            </ul>
          </Card>
          <Card className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <p className="font-medium">Mã lỗi</p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">401</code> — thiếu hoặc sai API key</li>
              <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">429</code> — vượt quota ngày, thử lại sau</li>
              <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">5xx</code> — lỗi tạm thời, retry với backoff</li>
            </ul>
          </Card>
        </div>

        {/* CTA */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <p className="font-medium">Lấy API key</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Đăng nhập rồi vào{" "}
            <Link to="/developers" className="text-primary underline">/developers</Link>{" "}
            để tự tạo developer key, hoặc liên hệ admin để được cấp key riêng cho ứng dụng / tổ chức.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button asChild>
              <Link to="/developers">Tạo key ngay</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/docs/platform">Xem docs đầy đủ</Link>
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
