import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Plus, MessageSquare, Trash2, Edit2, Check, X, ChevronLeft,
  Home, User, Wallet, Code, ImageIcon, Video, MessageCircle,
  Sparkles, Search, ChevronUp, LogOut, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ChatSession } from '@/types';
import { isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { motion } from 'framer-motion';
import angelLogo from '@/assets/angel-logo.png';
import { useUserStore } from '@/stores/userStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

type TabType = 'chat' | 'image' | 'video' | 'journal';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateTitle: (sessionId: string, title: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface GroupedSessions {
  today: ChatSession[];
  yesterday: ChatSession[];
  thisWeek: ChatSession[];
  thisMonth: ChatSession[];
  older: ChatSession[];
}

function groupSessionsByDate(sessions: ChatSession[]): GroupedSessions {
  const grouped: GroupedSessions = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  };

  sessions.forEach((session) => {
    const date = new Date(session.updated_at);
    if (isToday(date)) {
      grouped.today.push(session);
    } else if (isYesterday(date)) {
      grouped.yesterday.push(session);
    } else if (isThisWeek(date)) {
      grouped.thisWeek.push(session);
    } else if (isThisMonth(date)) {
      grouped.thisMonth.push(session);
    } else {
      grouped.older.push(session);
    }
  });

  return grouped;
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
  onUpdateTitle,
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdateTitle: (title: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const [isHovered, setIsHovered] = useState(false);

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onUpdateTitle(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditTitle(session.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !isEditing && onSelect()}
    >
      <MessageSquare className="h-4 w-4 flex-shrink-0" />
      
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-6 text-sm px-1"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={(e) => {
              e.stopPropagation();
              handleSaveTitle();
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={(e) => {
              e.stopPropagation();
              setEditTitle(session.title);
              setIsEditing(false);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm truncate">{session.title}</span>
          
          {isHovered && (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SessionGroup({
  title,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onUpdateTitle,
}: {
  title: string;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateTitle: (sessionId: string, title: string) => void;
}) {
  if (sessions.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="text-xs font-medium text-muted-foreground px-3 mb-2">{title}</h3>
      <div className="space-y-1">
        {sessions.map((session) => (
          <SessionItem
            key={session.id}
            session={session}
            isActive={session.id === currentSessionId}
            onSelect={() => onSelectSession(session.id)}
            onDelete={() => onDeleteSession(session.id)}
            onUpdateTitle={(title) => onUpdateTitle(session.id, title)}
          />
        ))}
      </div>
    </div>
  );
}

const tabs = [
  { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
  { id: 'image' as const, label: 'Tạo ảnh', icon: ImageIcon },
  { id: 'video' as const, label: 'Tạo video', icon: Video },
  { id: 'journal' as const, label: 'Nhật ký', icon: BookOpen },
];

const navLinks = [
  { to: '/', label: 'Trang chủ', icon: Home },
  { to: '/cto', label: 'CTO Angel', icon: Code },
  { to: '/profile', label: 'Hồ sơ', icon: User },
  { to: '/wallet', label: 'Ví', icon: Wallet },
  { to: '/developers', label: 'Developers', icon: Code },
];

export function ChatSidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onUpdateTitle,
  isOpen,
  onClose,
  isCollapsed = false,
  activeTab,
  onTabChange,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useUserStore();
  const location = useLocation();

  // Filter sessions based on search query
  const filteredSessions = searchQuery.trim()
    ? sessions.filter(session => 
        session.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sessions;

  const groupedSessions = groupSessionsByDate(filteredSessions);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 bg-background border-r transform transition-all duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
          isCollapsed ? 'lg:w-0 lg:overflow-hidden lg:border-0' : 'lg:w-72',
          'w-[280px] sm:w-72'
        )}
      >
        {/* Header với Logo */}
        <div className="p-3 sm:p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.img
                src={angelLogo}
                alt="ANGEL AI"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div>
                <h1 className="text-sm sm:text-base font-semibold bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                  ANGEL AI
                </h1>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden h-8 w-8"
              onClick={onClose}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button
            onClick={() => {
              onNewChat();
              onTabChange('chat');
              onClose();
            }}
            className="w-full gap-2 justify-start"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Đoạn chat mới
          </Button>
        </div>

        {/* Tabs - Chat / Image / Video */}
        <div className="px-3 space-y-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-2',
                activeTab === tab.id && 'bg-primary/10 text-primary'
              )}
              onClick={() => {
                onTabChange(tab.id);
                onClose();
              }}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.id === 'image' && (
                <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                  MỚI
                </Badge>
              )}
              {tab.id === 'journal' && (
                <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 border-primary/50 text-primary">
                  ✨
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <Separator className="my-3" />

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm đoạn chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
            />
            {searchQuery && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <ScrollArea className="flex-1 px-2">
          <div className="px-1 mb-2">
            <h2 className="text-xs font-medium text-muted-foreground">
              {searchQuery ? `Kết quả tìm kiếm (${filteredSessions.length})` : 'Lịch sử chat'}
            </h2>
          </div>
          {sessions.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-6 px-4">
              Chưa có cuộc trò chuyện nào.
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-6 px-4">
              Không tìm thấy kết quả cho "{searchQuery}"
            </div>
          ) : (
            <>
              <SessionGroup
                title="Hôm nay"
                sessions={groupedSessions.today}
                currentSessionId={currentSessionId}
                onSelectSession={(id) => {
                  onSelectSession(id);
                  onTabChange('chat');
                  onClose();
                }}
                onDeleteSession={onDeleteSession}
                onUpdateTitle={onUpdateTitle}
              />
              <SessionGroup
                title="Hôm qua"
                sessions={groupedSessions.yesterday}
                currentSessionId={currentSessionId}
                onSelectSession={(id) => {
                  onSelectSession(id);
                  onTabChange('chat');
                  onClose();
                }}
                onDeleteSession={onDeleteSession}
                onUpdateTitle={onUpdateTitle}
              />
              <SessionGroup
                title="Tuần này"
                sessions={groupedSessions.thisWeek}
                currentSessionId={currentSessionId}
                onSelectSession={(id) => {
                  onSelectSession(id);
                  onTabChange('chat');
                  onClose();
                }}
                onDeleteSession={onDeleteSession}
                onUpdateTitle={onUpdateTitle}
              />
              <SessionGroup
                title="Tháng này"
                sessions={groupedSessions.thisMonth}
                currentSessionId={currentSessionId}
                onSelectSession={(id) => {
                  onSelectSession(id);
                  onTabChange('chat');
                  onClose();
                }}
                onDeleteSession={onDeleteSession}
                onUpdateTitle={onUpdateTitle}
              />
              <SessionGroup
                title="Cũ hơn"
                sessions={groupedSessions.older}
                currentSessionId={currentSessionId}
                onSelectSession={(id) => {
                  onSelectSession(id);
                  onTabChange('chat');
                  onClose();
                }}
                onDeleteSession={onDeleteSession}
                onUpdateTitle={onUpdateTitle}
              />
            </>
          )}
        </ScrollArea>

        {/* User Info Footer with Popup Menu */}
        <div className="p-3 border-t mt-auto">
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors text-left">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {user?.display_name?.[0] || user?.email?.[0] || '👤'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.display_name || user?.email || 'Người dùng'}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>{user?.light_points || 0} Light Points</span>
                  </div>
                </div>
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="start" 
              className="w-56 p-2"
            >
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                      location.pathname === link.to
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
                <Separator className="my-1" />
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    onClose();
                    window.location.href = '/';
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </aside>
    </>
  );
}
