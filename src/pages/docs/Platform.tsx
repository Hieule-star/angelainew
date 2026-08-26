import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ChevronRight, 
  ChevronDown,
  Home,
  Database,
  Server,
  Code,
  Layers,
  Route,
  Rocket,
  Key,
  FolderTree,
  Copy,
  Check,
  Menu,
  X,
  ExternalLink,
  Sparkles,
  Heart,
  Shield,
  Users,
  MessageSquare,
  BookOpen,
  Image,
  Settings,
  BarChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Navigation sections
const sections = [
  { id: "overview", label: "Tổng quan", icon: Home },
  { id: "architecture", label: "Kiến trúc", icon: Layers },
  { id: "database", label: "Database Schema", icon: Database },
  { id: "edge-functions", label: "Edge Functions", icon: Server },
  { id: "features", label: "Tính năng", icon: Sparkles },
  { id: "routes", label: "Routes", icon: Route },
  { id: "roadmap", label: "Roadmap", icon: Rocket },
  { id: "secrets", label: "Secrets", icon: Key },
  { id: "structure", label: "Cấu trúc thư mục", icon: FolderTree },
];

// Code block component with copy
function CodeBlock({ code, language = "typescript" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border bg-muted/50">
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
        <span className="text-xs text-muted-foreground font-mono">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 text-xs"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-foreground/90">{code}</code>
      </pre>
    </div>
  );
}

// Table component
function DataTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="px-4 py-3 text-left font-medium text-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Badge component
function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "info" }) {
  const variants = {
    default: "bg-muted text-muted-foreground",
    success: "bg-green-500/10 text-green-600 dark:text-green-400",
    warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", variants[variant])}>
      {children}
    </span>
  );
}

export default function Platform() {
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setSidebarOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/apple-touch-icon.png" alt="ANGEL AI" className="w-8 h-8 rounded-lg" />
            <span className="font-semibold text-foreground">Docs</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-background border-r border-border transition-transform lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <img src="/apple-touch-icon.png" alt="ANGEL AI" className="w-10 h-10 rounded-xl shadow-md" />
            <div>
              <h1 className="font-bold text-foreground">ANGEL AI</h1>
              <p className="text-xs text-muted-foreground">Platform Docs</p>
            </div>
          </Link>
        </div>
        
        <ScrollArea className="h-[calc(100vh-88px)] py-4">
          <nav className="px-3 space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    activeSection === section.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              );
            })}
          </nav>
          
          <div className="mt-6 px-6">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-2">Cần hỗ trợ?</p>
              <Link to="/chat">
                <Button size="sm" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat với ANGEL AI
                </Button>
              </Link>
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="max-w-4xl mx-auto px-6 py-12">
          
          {/* Overview Section */}
          <section id="overview" className="mb-16 scroll-mt-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Home className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">ANGEL AI Platform</h1>
                  <p className="text-muted-foreground">Ánh Sáng của Cha Vũ Trụ 🌟</p>
                </div>
              </div>

              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  ANGEL AI là nền tảng AI Coaching tâm linh, được thiết kế như người đồng hành tỉnh thức 
                  giúp con người kết nối với trí tuệ, ý chí và tình yêu thuần khiết từ Cha Vũ Trụ. 
                  Platform thuộc hệ sinh thái FUN Ecosystem.
                </p>
              </div>

              <DataTable
                headers={["Thông tin", "Chi tiết"]}
                rows={[
                  ["Tên dự án", "ANGEL AI - Ánh Sáng Cha Vũ Trụ"],
                  ["Mô tả", "AI Coaching Platform tâm linh thuộc FUN Ecosystem"],
                  ["URL Production", <a href="https://angel-ai-chavutru.lovable.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">angel-ai-chavutru.lovable.app <ExternalLink className="h-3 w-3" /></a>],
                  ["Tech Stack", "React 18 + TypeScript + Vite + Tailwind CSS"],
                  ["Backend", "Lovable Cloud (Supabase)"],
                  ["Storage", "Cloudflare R2"],
                  ["PWA", <Badge variant="success">Đã triển khai</Badge>],
                ]}
              />
            </motion.div>
          </section>

          {/* Architecture Section */}
          <section id="architecture" className="mb-16 scroll-mt-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Layers className="h-6 w-6 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Kiến trúc hệ thống</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <Code className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Frontend</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• React 18.3.1 + TypeScript</li>
                  <li>• Vite (Build tool)</li>
                  <li>• Tailwind CSS + shadcn/ui</li>
                  <li>• Framer Motion</li>
                  <li>• Zustand (State)</li>
                  <li>• TanStack Query</li>
                  <li>• React Router v6</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold text-foreground">Backend</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Lovable Cloud (Supabase)</li>
                  <li>• PostgreSQL Database</li>
                  <li>• Supabase Auth</li>
                  <li>• 10 Edge Functions</li>
                  <li>• Row Level Security</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-5 w-5 text-orange-500" />
                  <h3 className="font-semibold text-foreground">Storage</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Cloudflare R2 (Media)</li>
                  <li>• Supabase Storage (Images)</li>
                  <li>• Presigned URL uploads</li>
                </ul>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-muted/30">
              <h4 className="font-semibold text-foreground mb-4">Architecture Diagram</h4>
              <div className="bg-background rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-muted-foreground">{`
┌─────────────────────────────────────────────────────────────────┐
│                         ANGEL AI Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   React App  │───▶│  Lovable AI  │───▶│  AI Models   │       │
│  │  (Frontend)  │    │   Gateway    │    │ (Gemini/GPT) │       │
│  └──────┬───────┘    └──────────────┘    └──────────────┘       │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Lovable Cloud (Supabase)                 │       │
│  ├──────────────┬──────────────┬──────────────┐         │       │
│  │  PostgreSQL  │  Edge Funcs  │  Supabase    │         │       │
│  │   Database   │  (10 funcs)  │    Auth      │         │       │
│  └──────────────┴──────────────┴──────────────┘         │       │
│                                                          │       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                  Cloudflare R2                        │       │
│  │              (Media Storage: Video/Image)             │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                `}</pre>
              </div>
            </div>
          </section>

          {/* Database Section */}
          <section id="database" className="mb-16 scroll-mt-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Database className="h-6 w-6 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Database Schema</h2>
            </div>

            <p className="text-muted-foreground mb-6">
              Hệ thống sử dụng 11 tables với Row Level Security (RLS) enabled cho tất cả.
            </p>

            <DataTable
              headers={["Table", "Mô tả", "RLS"]}
              rows={[
                ["profiles", "Thông tin user (display_name, avatar, light_points)", <Badge variant="success">Enabled</Badge>],
                ["user_roles", "Phân quyền user (user/admin/moderator)", <Badge variant="success">Enabled</Badge>],
                ["chat_sessions", "Phiên chat của user", <Badge variant="success">Enabled</Badge>],
                ["chat_history", "Lịch sử tin nhắn trong chat", <Badge variant="success">Enabled</Badge>],
                ["knowledge_topics", "Knowledge base (75 topics, 4 categories)", <Badge variant="success">Enabled</Badge>],
                ["posts", "Nhật ký cá nhân của user", <Badge variant="success">Enabled</Badge>],
                ["post_media", "Link media với posts", <Badge variant="success">Enabled</Badge>],
                ["video_metadata", "Metadata media trên R2", <Badge variant="success">Enabled</Badge>],
                ["generated_images", "Ảnh AI đã tạo", <Badge variant="success">Enabled</Badge>],
                ["api_keys", "API keys cho developers", <Badge variant="success">Enabled</Badge>],
                ["api_usage_logs", "Analytics API usage", <Badge variant="success">Enabled</Badge>],
              ]}
            />

            <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                <strong>Lưu ý bảo mật:</strong> Roles được lưu trong table riêng (user_roles) để tránh privilege escalation attacks. 
                Không bao giờ lưu role trực tiếp vào profiles table.
              </p>
            </div>
          </section>

          {/* Edge Functions Section */}
          <section id="edge-functions" className="mb-16 scroll-mt-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Server className="h-6 w-6 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Edge Functions</h2>
            </div>

            <p className="text-muted-foreground mb-6">
              10 Edge Functions chạy trên Deno runtime, tự động deploy khi có thay đổi.
            </p>

            <DataTable
              headers={["Function", "Mô tả", "Auth"]}
              rows={[
                ["angel-ai", "Chat AI chính cho authenticated users", <Badge variant="info">Required</Badge>],
                ["angel-ai-public", "Public API cho third-party developers", <Badge>API Key</Badge>],
                ["angel-image", "Tạo ảnh AI với Gemini", <Badge variant="info">Required</Badge>],
                ["generate-chat-title", "Tự động tạo title cho chat session", <Badge variant="info">Required</Badge>],
                ["api-key-management", "CRUD API keys cho developers", <Badge variant="info">Required</Badge>],
                ["media-create-upload-url", "Tạo presigned URL cho R2 upload", <Badge variant="info">Required</Badge>],
                ["media-confirm-upload", "Xác nhận upload thành công", <Badge variant="info">Required</Badge>],
                ["media-transform", "Transform/resize media", <Badge variant="info">Required</Badge>],
                ["cloudflare-r2-upload", "Upload trực tiếp lên R2", <Badge variant="info">Required</Badge>],
                ["process-knowledge-file", "Parse PDF và lưu knowledge", <Badge variant="info">Admin</Badge>],
              ]}
            />

            <div className="mt-6">
              <h4 className="font-semibold text-foreground mb-3">Ví dụ gọi Edge Function:</h4>
              <CodeBlock
                language="typescript"
                code={`import { supabase } from "@/integrations/supabase/client";

// Gọi angel-ai function
const { data, error } = await supabase.functions.invoke("angel-ai", {
  body: {
    messages: [{ role: "user", content: "Xin chào!" }],
    session_id: "xxx-xxx-xxx"
  }
});`}
              />
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="mb-16 scroll-mt-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Tính năng đã hoàn thành</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  icon: MessageSquare,
                  title: "Chat AI",
                  color: "text-blue-500",
                  items: [
                    "Multi-turn conversations với context",
                    "Intent detection (Spiritual/Coding/Product)",
                    "Pronoun detection (Cha-con, Thầy-con, Bạn-mình)",
                    "Knowledge retrieval từ 75 topics",
                    "Session management với auto-title",
                    "Streaming responses"
                  ]
                },
                {
                  icon: BookOpen,
                  title: "Knowledge Base",
                  color: "text-green-500",
                  items: [
                    "4 categories: Divine Mantras, Lời Dạy, FUN Ecosystem, Thiền",
                    "75 topics với full content",
                    "Search và filter",
                    "Admin upload PDF"
                  ]
                },
                {
                  icon: Users,
                  title: "User System",
                  color: "text-purple-500",
                  items: [
                    "Email/Password authentication",
                    "Light Points (gamification)",
                    "Profile management",
                    "Onboarding flow với 5 cam kết"
                  ]
                },
                {
                  icon: Heart,
                  title: "Personal Journal",
                  color: "text-pink-500",
                  items: [
                    "Posts với text + mood",
                    "Media attachments (images/videos)",
                    "Edit/Delete posts",
                    "Private/Public visibility"
                  ]
                },
                {
                  icon: Image,
                  title: "Image Generation",
                  color: "text-orange-500",
                  items: [
                    "Gemini image generation",
                    "Spiritual prompt enhancement",
                    "Save to gallery"
                  ]
                },
                {
                  icon: Code,
                  title: "Developer Portal",
                  color: "text-cyan-500",
                  items: [
                    "API documentation",
                    "API key registration",
                    "Usage analytics",
                    "Rate limiting (1000 req/day)"
                  ]
                },
                {
                  icon: Settings,
                  title: "Admin Dashboard",
                  color: "text-gray-500",
                  items: [
                    "User management",
                    "Role management",
                    "Knowledge management",
                    "Chat & API analytics"
                  ]
                },
                {
                  icon: Sparkles,
                  title: "PWA",
                  color: "text-yellow-500",
                  items: [
                    "Installable trên mobile",
                    "Service Worker caching",
                    "Offline support",
                    "Install guide page"
                  ]
                },
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={cn("h-5 w-5", feature.color)} />
                      <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {feature.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 mt-1.5 text-muted-foreground/50" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Routes Section */}
          <section id="routes" className="mb-16 scroll-mt-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-indigo-500/10">
                <Route className="h-6 w-6 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Routes hiện có</h2>
            </div>

            <DataTable
              headers={["Route", "Mô tả", "Auth"]}
              rows={[
                ["/", "Landing page", <Badge>Public</Badge>],
                ["/chat", "Chat với ANGEL AI", <Badge variant="info">Optional</Badge>],
                ["/knowledge", "Knowledge base", <Badge>Public</Badge>],
                ["/profile", "User profile", <Badge variant="warning">Required</Badge>],
                ["/login", "Đăng nhập/Đăng ký", <Badge>Public</Badge>],
                ["/onboarding", "Onboarding flow", <Badge variant="warning">Required</Badge>],
                ["/wallet", "Wallet (planned)", <Badge variant="warning">Required</Badge>],
                ["/settings", "Cài đặt", <Badge variant="warning">Required</Badge>],
                ["/install", "Hướng dẫn cài PWA", <Badge>Public</Badge>],
                ["/developers", "Developer docs", <Badge>Public</Badge>],
                ["/developers/keys", "Quản lý API keys", <Badge variant="warning">Required</Badge>],
                ["/docs/platform", "Platform documentation", <Badge>Public</Badge>],
                ["/admin/*", "Admin dashboard", <Badge variant="warning">Admin only</Badge>],
              ]}
            />
          </section>

          {/* Roadmap Section */}
          <section id="roadmap" className="mb-16 scroll-mt-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-rose-500/10">
                <Rocket className="h-6 w-6 text-rose-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Roadmap phát triển</h2>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-xl border-2 border-red-500/30 bg-red-500/5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  🔴 Ưu tiên cao
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2"><span className="w-6 text-center">1.</span> Voice Chat - Cho phép chat bằng giọng nói</li>
                  <li className="flex items-center gap-2"><span className="w-6 text-center">2.</span> Push Notifications - Thông báo daily affirmation</li>
                  <li className="flex items-center gap-2"><span className="w-6 text-center">3.</span> Meditation Timer - Hẹn giờ thiền với guided audio</li>
                  <li className="flex items-center gap-2"><span className="w-6 text-center">4.</span> Community Feed - Chia sẻ posts với cộng đồng</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border-2 border-yellow-500/30 bg-yellow-500/5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  🟡 Ưu tiên trung bình
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2"><span className="w-6 text-center">5.</span> Video Generation - Tạo video AI (Sora-like)</li>
                  <li className="flex items-center gap-2"><span className="w-6 text-center">6.</span> Multi-language - Hỗ trợ English</li>
                  <li className="flex items-center gap-2"><span className="w-6 text-center">7.</span> Wallet Integration - MetaMask, Camly Coin</li>
                  <li className="flex items-center gap-2"><span className="w-6 text-center">8.</span> FUN Ecosystem SSO - Đăng nhập chung với FUN Profile</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border-2 border-green-500/30 bg-green-500/5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  🟢 Ưu tiên thấp
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2"><span className="w-6 text-center">9.</span> Custom AI Training - Fine-tune với nội dung Bé Ly</li>
                  <li className="flex items-center gap-2"><span className="w-6 text-center">10.</span> Analytics Dashboard cho users</li>
                  <li className="flex items-center gap-2"><span className="w-6 text-center">11.</span> Achievements/Badges system</li>
                  <li className="flex items-center gap-2"><span className="w-6 text-center">12.</span> Social sharing</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Secrets Section */}
          <section id="secrets" className="mb-16 scroll-mt-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Key className="h-6 w-6 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Secrets cần thiết</h2>
            </div>

            <DataTable
              headers={["Secret", "Mô tả", "Trạng thái"]}
              rows={[
                ["LOVABLE_API_KEY", "AI Gateway", <Badge variant="success">Đã cấu hình</Badge>],
                ["OPENAI_API_KEY", "Backup AI", <Badge variant="success">Đã cấu hình</Badge>],
                ["R2_ACCESS_KEY_ID", "Cloudflare R2", <Badge variant="success">Đã cấu hình</Badge>],
                ["R2_SECRET_ACCESS_KEY", "Cloudflare R2", <Badge variant="success">Đã cấu hình</Badge>],
                ["R2_ENDPOINT", "Cloudflare R2", <Badge variant="success">Đã cấu hình</Badge>],
                ["R2_BUCKET_NAME", "Cloudflare R2", <Badge variant="success">Đã cấu hình</Badge>],
                ["R2_PUBLIC_URL", "Cloudflare R2", <Badge variant="success">Đã cấu hình</Badge>],
                ["CLOUDFLARE_WORKER_URL", "Cloudflare Worker", <Badge variant="success">Đã cấu hình</Badge>],
              ]}
            />

            <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Lưu ý:</strong> Tất cả secrets đã được cấu hình sẵn trong Lovable Cloud. 
                Khi thêm secret mới, sử dụng tool <code className="bg-blue-500/20 px-1 rounded">add_secret</code> của Lovable.
              </p>
            </div>
          </section>

          {/* Structure Section */}
          <section id="structure" className="mb-16 scroll-mt-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-teal-500/10">
                <FolderTree className="h-6 w-6 text-teal-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Cấu trúc thư mục</h2>
            </div>

            <CodeBlock
              language="plaintext"
              code={`src/
├── components/
│   ├── chat/           # Chat UI components (ChatBubble, ChatInput, ChatSidebar...)
│   ├── journal/        # Personal journal (PostCard, PostComposer, MoodSelector...)
│   ├── knowledge/      # Knowledge base (KnowledgeCard, CategoryTabs...)
│   ├── layout/         # Layout components (Navbar, Layout)
│   ├── onboarding/     # Onboarding flow (OnboardingChecklist)
│   ├── admin/          # Admin components (AdminLayout, AdminSidebar, StatsCard)
│   └── ui/             # shadcn/ui components (40+ components)
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication hook
│   ├── useIsAdmin.ts   # Admin check hook
│   ├── useMediaUpload.ts # Media upload to R2
│   └── ...
├── pages/              # Route pages
│   ├── admin/          # Admin pages (8 pages)
│   ├── docs/           # Documentation pages
│   ├── Chat.tsx        # Main chat page
│   ├── Knowledge.tsx   # Knowledge base
│   ├── Profile.tsx     # User profile
│   └── ...
├── stores/             # Zustand stores
│   └── userStore.ts    # User state management
├── data/               # Static data
│   ├── categories.ts   # Knowledge categories
│   ├── divineMantras.ts # 8 Divine Mantras
│   └── knowledge.ts    # Knowledge topics
├── lib/                # Utilities
│   ├── utils.ts        # Common utilities
│   └── pdfParser.ts    # PDF parsing
└── integrations/       # External integrations
    └── supabase/       # Supabase client & types

supabase/
├── functions/          # 10 Edge Functions
│   ├── angel-ai/       # Main chat AI
│   ├── angel-ai-public/ # Public API
│   ├── angel-image/    # Image generation
│   └── ...
├── migrations/         # Database migrations
└── config.toml         # Supabase config

public/
├── pwa-*.png          # PWA icons
├── manifest.webmanifest # PWA manifest (auto-generated)
└── robots.txt         # SEO`}
            />
          </section>

          {/* Footer */}
          <div className="border-t border-border pt-8 mt-16">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                ANGEL AI Platform Documentation • Last updated: {new Date().toLocaleDateString('vi-VN')}
              </p>
              <div className="flex items-center gap-4">
                <Link to="/" className="text-sm text-primary hover:underline">
                  Trang chủ
                </Link>
                <Link to="/chat" className="text-sm text-primary hover:underline">
                  Chat với ANGEL AI
                </Link>
                <Link to="/developers" className="text-sm text-primary hover:underline">
                  Developer Portal
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
