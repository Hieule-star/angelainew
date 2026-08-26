import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, Brain, BookOpen, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ChatMessage, AIModel, AIProvider } from '@/types';
import angelLogo from '@/assets/angel-logo.png';
import { AudioAttachment, extractAudioUrls } from './AudioAttachment';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatBubbleProps {
  message: ChatMessage;
}

const getModelBadge = (model?: AIModel) => {
  switch (model) {
    case 'google/gemini-3.1-flash-lite':
      return { icon: <Zap className="w-3 h-3" />, name: 'Flash Lite 3.1', color: 'text-cyan-500' };
    case 'google/gemini-2.5-flash-lite':
      return { icon: <Zap className="w-3 h-3" />, name: 'Flash Lite', color: 'text-cyan-500' };
    case 'google/gemini-2.5-flash':
      return { icon: <Zap className="w-3 h-3" />, name: 'Flash', color: 'text-blue-500' };
    case 'google/gemini-2.5-pro':
      return { icon: <Sparkles className="w-3 h-3" />, name: 'Pro', color: 'text-purple-500' };
    case 'openai/gpt-5-mini':
      return { icon: <Brain className="w-3 h-3" />, name: 'GPT-5 Mini', color: 'text-green-500' };
    case 'openai/gpt-5':
      return { icon: <Brain className="w-3 h-3" />, name: 'GPT-5', color: 'text-amber-500' };
    default:
      return null;
  }
};

const getProviderBadge = (provider?: AIProvider) => {
  if (provider === 'openai') {
    return { icon: <RefreshCw className="w-3 h-3" />, name: 'OpenAI Backup', color: 'text-orange-500 bg-orange-500/10' };
  }
  return null; // Default Lovable provider doesn't need badge
};

export function ChatBubble({ message }: ChatBubbleProps) {
  const [showSources, setShowSources] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const isUser = message.role === 'user';
  const modelBadge = !isUser ? getModelBadge(message.model) : null;
  const providerBadge = !isUser ? getProviderBadge(message.provider) : null;
  const hasSources = !isUser && message.sources && message.sources.length > 0;

  async function submitKnowledgeFeedback(topicId: string, feedbackType: string) {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    if (!userId) {
      toast({
        title: 'Cáº§n Ä‘Äƒng nháº­p',
        description: 'Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ gá»­i feedback knowledge.',
        variant: 'destructive',
      });
      return;
    }

    const feedbackTable = supabase.from('knowledge_feedback') as unknown as {
      insert: (payload: { topic_id: string; feedback_type: string; user_id: string }) => Promise<{ error: { message: string } | null }>;
    };
    const { error } = await feedbackTable.insert({
      topic_id: topicId,
      feedback_type: feedbackType,
      user_id: userId,
    });

    if (error) {
      toast({
        title: 'ChÆ°a gá»­i Ä‘Æ°á»£c feedback',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setSubmittedFeedback((prev) => ({ ...prev, [topicId]: feedbackType }));
    toast({ title: 'ÄÃ£ ghi nháº­n feedback knowledge.' });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 ${isUser ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'}`}>
        {isUser ? (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-angel-pink flex items-center justify-center">
            <span className="text-sm sm:text-lg">👤</span>
          </div>
        ) : (
          <motion.div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden glow-soft"
            animate={{ boxShadow: ['0 0 20px rgba(248, 227, 142, 0.3)', '0 0 30px rgba(248, 227, 142, 0.5)', '0 0 20px rgba(248, 227, 142, 0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <img src={angelLogo} alt="ANGEL AI" className="w-full h-full object-cover" />
          </motion.div>
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`max-w-[85%] sm:max-w-[80%] md:max-w-[70%] ${
          isUser
            ? 'bg-angel-gold/20 border border-angel-gold/30'
            : 'bg-white/80 border border-angel-gold/20 shadow-divine'
        } rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 backdrop-blur-sm`}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
            <p className="text-[11px] sm:text-xs text-angel-gold font-medium">ANGEL AI ✨</p>
            {modelBadge && (
              <span className={`flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full bg-muted/50 ${modelBadge.color}`}>
                {modelBadge.icon}
                <span className="hidden xs:inline">{modelBadge.name}</span>
              </span>
            )}
            {providerBadge && (
              <span className={`hidden sm:flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${providerBadge.color}`}>
                {providerBadge.icon}
                {providerBadge.name}
              </span>
            )}
          </div>
        )}
        {(() => {
          const { cleanText, audioUrls } = extractAudioUrls(message.message);
          return (
            <>
              {cleanText && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{cleanText}</p>
              )}
              {audioUrls.map((url) => (
                <AudioAttachment key={url} url={url} />
              ))}
            </>
          );
        })()}

        
        {/* Sources Section */}
        {hasSources && (
          <div className="mt-3 pt-2 border-t border-angel-gold/10">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1.5 text-xs text-angel-gold/70 hover:text-angel-gold transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              <span>Nguồn knowledge ({message.sources!.length})</span>
              {showSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
            <AnimatePresence>
              {showSources && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-1">
                    {message.sources!.map((source, index) => (
                      <div key={index} className="space-y-1">
                      <Link
                        to={`/knowledge?topic=${source.id}`}
                        className="flex items-center gap-2 text-xs bg-angel-gold/5 hover:bg-angel-gold/10 rounded-lg px-2 py-1.5 transition-colors group"
                      >
                        <span className="text-angel-gold">📚</span>
                        <span className="text-foreground/80 truncate flex-1 group-hover:text-angel-gold transition-colors">{source.title}</span>
                        <span className="text-muted-foreground text-[10px] shrink-0">{source.category}</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-angel-gold transition-colors" />
                      </Link>
                      <div className="flex flex-wrap gap-1 px-2 pb-1">
                        {[
                          ['correct', 'ÄÃºng'],
                          ['incorrect', 'ChÆ°a Ä‘Ãºng'],
                          ['outdated', 'ThÃ´ng tin cÅ©'],
                          ['needs_more', 'Cáº§n bá»• sung'],
                        ].map(([type, label]) => (
                          <button
                            key={type}
                            type="button"
                            disabled={submittedFeedback[source.id] === type}
                            onClick={() => submitKnowledgeFeedback(source.id, type)}
                            className="rounded-full border border-angel-gold/20 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-angel-gold disabled:bg-angel-gold/10 disabled:text-angel-gold"
                          >
                            {submittedFeedback[source.id] === type ? '✓ ' : ''}
                            {label}
                          </button>
                        ))}
                      </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}
