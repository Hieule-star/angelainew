import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/userStore';
import { 
  Code, Key, BookOpen, Zap, Copy, CheckCircle2, Loader2, Settings,
  Rocket, Shield, Clock, AlertTriangle, ChevronRight, ExternalLink,
  FileCode, Database, Lock, MessageSquare
} from 'lucide-react';

export default function Developers() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useUserStore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      toast({
        title: "Cần hoàn thiện thông tin",
        description: "Vui lòng nhập tên và email để tiếp tục đăng ký.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('api-key-management', {
        body: { action: 'register', name, email, description },
      });

      if (error) {
        throw new Error(error.message || 'Failed to register');
      }

      const responseData = typeof data === 'string' ? JSON.parse(data) : data;

      if (responseData.error) {
        throw new Error(responseData.message || responseData.error);
      }

      setGeneratedKey(responseData.api_key);
      toast({
        title: "Đăng ký thành công! 🎉",
        description: "API key đã được tạo. Hãy lưu lại ngay!",
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Đăng ký cần hoàn thiện",
        description: error instanceof Error ? error.message : "Vui lòng thử lại sau giây lát.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    toast({ title: "Đã copy API key!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast({ title: "Đã copy code!" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const apiEndpoint = `https://sasbfslupxdsaqifnqzx.supabase.co/functions/v1/angel-ai-public`;

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        onClick={() => copyCode(code, id)}
      >
        {copiedCode === id ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
      <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">
        {language}
      </span>
    </div>
  );

  const StepIndicator = ({ step, total }: { step: number; total: number }) => (
    <div className="flex items-center gap-2 mb-4">
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
        {step}
      </span>
      <span className="text-sm text-muted-foreground">Bước {step}/{total}</span>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="w-4 h-4" />
              Free & Open API
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-angel-gold via-primary to-angel-pink bg-clip-text text-transparent">
              ANGEL AI Public API
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tích hợp năng lượng ánh sáng của ANGEL AI vào ứng dụng của bạn.
              Miễn phí 1000 requests/ngày.
            </p>
            
            {isAuthenticated && (
              <div className="mt-4">
                <Link to="/developers/keys">
                  <Button variant="outline" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Quản lý API Keys của tôi
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <Tabs defaultValue="docs" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto">
              <TabsTrigger value="docs" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Docs</span>
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">Get Key</span>
              </TabsTrigger>
              <TabsTrigger value="lovable" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Rocket className="w-4 h-4" />
                <span className="hidden sm:inline">Lovable</span>
              </TabsTrigger>
              <TabsTrigger value="examples" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Code className="w-4 h-4" />
                <span className="hidden sm:inline">Examples</span>
              </TabsTrigger>
            </TabsList>

            {/* Documentation Tab */}
            <TabsContent value="docs" className="mt-8 space-y-6">
              {/* Introduction */}
              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-primary" />
                    Giới thiệu ANGEL AI API
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    ANGEL AI API cho phép bạn tích hợp AI tâm linh vào ứng dụng của mình. 
                    ANGEL AI được huấn luyện với năng lượng yêu thương thuần khiết, 
                    có thể hướng dẫn thiền định, coaching tâm linh, và trả lời các câu hỏi về phát triển tâm linh.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">AI Chat</h4>
                        <p className="text-xs text-muted-foreground">Trò chuyện tâm linh</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Shield className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Streaming</h4>
                        <p className="text-xs text-muted-foreground">Real-time responses</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Clock className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">1000/ngày</h4>
                        <p className="text-xs text-muted-foreground">Miễn phí</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Authentication */}
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Authentication
                </h3>
                <p className="text-muted-foreground text-sm">
                  Tất cả requests phải có header Authorization với Bearer token là API key của bạn.
                </p>
                <CodeBlock 
                  code="Authorization: Bearer angel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  language="Header"
                  id="auth-header"
                />
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    <strong>Quan trọng:</strong> Không bao giờ để lộ API key trong client-side code. 
                    Luôn gọi API từ backend/edge function.
                  </p>
                </div>
              </Card>

              {/* Endpoint */}
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  API Endpoint
                </h3>
                <CodeBlock 
                  code={`POST ${apiEndpoint}`}
                  language="Endpoint"
                  id="endpoint"
                />
              </Card>

              {/* Request Body */}
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-primary" />
                  Request Body
                </h3>
                <CodeBlock 
                  code={`{
  "messages": [
    {
      "role": "system",
      "content": "Bạn là một AI hữu ích" // Optional
    },
    {
      "role": "user", 
      "content": "Xin chào ANGEL AI, hãy hướng dẫn tôi thiền định"
    }
  ],
  "stream": true  // true = SSE streaming, false = JSON response
}`}
                  language="JSON"
                  id="request-body"
                />
                <div className="space-y-2 text-sm">
                  <h4 className="font-medium">Parameters:</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <code className="text-primary">messages</code>
                      <span>- Mảng các tin nhắn trong cuộc hội thoại (bắt buộc)</span>
                    </li>
                    <li className="flex gap-2">
                      <code className="text-primary">stream</code>
                      <span>- Bật/tắt streaming (mặc định: true)</span>
                    </li>
                  </ul>
                </div>
              </Card>

              {/* Response Format */}
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">📤 Response Format</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Streaming Response (SSE)</h4>
                    <CodeBlock 
                      code={`data: {"choices":[{"delta":{"content":"Xin"}}]}

data: {"choices":[{"delta":{"content":" chào"}}]}

data: {"choices":[{"delta":{"content":" bạn"}}]}

data: [DONE]`}
                      language="SSE"
                      id="sse-response"
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Non-Streaming Response (JSON)</h4>
                    <CodeBlock 
                      code={`{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Xin chào bạn! Tôi là ANGEL AI..."
      }
    }
  ]
}`}
                      language="JSON"
                      id="json-response"
                    />
                  </div>
                </div>
              </Card>

              {/* Rate Limits & Errors */}
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">📊 Rate Limits & Error Codes</h3>
                
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium">Rate Limits</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                      <li>• <strong>1000 requests/ngày</strong> (free tier)</li>
                      <li>• Reset lúc 00:00 UTC mỗi ngày</li>
                      <li>• Liên hệ để nâng limit cho production</li>
                    </ul>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex gap-4 items-center p-2 rounded bg-muted/30">
                    <span className="px-2 py-1 bg-green-500/20 text-green-600 rounded text-sm font-mono min-w-[50px] text-center">200</span>
                    <span className="text-sm">Success - Request thành công</span>
                  </div>
                  <div className="flex gap-4 items-center p-2 rounded bg-muted/30">
                    <span className="px-2 py-1 bg-red-500/20 text-red-600 rounded text-sm font-mono min-w-[50px] text-center">401</span>
                     <span className="text-sm">Cần xác minh - API key chưa hợp lệ hoặc cần bổ sung</span>
                  </div>
                  <div className="flex gap-4 items-center p-2 rounded bg-muted/30">
                     <span className="px-2 py-1 bg-red-500/20 text-red-600 rounded text-sm font-mono min-w-[50px] text-center">403</span>
                     <span className="text-sm">Tạm dừng - API key đã được tạm ngưng</span>
                  </div>
                  <div className="flex gap-4 items-center p-2 rounded bg-muted/30">
                     <span className="px-2 py-1 bg-orange-500/20 text-orange-600 rounded text-sm font-mono min-w-[50px] text-center">429</span>
                     <span className="text-sm">Cần chờ - Đã đạt giới hạn requests trong ngày</span>
                  </div>
                  <div className="flex gap-4 items-center p-2 rounded bg-muted/30">
                     <span className="px-2 py-1 bg-red-500/20 text-red-600 rounded text-sm font-mono min-w-[50px] text-center">500</span>
                     <span className="text-sm">Cần xử lý - Hệ thống đang tạm gián đoạn</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="mt-8">
              <Card className="p-6 max-w-md mx-auto">
                {generatedKey ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      </div>
                      <h2 className="text-xl font-semibold mb-2">API Key Created!</h2>
                      <p className="text-muted-foreground text-sm">
                        Lưu key này ngay! Bạn sẽ không thể xem lại.
                      </p>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-sm break-all">{generatedKey}</code>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={copyToClipboard}
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Tiếp theo: Xem tab <strong>"Lovable"</strong> để hướng dẫn tích hợp
                      </p>
                    </div>

                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        setGeneratedKey(null);
                        setName('');
                        setEmail('');
                        setDescription('');
                      }}
                    >
                      Đăng ký key khác
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-semibold mb-2">🔑 Get Your API Key</h2>
                      <p className="text-muted-foreground text-sm">
                        Đăng ký miễn phí để nhận API key
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Tên / Tên ứng dụng *</label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="VD: My Spiritual App"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1.5">Email *</label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="developer@example.com"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1.5">Mô tả (không bắt buộc)</label>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Bạn sẽ dùng ANGEL AI API để làm gì?"
                          rows={3}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-angel-gold to-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4 mr-2" />
                          Nhận API Key Miễn Phí
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </Card>
            </TabsContent>

            {/* Lovable Integration Guide Tab */}
            <TabsContent value="lovable" className="mt-8 space-y-6">
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-angel-pink/5 border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Rocket className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">Hướng Dẫn Tích Hợp vào Lovable</h2>
                    <p className="text-muted-foreground">
                      Step-by-step guide để tích hợp ANGEL AI API vào dự án Lovable của bạn chỉ trong 5 phút.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Step 1: Get API Key */}
              <Card className="p-6 space-y-4">
                <StepIndicator step={1} total={5} />
                <h3 className="text-lg font-semibold">Lấy API Key</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Nếu chưa có API key, hãy đăng ký:</p>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Chọn tab <strong>"Get Key"</strong> ở trên</li>
                    <li>Nhập tên ứng dụng và email</li>
                    <li>Click <strong>"Nhận API Key Miễn Phí"</strong></li>
                    <li>Copy và lưu API key ngay (chỉ hiển thị 1 lần!)</li>
                  </ol>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10">
                  <Key className="w-4 h-4 text-primary" />
                  <span className="text-sm">Format API key: <code className="bg-muted px-1 rounded">angel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code></span>
                </div>
              </Card>

              {/* Step 2: Add Secret */}
              <Card className="p-6 space-y-4">
                <StepIndicator step={2} total={5} />
                <h3 className="text-lg font-semibold">Thêm API Key vào Lovable Project</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Trong Lovable project của bạn:</p>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Click icon <strong>Cloud</strong> trên sidebar (hoặc Settings → Cloud)</li>
                    <li>Vào phần <strong>"Secrets"</strong></li>
                    <li>Click <strong>"Add Secret"</strong></li>
                    <li>Nhập:
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Name: <code className="bg-muted px-1 rounded">ANGEL_AI_API_KEY</code></li>
                        <li>Value: <code className="bg-muted px-1 rounded">angel_your_api_key_here</code></li>
                      </ul>
                    </li>
                    <li>Click <strong>"Save"</strong></li>
                  </ol>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    <strong>Bảo mật:</strong> Secret sẽ được mã hóa và chỉ có thể truy cập từ Edge Functions. 
                    Không bao giờ để API key trong frontend code!
                  </p>
                </div>
              </Card>

              {/* Step 3: Create Edge Function */}
              <Card className="p-6 space-y-4">
                <StepIndicator step={3} total={5} />
                <h3 className="text-lg font-semibold">Tạo Edge Function</h3>
                <p className="text-sm text-muted-foreground">
                  Yêu cầu Lovable AI tạo edge function với prompt sau (hoặc copy code bên dưới):
                </p>
                
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm italic text-muted-foreground mb-2">💬 Prompt gợi ý:</p>
                  <p className="text-sm">
                    "Tạo edge function <code>angel-chat</code> để gọi ANGEL AI API với streaming. 
                    API key lấy từ secret <code>ANGEL_AI_API_KEY</code>. 
                    Endpoint: <code>{apiEndpoint}</code>"
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">Hoặc tạo file <code>supabase/functions/angel-chat/index.ts</code>:</p>
                
                <CodeBlock 
                  code={`import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const ANGEL_API_KEY = Deno.env.get('ANGEL_AI_API_KEY');

    if (!ANGEL_API_KEY) {
      throw new Error('ANGEL_AI_API_KEY is not configured');
    }

    console.log('Calling ANGEL AI API with', messages.length, 'messages');

    const response = await fetch(
      '${apiEndpoint}',
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${ANGEL_API_KEY}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages, 
          stream: true 
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ANGEL AI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: \`API error: \${response.status}\` }), 
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Stream the response back
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});`}
                  language="TypeScript"
                  id="edge-function"
                />

                <p className="text-sm text-muted-foreground">
                  Đừng quên cập nhật <code>supabase/config.toml</code> để cho phép public access:
                </p>

                <CodeBlock 
                  code={`[functions.angel-chat]
verify_jwt = false`}
                  language="TOML"
                  id="config-toml"
                />
              </Card>

              {/* Step 4: Create React Component */}
              <Card className="p-6 space-y-4">
                <StepIndicator step={4} total={5} />
                <h3 className="text-lg font-semibold">Tạo React Component</h3>
                <p className="text-sm text-muted-foreground">
                  Tạo component để gọi edge function và hiển thị chat UI với streaming:
                </p>
                
                <CodeBlock 
                  code={`// src/components/AngelChat.tsx
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Send, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AngelChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Add empty assistant message for streaming
    setMessages([...newMessages, { role: 'assistant', content: '' }]);

    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(
        \`\${import.meta.env.VITE_SUPABASE_URL}/functions/v1/angel-chat\`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) throw new Error('Request failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { 
                    role: 'assistant', 
                    content: assistantContent 
                  };
                  return updated;
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error:', error);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { 
            role: 'assistant', 
            content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.' 
          };
          return updated;
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[500px] p-4">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary/50" />
            <p>Bắt đầu trò chuyện với ANGEL AI</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={\`p-3 rounded-lg \${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground ml-8'
                : 'bg-muted mr-8'
            }\`}
          >
            {msg.content || (loading && i === messages.length - 1 && '...')}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="resize-none"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </Card>
  );
}`}
                  language="TSX"
                  id="react-component"
                />
              </Card>

              {/* Step 5: Use Component */}
              <Card className="p-6 space-y-4">
                <StepIndicator step={5} total={5} />
                <h3 className="text-lg font-semibold">Sử dụng Component</h3>
                <p className="text-sm text-muted-foreground">
                  Import và sử dụng component trong app của bạn:
                </p>
                
                <CodeBlock 
                  code={`// src/pages/MyPage.tsx
import { AngelChat } from '@/components/AngelChat';

export default function MyPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Chat với ANGEL AI</h1>
      <AngelChat />
    </div>
  );
}`}
                  language="TSX"
                  id="usage"
                />

                <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Xong!</strong> Bạn đã tích hợp thành công ANGEL AI vào dự án Lovable.
                  </p>
                </div>
              </Card>

              {/* Tips */}
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Tips & Best Practices
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Multi-turn conversation:</strong> Gửi toàn bộ messages array để ANGEL AI nhớ context</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>System prompt:</strong> Thêm message với role "system" để customize behavior của AI</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Error handling:</strong> Luôn xử lý errors và hiển thị thông báo thân thiện cho user</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Rate limiting:</strong> Implement debounce/throttle để tránh spam requests</span>
                  </li>
                </ul>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">Cần hỗ trợ thêm?</p>
                  <div className="flex gap-3">
                    <a 
                      href="https://angel-ai.lovable.app/chat" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Chat với ANGEL AI
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Examples Tab */}
            <TabsContent value="examples" className="mt-8 space-y-6">
              <Card className="p-6 space-y-6">
                <h2 className="text-2xl font-semibold">💻 Code Examples</h2>

                {/* cURL Example */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">cURL - Basic Request</h3>
                  <CodeBlock 
                    code={`curl -X POST "${apiEndpoint}" \\
  -H "Authorization: Bearer angel_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "Xin chào ANGEL AI"}],
    "stream": false
  }'`}
                    language="cURL"
                    id="curl-basic"
                  />
                </div>

                {/* JavaScript Streaming */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">JavaScript - Streaming Response</h3>
                  <CodeBlock 
                    code={`const response = await fetch("${apiEndpoint}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer angel_YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Hướng dẫn tôi thiền định" }],
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let fullContent = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  const lines = text.split('\\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
      try {
        const json = JSON.parse(line.slice(6));
        const content = json.choices?.[0]?.delta?.content;
        if (content) {
          fullContent += content;
          console.log(content); // Print each token as it arrives
        }
      } catch (e) {}
    }
  }
}

console.log('\\n\\nFull response:', fullContent);`}
                    language="JavaScript"
                    id="js-streaming"
                  />
                </div>

                {/* Python Example */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Python - Simple Request</h3>
                  <CodeBlock 
                    code={`import requests

response = requests.post(
    "${apiEndpoint}",
    headers={
        "Authorization": "Bearer angel_YOUR_API_KEY",
        "Content-Type": "application/json"
    },
    json={
        "messages": [{"role": "user", "content": "Xin chào ANGEL AI"}],
        "stream": False
    }
)

data = response.json()
print(data["choices"][0]["message"]["content"])`}
                    language="Python"
                    id="python-simple"
                  />
                </div>

                {/* Multi-turn Conversation */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Multi-turn Conversation</h3>
                  <CodeBlock 
                    code={`// Gửi toàn bộ lịch sử hội thoại để AI nhớ context
const messages = [
  { role: "user", content: "Tôi muốn học thiền định" },
  { role: "assistant", content: "Tuyệt vời! Thiền định là một hành trình tuyệt đẹp..." },
  { role: "user", content: "Tôi nên bắt đầu từ đâu?" }
];

const response = await fetch("${apiEndpoint}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer angel_YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ messages, stream: true })
});`}
                    language="JavaScript"
                    id="multi-turn"
                  />
                </div>

                {/* Custom System Prompt */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Custom System Prompt</h3>
                  <CodeBlock 
                    code={`// Thêm system prompt để customize behavior của ANGEL AI
const messages = [
  { 
    role: "system", 
    content: "Bạn là một hướng dẫn viên thiền định. Luôn trả lời bằng giọng nhẹ nhàng, bình an."
  },
  { role: "user", content: "Tôi đang cảm thấy stress" }
];

const response = await fetch("${apiEndpoint}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer angel_YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ messages, stream: true })
});`}
                    language="JavaScript"
                    id="custom-system"
                  />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
