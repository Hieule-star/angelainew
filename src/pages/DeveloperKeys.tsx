import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/userStore';
import {
  ArrowLeft,
  Key,
  RefreshCw,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ApiKeyInfo {
  id: string;
  key_prefix: string;
  name: string;
  email: string;
  is_active: boolean;
  daily_limit: number;
  created_at: string;
  last_used_at: string | null;
  today_usage?: number;
}

export default function DeveloperKeys() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, user } = useUserStore();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để truy cập quản lý API keys.",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [isAuthenticated, navigate, toast]);

  // Fetch user's API keys
  const fetchKeys = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('api-key-management', {
        body: { action: 'list', email: user.email },
      });

      if (error) throw error;
      
      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      if (responseData.error) throw new Error(responseData.message || responseData.error);
      
      setKeys(responseData.keys || []);
    } catch (error) {
      console.error('Error fetching keys:', error);
      toast({
        title: "Dữ liệu đang cập nhật",
        description: "Danh sách API keys cần được làm mới. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchKeys();
    }
  }, [user?.email]);

  // Regenerate API key
  const handleRegenerate = async (keyId: string) => {
    if (!user?.email) return;
    
    setActionLoading(keyId);
    try {
      const { data, error } = await supabase.functions.invoke('api-key-management', {
        body: { action: 'regenerate', email: user.email },
      });

      if (error) throw error;
      
      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      if (responseData.error) throw new Error(responseData.message || responseData.error);

      setNewKey(responseData.api_key);
      toast({
        title: "Tạo lại thành công! 🎉",
        description: "API key mới đã được tạo. Lưu lại ngay!",
      });
      fetchKeys();
    } catch (error) {
      toast({
        title: "Hành động tạm dừng",
        description: error instanceof Error ? error.message : "Tạo lại API key cần xác minh. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Revoke API key
  const handleRevoke = async (keyId: string) => {
    if (!user?.email) return;
    
    setActionLoading(keyId);
    try {
      const { data, error } = await supabase.functions.invoke('api-key-management', {
        body: { action: 'revoke', email: user.email },
      });

      if (error) throw error;
      
      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      if (responseData.error) throw new Error(responseData.message || responseData.error);

      toast({
        title: "Đã vô hiệu hóa",
        description: "API key đã bị vô hiệu hóa",
      });
      fetchKeys();
    } catch (error) {
      toast({
        title: "Hành động tạm dừng",
        description: error instanceof Error ? error.message : "Thao tác cần xác minh. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    toast({ title: "Đã copy API key!" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link to="/developers">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">🔑 My API Keys</h1>
              <p className="text-muted-foreground text-sm">
                Quản lý API keys của bạn ({user?.email})
              </p>
            </div>
          </div>

          {/* New Key Alert */}
          {newKey && (
            <Card className="p-6 border-green-500/50 bg-green-50">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Key className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-green-800">API Key mới được tạo!</h3>
                    <p className="text-sm text-green-700">
                      Lưu key này ngay! Bạn sẽ không thể xem lại sau khi đóng.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
                    <code className="text-sm flex-1 break-all">{newKey}</code>
                    <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                      {copied ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setNewKey(null)}>
                    Đã lưu, đóng thông báo
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Warning */}
          <Card className="p-4 border-amber-500/50 bg-amber-50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                API key chỉ hiển thị <strong>một lần</strong> khi tạo. Nếu mất, bạn cần tạo lại key mới.
              </p>
            </div>
          </Card>

          {/* Keys List */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Danh sách API Keys</h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : keys.length === 0 ? (
              <div className="text-center py-12">
                <Key className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">Bạn chưa có API key nào</p>
                <Link to="/developers">
                  <Button variant="divine">Đăng ký API Key</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-medium">{key.key_prefix}...****</code>
                        {key.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                            <XCircle className="w-3 h-3" />
                            Revoked
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {key.name} • Tạo lúc: {new Date(key.created_at).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Limit: {key.daily_limit}/ngày
                        {key.today_usage !== undefined && ` • Hôm nay: ${key.today_usage} requests`}
                      </p>
                    </div>
                    
                    {key.is_active && (
                      <div className="flex items-center gap-2">
                        {/* Regenerate */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading === key.id}
                            >
                              {actionLoading === key.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              <span className="ml-2 hidden sm:inline">Tạo lại</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tạo lại API Key?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Key cũ sẽ bị vô hiệu hóa ngay lập tức. Mọi ứng dụng đang sử dụng key cũ sẽ ngừng hoạt động.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRegenerate(key.id)}>
                                Tạo lại
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {/* Revoke */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={actionLoading === key.id}
                            >
                              {actionLoading === key.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              <span className="ml-2 hidden sm:inline">Vô hiệu hóa</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Vô hiệu hóa API Key?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Key sẽ bị vô hiệu hóa vĩnh viễn và không thể khôi phục. Bạn sẽ cần đăng ký key mới.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRevoke(key.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Vô hiệu hóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Back to Developers */}
          <div className="text-center">
            <Link to="/developers">
              <Button variant="ghost">← Quay lại Developer Portal</Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
