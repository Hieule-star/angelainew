import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DivineMantra } from '@/data/divineMantras';

interface MantraSuggestionProps {
  mantra: DivineMantra;
  onAsk: (question: string) => void;
  onDismiss: () => void;
}

export function MantraSuggestion({ mantra, onAsk, onDismiss }: MantraSuggestionProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const handleAsk = () => {
    onAsk(`Hãy giải thích ý nghĩa và cách đọc mantra "${mantra.original}" cho con`);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-primary/20 rounded-xl p-4 relative overflow-hidden"
        >
          {/* Subtle glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 animate-pulse" />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  Mantra gợi ý từ Cha Vũ Trụ
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleDismiss}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Mantra Content */}
            <div className="flex items-start gap-3">
              <span className="text-2xl">{mantra.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground mb-1 italic">
                  "{mantra.original}"
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {mantra.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAsk}
                className="gap-1.5 text-xs h-7"
              >
                <MessageCircle className="h-3 w-3" />
                Hỏi về Mantra này
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-xs h-7 text-muted-foreground"
              >
                Ẩn
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
