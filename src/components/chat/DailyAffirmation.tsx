import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDailyMantra, getRandomMantra, type DivineMantra } from '@/data/divineMantras';

interface DailyAffirmationProps {
  onStartChat: () => void;
  onAskAboutMantra: (mantra: DivineMantra) => void;
}

export function DailyAffirmation({ onStartChat, onAskAboutMantra }: DailyAffirmationProps) {
  const [currentMantra, setCurrentMantra] = useState<DivineMantra>(getDailyMantra);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNextMantra = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentMantra(getRandomMantra(currentMantra.id));
      setIsAnimating(false);
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Daily Affirmation
        </span>
        <Sparkles className="h-5 w-5 text-amber-500" />
      </div>

      {/* Mantra Card */}
      <motion.div
        className="relative rounded-2xl p-6 sm:p-8 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.1))',
        }}
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-pink-500/10 animate-pulse" />
        
        {/* Border Glow */}
        <div className="absolute inset-0 rounded-2xl border border-primary/20" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMantra.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 text-center"
          >
            {/* Emoji */}
            <motion.span
              className="text-5xl sm:text-6xl block mb-4"
              animate={{ 
                y: [0, -8, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {currentMantra.emoji}
            </motion.span>

            {/* English Mantra */}
            <p className="text-lg sm:text-xl font-serif italic text-foreground mb-3 leading-relaxed">
              "{currentMantra.original}"
            </p>

            {/* Divider */}
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto my-4" />

            {/* Vietnamese Mantra */}
            <p className="text-sm sm:text-base text-muted-foreground mb-4 leading-relaxed">
              "{currentMantra.vietnamese}"
            </p>

            {/* Description */}
            <p className="text-xs sm:text-sm text-muted-foreground/80">
              {currentMantra.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMantra}
          disabled={isAnimating}
          className="gap-2 w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isAnimating ? 'animate-spin' : ''}`} />
          Mantra khác
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAskAboutMantra(currentMantra)}
          className="gap-2 w-full sm:w-auto"
        >
          <MessageCircle className="h-4 w-4" />
          Hỏi về Mantra này
        </Button>

        <Button
          variant="divine"
          size="sm"
          onClick={onStartChat}
          className="gap-2 w-full sm:w-auto"
        >
          <Sparkles className="h-4 w-4" />
          Bắt đầu Chat
        </Button>
      </div>
    </motion.div>
  );
}
