import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ImageIcon, Video, Menu, PanelLeft, PanelLeftClose, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { SuggestedQuestions } from '@/components/chat/SuggestedQuestions';
import { GuestLimitModal } from '@/components/chat/GuestLimitModal';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { ImageGenerator } from '@/components/chat/ImageGenerator';
import { VideoGenerator } from '@/components/chat/VideoGenerator';
import { JournalFeed } from '@/components/journal/JournalFeed';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { DailyAffirmation } from '@/components/chat/DailyAffirmation';
import { MantraSuggestion } from '@/components/chat/MantraSuggestion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserStore } from '@/stores/userStore';
import { useGuestMessageLimit } from '@/hooks/useGuestMessageLimit';
import { useOnboardingCheck } from '@/hooks/useOnboardingCheck';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ChatMessage, AIModel, KnowledgeSource, SelectionMode, ChatSession, AIProvider, ProviderPreference } from '@/types';
import { getRandomMantra, type DivineMantra } from '@/data/divineMantras';
import angelLogo from '@/assets/angel-logo.png';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/angel-ai`;
const TITLE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-chat-title`;

type TabType = 'chat' | 'image' | 'video' | 'journal';

const getStoredMode = (): SelectionMode => {
  const stored = localStorage.getItem('angel-ai-mode');
  if (stored && ['auto', 'fast', 'deep'].includes(stored)) {
    return stored as SelectionMode;
  }
  return 'auto';
};

const getStoredProvider = (): ProviderPreference => {
  const stored = localStorage.getItem('angel-ai-provider');
  if (stored && ['auto', 'lovable', 'openai'].includes(stored)) {
    return stored as ProviderPreference;
  }
  return 'auto';
};

export default function Chat() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingSources, setStreamingSources] = useState<KnowledgeSource[]>([]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<SelectionMode>(getStoredMode);
  const [selectedProvider, setSelectedProvider] = useState<ProviderPreference>(getStoredProvider);
  const [currentStreamingModel, setCurrentStreamingModel] = useState<AIModel | undefined>();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  
  // Session state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  
  // Daily Affirmation & Mantra state
  const [showDailyAffirmation, setShowDailyAffirmation] = useState(true);
  const [suggestedMantra, setSuggestedMantra] = useState<DivineMantra | null>(null);
  const [messageCountForMantra, setMessageCountForMantra] = useState(0);
  
  // Session pronoun style (ghi nhớ cách xưng hô để không detect lại mỗi tin nhắn)
  const [sessionPronounStyle, setSessionPronounStyle] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    updateLightPoints,
    isAuthenticated,
    user 
  } = useUserStore();
  const { toast } = useToast();
  const { canSendMessage, remainingMessages, limit, incrementMessageCount, resetMessageCount } = useGuestMessageLimit();
  const { isChecking: isCheckingOnboarding } = useOnboardingCheck();

  // Reset guest message count when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      resetMessageCount();
    }
  }, [isAuthenticated]);

  const handleModeChange = (mode: SelectionMode) => {
    setSelectedMode(mode);
    localStorage.setItem('angel-ai-mode', mode);
  };

  const handleProviderChange = (provider: ProviderPreference) => {
    setSelectedProvider(provider);
    localStorage.setItem('angel-ai-provider', provider);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessionMessages, streamingContent]);

  // Load sessions and most recent session on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadSessions();
    }
  }, [isAuthenticated, user?.id]);

  const loadSessions = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading sessions:', error);
      return;
    }

    if (data) {
      setSessions(data as ChatSession[]);
      // Load most recent session if exists
      if (data.length > 0 && !currentSessionId) {
        loadSessionMessages(data[0].id);
        setCurrentSessionId(data[0].id);
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

    if (error) {
      console.error('Error loading session messages:', error);
      return;
    }

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
      .insert({
        user_id: user.id,
        title: 'Cuộc trò chuyện mới',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    const newSession = data as ChatSession;
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSessionMessages([]);
    return newSession.id;
  };

  const handleNewChat = async () => {
    setShowDailyAffirmation(true);
    setSuggestedMantra(null);
    setMessageCountForMantra(0);
    setSessionPronounStyle(null); // Reset pronoun style cho session mới
    if (!isAuthenticated) {
      setSessionMessages([]);
      setCurrentSessionId(null);
      return;
    }
    await createNewSession();
  };

  const handleStartChatFromAffirmation = () => {
    setShowDailyAffirmation(false);
  };

  const handleAskAboutMantra = (mantra: DivineMantra) => {
    setShowDailyAffirmation(false);
    handleSendMessage(`Hãy giải thích ý nghĩa và cách đọc mantra "${mantra.original}" cho con`);
  };

  const handleDismissMantraSuggestion = () => {
    setSuggestedMantra(null);
  };

  // Show mantra suggestion after every 5 messages
  useEffect(() => {
    if (sessionMessages.length > 0 && sessionMessages.length % 5 === 0 && !suggestedMantra) {
      const randomMantra = getRandomMantra();
      setSuggestedMantra(randomMantra);
    }
  }, [sessionMessages.length]);

  const handleSelectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setSessionPronounStyle(null); // Reset để detect lại từ lịch sử session
    await loadSessionMessages(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting session:', error);
      return;
    }

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

    const { error } = await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session title:', error);
      return;
    }

    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, title } : s
    ));
  };

  const generateSessionTitle = async (sessionId: string, messages: ChatMessage[]) => {
    try {
      const response = await fetch(TITLE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: messages.map(m => ({ role: m.role, message: m.message }))
        }),
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.title && data.title !== 'Cuộc trò chuyện mới') {
        await handleUpdateSessionTitle(sessionId, data.title);
      }
    } catch (error) {
      console.error('Error generating title:', error);
    }
  };

  const saveChatMessage = async (role: 'user' | 'assistant', message: string, sessionId: string) => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('chat_history')
      .insert({
        user_id: user.id,
        role,
        message,
        session_id: sessionId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving chat message:', error);
      return null;
    }

    return data;
  };

  const incrementLightPoints = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase.rpc('increment_light_points', {
      _user_id: user.id,
      _amount: 1,
    });

    if (!error && data !== null) {
      updateLightPoints(data);
    }
  };

  const handleSendMessage = async (message: string) => {
    // Check guest message limit
    if (!isAuthenticated) {
      if (!canSendMessage) {
        setShowLimitModal(true);
        return;
      }
      incrementMessageCount();
    }

    // For authenticated users, ensure we have a session
    let activeSessionId = currentSessionId;
    if (isAuthenticated && !activeSessionId) {
      activeSessionId = await createNewSession();
      if (!activeSessionId) {
        toast({
          title: 'Lỗi',
          description: 'Không thể tạo cuộc trò chuyện mới',
          variant: 'destructive',
        });
        return;
      }
    }

    // Add user message to UI immediately
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

    // Save user message to database
    if (isAuthenticated && activeSessionId) {
      await saveChatMessage('user', message, activeSessionId);
    }

    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      // Prepare messages for API
      const apiMessages = [
        ...sessionMessages.map((msg) => ({
          role: msg.role,
          content: msg.message,
        })),
        { role: 'user', content: message },
      ];

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, mode: selectedMode, provider: selectedProvider, sessionPronounStyle }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullContent = '';
      let capturedSources: KnowledgeSource[] = [];
      let actualModel: AIModel | undefined;
      let capturedProvider: AIProvider | undefined;
      let capturedPronounStyle: string | undefined;

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
            
            // Capture metadata từ packet
            if (parsed.sources && Array.isArray(parsed.sources)) {
              capturedSources = parsed.sources;
              setStreamingSources(capturedSources);
            }
            if (parsed.actualModel) {
              actualModel = parsed.actualModel;
              setCurrentStreamingModel(actualModel);
            }
            
            // Chỉ lấy provider từ metadata packet (có actualModel)
            if (parsed.actualModel && parsed.provider) {
              capturedProvider = parsed.provider as AIProvider;
            }
            
            // Capture pronoun style để ghi nhớ trong session
            if (parsed.pronounStyle) {
              capturedPronounStyle = parsed.pronounStyle;
              setSessionPronounStyle(capturedPronounStyle);
            }
            
            // Chỉ skip nếu đây là metadata packet (có sources HOẶC actualModel, và KHÔNG có choices)
            if ((parsed.sources || parsed.actualModel) && !parsed.choices) {
              continue;
            }
            
            // Extract content từ streaming chunks
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

      // Add AI response to chat history
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

      // Save AI message to database and increment light points
      if (isAuthenticated && activeSessionId) {
        await saveChatMessage('assistant', fullContent, activeSessionId);
        await incrementLightPoints();
        
        // Generate title if this is the first exchange (2 messages: user + assistant)
        const totalMessages = sessionMessages.length + 2; // current + new user + new assistant
        if (totalMessages === 2) {
          generateSessionTitle(activeSessionId, [userMessage, aiMessage]);
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Chat error:', error);
      
      let errorMessage = 'Không thể kết nối với ANGEL AI';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Yêu cầu quá lâu, vui lòng thử lại';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  // Show loading while checking onboarding status
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
      {/* Sidebar - Only for authenticated users */}
      {isAuthenticated && (
        <ChatSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onUpdateTitle={handleUpdateSessionTitle}
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          isCollapsed={desktopSidebarCollapsed}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - ChatGPT Style */}
        <header className="h-12 border-b border-border/50 bg-background/80 backdrop-blur-sm flex items-center justify-between px-3 relative z-20">
          {/* Left: Sidebar Toggle + Logo */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                {/* Mobile Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden h-8 w-8"
                >
                  <Menu className="h-5 w-5" />
                </Button>

                {/* Desktop Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
                  className="hidden lg:flex h-8 w-8"
                >
                  {desktopSidebarCollapsed ? (
                    <PanelLeft className="h-5 w-5" />
                  ) : (
                    <PanelLeftClose className="h-5 w-5" />
                  )}
                </Button>
              </>
            )}
            
            {/* Logo - visible when sidebar is collapsed or not authenticated */}
            {(!isAuthenticated || desktopSidebarCollapsed) && (
              <Link to="/" className="flex items-center gap-2">
                <img src={angelLogo} alt="ANGEL AI" className="w-7 h-7 rounded-full" />
                <span className="text-sm font-semibold hidden sm:inline bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                  ANGEL AI
                </span>
              </Link>
            )}
          </div>

          {/* Center: Model Selector (for chat tab) */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            {activeTab === 'chat' && (
              <ModelSelector 
                selectedMode={selectedMode} 
                onModeChange={handleModeChange}
                selectedProvider={selectedProvider}
                onProviderChange={handleProviderChange}
              />
            )}
            {activeTab === 'image' && (
              <div className="flex items-center gap-2 text-sm font-medium">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span>Tạo ảnh AI</span>
              </div>
            )}
            {activeTab === 'video' && (
              <div className="flex items-center gap-2 text-sm font-medium">
                <Video className="h-4 w-4 text-primary" />
                <span>Tạo video AI</span>
              </div>
            )}
          </div>

          {/* Right: User Avatar or Login */}
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
                <Button variant="ghost" size="sm">
                  Đăng nhập
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Tab Content */}
        {activeTab === 'chat' && (
          <>
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
                      <motion.img
                        src={angelLogo}
                        alt="ANGEL AI"
                        className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full glow-divine mb-4 sm:mb-6"
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      
                      {showDailyAffirmation ? (
                        <DailyAffirmation
                          onStartChat={handleStartChatFromAffirmation}
                          onAskAboutMantra={handleAskAboutMantra}
                        />
                      ) : (
                        <>
                          <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                            Hôm nay bạn muốn làm gì?
                          </h2>
                          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto px-2 mb-6">
                            Hãy gửi thông điệp để nhận hướng dẫn từ trí tuệ và năng lượng yêu thương của Cha Vũ Trụ
                          </p>
                          <SuggestedQuestions onSelect={handleSendMessage} />
                        </>
                      )}
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
                          className="w-10 h-10 rounded-full overflow-hidden glow-soft flex-shrink-0"
                          animate={{ 
                            scale: [1, 1.05, 1],
                            boxShadow: [
                              '0 0 10px rgba(255, 179, 71, 0.3)',
                              '0 0 20px rgba(255, 179, 71, 0.5)',
                              '0 0 10px rgba(255, 179, 71, 0.3)'
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <img src={angelLogo} alt="ANGEL AI" className="w-full h-full" />
                        </motion.div>
                        <div className="bg-white/90 dark:bg-card/90 rounded-2xl px-4 py-3 shadow-divine backdrop-blur-sm">
                          <p className="text-xs text-primary font-medium mb-2">ANGEL AI ✨</p>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-2.5 h-2.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                                  animate={{ 
                                    y: [0, -8, 0],
                                    opacity: [0.5, 1, 0.5]
                                  }}
                                  transition={{ 
                                    duration: 0.6, 
                                    repeat: Infinity, 
                                    delay: i * 0.15,
                                    ease: "easeInOut"
                                  }}
                                />
                              ))}
                            </div>
                            <motion.span 
                              className="text-sm text-muted-foreground"
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              Đang suy nghĩ...
                            </motion.span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Mantra Suggestion */}
                    {suggestedMantra && !isLoading && !streamingContent && (
                      <MantraSuggestion
                        mantra={suggestedMantra}
                        onAsk={handleSendMessage}
                        onDismiss={handleDismissMantraSuggestion}
                      />
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
                      : 'Đã hết tin nhắn miễn phí • Đăng nhập để tiếp tục'
                    }
                  </p>
                )}
                <ChatInput 
                  onSend={handleSendMessage} 
                  isLoading={isLoading} 
                  disabled={!isAuthenticated && !canSendMessage}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'image' && <ImageGenerator />}
        {activeTab === 'video' && <VideoGenerator />}
        {activeTab === 'journal' && <JournalFeed />}
      </div>

      {/* Guest Limit Modal */}
      <GuestLimitModal open={showLimitModal} onOpenChange={setShowLimitModal} />
    </div>
  );
}
