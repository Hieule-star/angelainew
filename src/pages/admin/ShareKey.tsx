import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Copy, Loader2, Share2, FileText } from "lucide-react";

const ENDPOINT =
  "https://sasbfslupxdsaqifnqzx.supabase.co/functions/v1/angel-ai-public";
const INTEGRATION_URL = `${window.location.origin}/integration`;

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  email: string;
  description: string | null;
  daily_limit: number;
  is_active: boolean;
}

export default function ShareKey() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("api_keys")
        .select("id, key_prefix, name, email, description, daily_limit, is_active")
        .eq("id", id!)
        .maybeSingle();
      setApiKey(data as ApiKey | null);
      setLoading(false);
    })();
  }, [id]);

  const copy = (text: string, label = "Đã copy") => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} ✨` });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!apiKey) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p>Không tìm thấy API key.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/admin/api-keys"><ArrowLeft className="w-4 h-4 mr-2" />Quay lại</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const placeholder = `${apiKey.key_prefix}...REPLACE_WITH_FULL_KEY`;

  const curl = `curl -X POST ${ENDPOINT} \\
  -H "Authorization: Bearer ${placeholder}" \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"Giải thích 8 Thần Chú"}]}'`;

  const js = `await fetch("${ENDPOINT}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${placeholder}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Giải thích 8 Thần Chú" }],
  }),
});`;

  const fullPackage = `# Tích hợp Angel AI cho ${apiKey.name}

Chào ${apiKey.name} ✨,

Đây là gói tài liệu tích hợp Angel AI — bạn có thể nhúng vào app/website của mình
và chat với Angel AI cùng knowledge base (FUN Ecosystem, 8 Thần Chú, Hiến Pháp,
các bài dẫn thiền) như bản chính chủ tại angel-ai-chavutru.lovable.app.

## API key
- Prefix: \`${apiKey.key_prefix}...\` (full key đã gửi riêng cho bạn)
- Quota: ${apiKey.daily_limit.toLocaleString()} requests/ngày

## Endpoint
\`\`\`
POST ${ENDPOINT}
Authorization: Bearer ${apiKey.key_prefix}...REPLACE_WITH_FULL_KEY
Content-Type: application/json
\`\`\`

## Ví dụ cURL
\`\`\`bash
${curl}
\`\`\`

## Ví dụ JavaScript
\`\`\`js
${js}
\`\`\`

## Hướng dẫn đầy đủ + Try it
${INTEGRATION_URL}

## Best practices
- Không nhúng key trực tiếp ở frontend production — proxy qua server hoặc Cloudflare Worker.
- Gửi nguyên \`messages\` history để Angel giữ ngữ cảnh.
- Render reply bằng markdown để hiển thị đẹp.
- Theo dõi quota để tránh 429.

Có gì cần hỗ trợ cứ liên hệ Angel AI team nhé 🌿`;

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/api-keys"><ArrowLeft className="w-4 h-4 mr-2" />API Keys</Link>
          </Button>
          <Badge variant={apiKey.is_active ? "default" : "secondary"}>
            {apiKey.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="w-6 h-6 text-primary" />
            Chia sẻ Angel AI — {apiKey.name}
          </h1>
          <p className="text-muted-foreground">
            {apiKey.email} · Quota {apiKey.daily_limit.toLocaleString()} req/ngày · Key prefix{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{apiKey.key_prefix}...</code>
          </p>
        </div>

        <Card className="p-5 space-y-3 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <p className="font-medium">Gói tài liệu sẵn sàng gửi đối tác</p>
            </div>
            <Button size="sm" onClick={() => copy(fullPackage, "Đã copy gói tài liệu")}>
              <Copy className="w-4 h-4 mr-2" />Copy markdown
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Dán thẳng vào Zalo / Email / Notion — đã pre-fill tên, key prefix, quota, snippet và link hướng dẫn.
          </p>
          <pre className="bg-muted rounded p-3 text-xs overflow-x-auto max-h-72">
            <code>{fullPackage}</code>
          </pre>
        </Card>

        <Card className="p-5 space-y-3">
          <p className="font-medium">Link hướng dẫn công khai</p>
          <div className="flex items-center gap-2 bg-muted rounded p-3">
            <code className="text-xs flex-1 break-all">{INTEGRATION_URL}</code>
            <Button size="sm" variant="ghost" onClick={() => copy(INTEGRATION_URL, "Đã copy link")}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Trang này có Quickstart, mini playground "Try it", và 5 snippet (cURL/JS/Python/React/Worker).
          </p>
        </Card>

        <Card className="p-5 space-y-4">
          <p className="font-medium">Snippet pre-fill</p>
          <p className="text-xs text-muted-foreground">
            Chỉ key prefix được lưu trong DB. Thay <code className="bg-muted px-1 rounded">REPLACE_WITH_FULL_KEY</code> bằng full key đã gửi đối tác lúc tạo.
          </p>
          {[
            { label: "cURL", code: curl },
            { label: "JavaScript", code: js },
          ].map(({ label, code }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{label}</p>
                <Button size="sm" variant="ghost" onClick={() => copy(code)}>
                  <Copy className="w-3.5 h-3.5 mr-1" />Copy
                </Button>
              </div>
              <pre className="bg-muted rounded p-3 text-xs overflow-x-auto"><code>{code}</code></pre>
            </div>
          ))}
        </Card>
      </div>
    </AdminLayout>
  );
}
