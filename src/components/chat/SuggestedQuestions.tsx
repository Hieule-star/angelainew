import { motion } from 'framer-motion';
import { suggestedQuestions } from '@/data/knowledge';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="space-y-2 sm:space-y-3">
      <p className="text-xs sm:text-sm text-muted-foreground text-center">
        ✨ Gợi ý câu hỏi
      </p>
      <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center px-1 sm:px-2">
        {suggestedQuestions.map((question, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(question)}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/60 hover:bg-white/80 border border-angel-gold/20 hover:border-angel-gold/40 rounded-full transition-all shadow-soft hover:shadow-divine max-w-[calc(50%-4px)] sm:max-w-none truncate"
          >
            {question}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
