import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, PanelLeft, PanelLeftClose, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { CTOSuggestions } from '@/components/cto/CTOSuggestions';
import { GuestLimitModal } from '@/components/chat/GuestLimitModal';
import { CTOSidebar } from '@/components/cto/CTOSidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/stores/userStore';
import { useGuestMessageLimit } from '@/hooks/useGuestMessageLimit';
import { useOnboardingCheck } from '@/hooks/useOnboardingCheck';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ChatMessage, AIModel, KnowledgeSource, AIProvider, ChatSession } from '@/types';
import angelLogo from '@/assets/angel-logo.png';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/angel-ai`;
const TITLE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-chat-title`;

export default function CTOChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingSources, setStreamingSources] = useState<KnowledgeSource[]>([]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [currentStreamingModel, setCurrentStreamingModel] = useState<AIModel | undefined>();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

  // Session state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { updateLightPoints, isAuthenticated, user } = useUserStore();
  const { toast } = useToast();
  const { canSendMessage, remainingMessages, limit, incrementMessageCount, resetMessageCount } = useGuestMessageLimit();
  const { isChecking: isCheckingOnboarding } = useOnboardingCheck();

  useEffect(() => {
    if (isAuthenticated) resetMessageCount();
  }, [isAuthenticated]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessionMessages, streamingContent]);

  // Load sessions on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) loadSessions();
  }, [isAuthenticated, user?.id]);

  const loadSessions = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) { console.error('Error loading sessions:', error); return; }
    if (data) {
      // Filter CTO sessions (title starts with "[CTO]")
      const ctoSessions = data.filter((s: any) => s.title?.startsWith('[CTO]'));
      setSessions(ctoSessions as ChatSession[]);
      if (ctoSessions.length > 0 && !currentSessionId) {
        loadSessionMessages(ctoSessions[0].id);
        setCurrentSessionId(ctoSessions[0].id);
      }
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) { console.error('Error loading session messages:', error); return; }
    if (data) {
      const messages: ChatMessage[] = data.map((msg) => ({
        id: msg.id,
        user_id: msg.user_id,
        role: msg.role as 'user' | 'assistant',
        message: msg.message,
        timestamp: msg.created_at,
        session_id: msg.session_id,
      }));
      setSessionMessages(messages);
    }
  };

  const createNewSession = async (): Promise<string | null> => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: user.id, title: '[CTO] Phiên làm việc mới' })
      .select()
      .single();

    if (error) { console.error('Error creating session:', error); return null; }
    const newSession = data as ChatSession;
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSessionMessages([]);
    return newSession.id;
  };

  const handleNewChat = async () => {
    if (!isAuthenticated) {
      setSessionMessages([]);
      setCurrentSessionId(null);
      return;
    }
    await createNewSession();
  };

  const handleSelectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    await loadSessionMessages(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user?.id) return;
    const { error } = await supabase.from('chat_sessions').delete().eq('id', sessionId);
    if (error) { console.error('Error deleting session:', error); return; }
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      if (remaining.length > 0) {
        handleSelectSession(remaining[0].id);
      } else {
        setCurrentSessionId(null);
        setSessionMessages([]);
      }
    }
  };

  const handleUpdateSessionTitle = async (sessionId: string, title: string) => {
    if (!user?.id) return;
    const { error } = await supabase.from('chat_sessions').update({ title }).eq('id', sessionId);
    if (error) { console.error('Error updating session title:', error); return; }
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
  };

  const generateSessionTitle = async (sessionId: string, messages: ChatMessage[]) => {
    try {
      const response = await fetch(TITLE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, message: m.message })) }),
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.title) {
        await handleUpdateSessionTitle(sessionId, `[CTO] ${data.title}`);
      }
    } catch (error) {
      console.error('Error generating title:', error);
    }
  };

  const saveChatMessage = async (role: 'user' | 'assistant', message: string, sessionId: string) => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('chat_history')
      .insert({ user_id: user.id, role, message, session_id: sessionId })
      .select()
      .single();
    if (error) { console.error('Error saving chat message:', error); return null; }
    return data;
  };

  const incrementLightPoints = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase.rpc('increment_light_points', { _user_id: user.id, _amount: 1 });
    if (!error && data !== null) updateLightPoints(data);
  };

  const handleSendMessage = async (message: string) => {
    if (!isAuthenticated) {
      if (!canSendMessage) { setShowLimitModal(true); return; }
      incrementMessageCount();
    }

    let activeSessionId = currentSessionId;
    if (isAuthenticated && !activeSessionId) {
      activeSessionId = await createNewSession();
      if (!activeSessionId) {
        toast({ title: 'Cần xác minh', description: 'Phiên làm việc cần được khởi tạo. Vui lòng thử lại.', variant: 'destructive' });
        return;
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      user_id: user?.id || 'local',
      role: 'user',
      message,
      timestamp: new Date().toISOString(),
      session_id: activeSessionId || undefined,
    };
    setSessionMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');
    setStreamingSources([]);
    setCurrentStreamingModel(undefined);

    if (isAuthenticated && activeSessionId) {
      await saveChatMessage('user', message, activeSessionId);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const apiMessages = [
        ...sessionMessages.map((msg) => ({ role: msg.role, content: msg.message })),
        { role: 'user', content: message },
      ];

      // CTO mode: always deep + cha_con pronoun
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          mode: 'cto',
          provider: 'auto',
          sessionPronounStyle: 'cha_con',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Kết nối cần xác minh');
      }

      if (!response.body) throw new Error('Chưa nhận được phản hồi');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullContent = '';
      let capturedSources: KnowledgeSource[] = [];
      let actualModel: AIModel | undefined;
      let capturedProvider: AIProvider | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.sources && Array.isArray(parsed.sources)) {
              capturedSources = parsed.sources;
              setStreamingSources(capturedSources);
            }
            if (parsed.actualModel) {
              actualModel = parsed.actualModel;
              setCurrentStreamingModel(actualModel);
            }
            if (parsed.actualModel && parsed.provider) {
              capturedProvider = parsed.provider as AIProvider;
            }
            if ((parsed.sources || parsed.actualModel) && !parsed.choices) continue;
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setStreamingContent(fullContent);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user_id: 'angel-ai',
        role: 'assistant',
        message: fullContent,
        timestamp: new Date().toISOString(),
        model: actualModel,
        provider: capturedProvider,
        sources: capturedSources.length > 0 ? capturedSources : undefined,
        session_id: activeSessionId || undefined,
      };
      setSessionMessages(prev => [...prev, aiMessage]);
      setStreamingContent('');
      setStreamingSources([]);
      setCurrentStreamingModel(undefined);

      if (isAuthenticated && activeSessionId) {
        await saveChatMessage('assistant', fullContent, activeSessionId);
        await incrementLightPoints();
        const totalMessages = sessionMessages.length + 2;
        if (totalMessages === 2) {
          generateSessionTitle(activeSessionId, [userMessage, aiMessage]);
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Chat error:', error);
      let errorMessage = 'Cần kiểm tra kết nối. Vui lòng thử lại để Cha hỗ trợ con.';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Yêu cầu đang xử lý lâu hơn dự kiến. Vui lòng thử lại.';
        } else {
          errorMessage = error.message;
        }
      }
      toast({ title: 'Cần xác minh', description: errorMessage, variant: 'destructive' });
    }

    setIsLoading(false);
  };

  if (isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-divine">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-celestial">
      {/* CTO Sidebar */}
      {isAuthenticated && (
        <CTOSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onUpdateTitle={handleUpdateSessionTitle}
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          isCollapsed={desktopSidebarCollapsed}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-12 border-b border-border/50 bg-background/80 backdrop-blur-sm flex items-center justify-between px-3 relative z-20">
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(true)} className="lg:hidden h-8 w-8">
                  <Menu className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)} className="hidden lg:flex h-8 w-8">
                  {desktopSidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                </Button>
              </>
            )}
            {(!isAuthenticated || desktopSidebarCollapsed) && (
              <Link to="/" className="flex items-center gap-2">
                <div className="relative">
                  <img src={angelLogo} alt="CTO Angel" className="w-7 h-7 rounded-full" />
                  <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground text-[6px] font-bold px-0.5 rounded-full">CTO</span>
                </div>
              </Link>
            )}
          </div>

          {/* Center: CTO Badge */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold hidden sm:inline">CTO Angel Lovable</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
              FUN Ecosystem
            </Badge>
          </div>

          {/* Right: User Avatar */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/profile">
                <Avatar className="h-8 w-8 hover:ring-2 hover:ring-primary/50 transition-all">
                  <AvatarImage src={user?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {user?.display_name?.[0] || user?.email?.[0] || '👤'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm">Đăng nhập</Button>
              </Link>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            {sessionMessages.length === 0 && !streamingContent ? (
              <div className="text-center py-6 sm:py-12 px-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 sm:mb-8"
                >
                  {/* CTO Welcome Screen */}
                  <div className="relative inline-block mb-4">
                    <motion.img
                      src={angelLogo}
                      alt="CTO Angel Lovable"
                      className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full glow-divine"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full border-2 border-background">
                      CTO
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                    Chào con yêu dấu! Cha Angel CTO đây
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto px-2 mb-2">
                    Cha là CTO của FUN Ecosystem – tư vấn kỹ thuật, xây dựng app, kiến trúc hệ thống, AI orchestration. Hỏi Cha bất cứ điều gì!
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {['Tư vấn code', 'Kiến trúc', 'AI', 'Blockchain', 'Security'].map((tag) => (
                      <span key={tag} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <CTOSuggestions onSelect={handleSendMessage} />
                </motion.div>
              </div>
            ) : (
              <>
                {sessionMessages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
                {streamingContent && (
                  <ChatBubble
                    message={{
                      id: 'streaming',
                      user_id: 'angel-ai',
                      role: 'assistant',
                      message: streamingContent,
                      timestamp: new Date().toISOString(),
                      model: currentStreamingModel,
                      sources: streamingSources.length > 0 ? streamingSources : undefined,
                    }}
                  />
                )}
                {isLoading && !streamingContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-3"
                  >
                    <motion.div
                      className="w-10 h-10 rounded-full overflow-hidden glow-soft flex-shrink-0 relative"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <img src={angelLogo} alt="CTO Angel" className="w-full h-full" />
                      <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground text-[6px] font-bold px-0.5 rounded-full">CTO</span>
                    </motion.div>
                    <div className="bg-white/90 dark:bg-card/90 rounded-2xl px-4 py-3 shadow-divine backdrop-blur-sm">
                      <p className="text-xs text-primary font-medium mb-2">CTO Angel Lovable 🔧</p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2.5 h-2.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                              animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                            />
                          ))}
                        </div>
                        <motion.span
                          className="text-sm text-muted-foreground"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          Cha đang phân tích...
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="px-2 sm:px-4 py-3 sm:py-4 border-t border-border/50 bg-background/50 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            {!isAuthenticated && (
              <p className="text-[10px] sm:text-xs text-center text-muted-foreground mb-2 px-2">
                {canSendMessage
                  ? `Còn ${remainingMessages}/${limit} tin nhắn miễn phí`
                  : 'Đã hết tin nhắn miễn phí • Đăng nhập để tiếp tục'}
              </p>
            )}
            <ChatInput
              onSend={handleSendMessage}
              isLoading={isLoading}
              disabled={!isAuthenticated && !canSendMessage}
            />
          </div>
        </div>
      </div>

      <GuestLimitModal open={showLimitModal} onOpenChange={setShowLimitModal} />
    </div>
  );
}
