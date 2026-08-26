import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, Search, Trash2, RefreshCw, Loader2, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  email: string;
  description: string | null;
  is_active: boolean;
  daily_limit: number;
  created_at: string;
  last_used_at: string | null;
}

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchApiKeys = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Dữ liệu đang cập nhật",
        description: "Vui lòng làm mới trang để thử lại.",
        variant: "destructive",
      });
    } else {
      setApiKeys(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const toggleKeyStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast({
        title: "Cập nhật tạm dừng",
        description: "Vui lòng thử lại để hoàn tất thao tác.",
        variant: "destructive",
      });
    } else {
      setApiKeys(prev => 
        prev.map(key => key.id === id ? { ...key, is_active: !currentStatus } : key)
      );
      toast({
        title: currentStatus ? "Đã tạm ngưng API key" : "Đã kích hoạt API key ✨",
      });
    }
  };

  const updateDailyLimit = async (id: string, newLimit: number) => {
    const { error } = await supabase
      .from('api_keys')
      .update({ daily_limit: newLimit })
      .eq('id', id);

    if (error) {
      toast({
        title: "Cập nhật tạm dừng",
        description: "Vui lòng thử lại để hoàn tất thao tác.",
        variant: "destructive",
      });
    } else {
      setApiKeys(prev => 
        prev.map(key => key.id === id ? { ...key, daily_limit: newLimit } : key)
      );
      toast({ title: "Đã cập nhật daily limit ✨" });
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa API key này?")) return;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Thao tác tạm dừng",
        description: "Vui lòng thử lại để hoàn tất.",
        variant: "destructive",
      });
    } else {
      setApiKeys(prev => prev.filter(key => key.id !== id));
      toast({ title: "Đã xóa API key ✨" });
    }
  };

  const filteredKeys = apiKeys.filter(key => 
    key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    key.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    key.key_prefix.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Key className="w-6 h-6 text-primary" />
              API Keys Management
            </h1>
            <p className="text-muted-foreground">
              Quản lý API keys của developers ({apiKeys.length} keys)
            </p>
          </div>
          <Button onClick={fetchApiKeys} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Keys</p>
            <p className="text-2xl font-bold">{apiKeys.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Active Keys</p>
            <p className="text-2xl font-bold text-green-500">
              {apiKeys.filter(k => k.is_active).length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Inactive Keys</p>
            <p className="text-2xl font-bold text-red-500">
              {apiKeys.filter(k => !k.is_active).length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Used Today</p>
            <p className="text-2xl font-bold text-blue-500">
              {apiKeys.filter(k => k.last_used_at && new Date(k.last_used_at).toDateString() === new Date().toDateString()).length}
            </p>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, email hoặc key prefix..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Daily Limit</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Không có API keys nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {apiKey.key_prefix}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{apiKey.name}</p>
                          <p className="text-xs text-muted-foreground">{apiKey.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={apiKey.is_active}
                            onCheckedChange={() => toggleKeyStatus(apiKey.id, apiKey.is_active)}
                          />
                          <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                            {apiKey.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {apiKey.daily_limit.toLocaleString()}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Daily Limit</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <Input
                                type="number"
                                defaultValue={apiKey.daily_limit}
                                onBlur={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (value > 0 && value !== apiKey.daily_limit) {
                                    updateDailyLimit(apiKey.id, value);
                                  }
                                }}
                              />
                              <p className="text-sm text-muted-foreground">
                                Số requests tối đa mỗi ngày
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>
                        {apiKey.last_used_at ? (
                          <span className="text-sm">
                            {format(new Date(apiKey.last_used_at), 'dd/MM HH:mm')}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(apiKey.created_at), 'dd/MM/yyyy')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" title="Chia sẻ tích hợp">
                            <Link to={`/admin/share-key/${apiKey.id}`}>
                              <Share2 className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteApiKey(apiKey.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}

