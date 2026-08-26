import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { useAdminCheck } from '@/hooks/useAdminCheck';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, loading } = useAdminCheck();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-divine">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang xác thực quyền admin...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
