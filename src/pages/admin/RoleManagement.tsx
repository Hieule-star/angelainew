import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, UserPlus, UserMinus, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/stores/userStore';

interface UserWithRole {
  id: string;
  email: string | null;
  display_name: string | null;
  isAdmin: boolean;
}

export default function RoleManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionUser, setActionUser] = useState<UserWithRole | null>(null);
  const [actionType, setActionType] = useState<'add' | 'remove' | null>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const currentUser = useUserStore((state) => state.user);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminUserIds = new Set((adminRoles || []).map((r) => r.user_id));

      const usersWithRoles = (profiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email,
        display_name: profile.display_name,
        isAdmin: adminUserIds.has(profile.id),
      }));

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange() {
    if (!actionUser || !actionType) return;

    setProcessing(true);
    try {
      if (actionType === 'add') {
        const { error } = await supabase.from('user_roles').insert({
          user_id: actionUser.id,
          role: 'admin',
        });
        if (error) throw error;
        toast({ title: `Đã thêm quyền admin cho ${actionUser.email}` });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', actionUser.id)
          .eq('role', 'admin');
        if (error) throw error;
        toast({ title: `Đã xóa quyền admin của ${actionUser.email}` });
      }

      // Refresh list
      await fetchUsers();
      setActionUser(null);
      setActionType(null);
    } catch (err: any) {
      toast({
        title: 'Lỗi cập nhật quyền',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter((u) => u.isAdmin).length;

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Quản lý Roles
          </h1>
          <p className="text-muted-foreground mt-1">
            Phân quyền admin cho người dùng ({adminCount} admin)
          </p>
        </motion.div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo email hoặc tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Tên hiển thị</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Không tìm thấy user nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email || '-'}</TableCell>
                      <TableCell>{user.display_name || '-'}</TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge className="bg-primary">Admin</Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.id === currentUser?.id ? (
                          <span className="text-xs text-muted-foreground">Bạn</span>
                        ) : user.isAdmin ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActionUser(user);
                              setActionType('remove');
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <UserMinus className="w-4 h-4 mr-1" />
                            Xóa Admin
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActionUser(user);
                              setActionType('add');
                            }}
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Thêm Admin
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Confirmation Dialog */}
        <Dialog
          open={!!actionUser && !!actionType}
          onOpenChange={() => {
            setActionUser(null);
            setActionType(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'add' ? 'Thêm quyền Admin' : 'Xóa quyền Admin'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'add'
                  ? `Bạn có chắc muốn cấp quyền admin cho "${actionUser?.email}"? Họ sẽ có thể truy cập tất cả chức năng quản trị.`
                  : `Bạn có chắc muốn xóa quyền admin của "${actionUser?.email}"? Họ sẽ không còn truy cập được các trang admin.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setActionUser(null);
                  setActionType(null);
                }}
              >
                Hủy
              </Button>
              <Button
                variant={actionType === 'remove' ? 'destructive' : 'default'}
                onClick={handleRoleChange}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : actionType === 'add' ? (
                  'Thêm Admin'
                ) : (
                  'Xóa Admin'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
