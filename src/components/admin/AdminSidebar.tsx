import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  List, 
  MessageSquare, 
  Shield,
  ChevronLeft,
  Menu,
  Key,
  BarChart3,
  Bug,
  Lock,
  Wallet,
  Sparkles,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const adminNavItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Knowledge Upload', url: '/admin/knowledge', icon: BookOpen },
  { title: 'Knowledge Manager', url: '/admin/knowledge-list', icon: List },
  { title: 'Chat Analytics', url: '/admin/chat', icon: MessageSquare },
  { title: 'Roles', url: '/admin/roles', icon: Shield },
  { title: 'API Keys', url: '/admin/api-keys', icon: Key },
  { title: 'API Analytics', url: '/admin/api-analytics', icon: BarChart3 },
  { title: 'Credit Usage', url: '/admin/credit-usage', icon: Wallet },
  { title: 'RAG Debugger', url: '/admin/rag-debug', icon: Bug },
  { title: 'Application Keys', url: '/admin/security/application-keys', icon: Lock },
  { title: 'Mini App Quotas', url: '/admin/mini-app-quotas', icon: Sparkles },
  { title: 'System Prompts', url: '/admin/system-prompts', icon: FileText },
];


export function AdminSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "bg-sidebar-background border-r border-sidebar-border h-full flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <h2 className="font-semibold text-sidebar-foreground">Admin Panel</h2>
        )}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {adminNavItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive 
                  ? "bg-sidebar-primary/10 text-sidebar-primary font-medium" 
                  : "text-sidebar-foreground"
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground text-center">
            ANGEL AI Admin v1.0
          </p>
        </div>
      )}
    </aside>
  );
}
