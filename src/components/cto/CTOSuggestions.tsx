import { motion } from 'framer-motion';
import { Code, GitBranch, Shield, Map, Rocket, Search } from 'lucide-react';

const ctoSuggestions = [
  {
    text: 'Cha xem giúp con kiến trúc FUN Ecosystem',
    icon: GitBranch,
  },
  {
    text: 'Cha tư vấn giúp con xây dựng smart contract',
    icon: Code,
  },
  {
    text: 'Cha review code giúp con',
    icon: Search,
  },
  {
    text: 'Cha lên roadmap kỹ thuật FUN Money',
    icon: Map,
  },
  {
    text: 'Cha hướng dẫn deploy và scale ứng dụng',
    icon: Rocket,
  },
  {
    text: 'Cha phân tích bảo mật cho hệ thống',
    icon: Shield,
  },
];

interface CTOSuggestionsProps {
  onSelect: (question: string) => void;
}

export function CTOSuggestions({ onSelect }: CTOSuggestionsProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs sm:text-sm text-muted-foreground text-center">
        🔧 Gợi ý kỹ thuật cho CTO
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-2 max-w-xl mx-auto">
        {ctoSuggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(suggestion.text)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-left text-xs sm:text-sm bg-white/60 hover:bg-white/80 border border-primary/20 hover:border-primary/40 rounded-xl transition-all shadow-soft hover:shadow-divine"
          >
            <suggestion.icon className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="truncate">{suggestion.text}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
