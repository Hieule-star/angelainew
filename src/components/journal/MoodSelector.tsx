import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Mood {
  id: string;
  emoji: string;
  label: string;
  color: string;
}

export const MOODS: Mood[] = [
  { id: 'happy', emoji: '😊', label: 'Vui vẻ', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { id: 'grateful', emoji: '🙏', label: 'Biết ơn', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  { id: 'peaceful', emoji: '🧘', label: 'Bình an', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 'awakened', emoji: '✨', label: 'Tỉnh thức', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { id: 'loved', emoji: '💖', label: 'Yêu thương', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { id: 'inspired', emoji: '🌟', label: 'Cảm hứng', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
];

interface MoodSelectorProps {
  selectedMood: string | null;
  onSelect: (mood: string) => void;
  compact?: boolean;
}

export function MoodSelector({ selectedMood, onSelect, compact = false }: MoodSelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", compact ? "gap-1" : "gap-2")}>
      {MOODS.map((mood) => (
        <motion.button
          key={mood.id}
          type="button"
          onClick={() => onSelect(selectedMood === mood.id ? '' : mood.id)}
          className={cn(
            "flex items-center gap-1.5 rounded-full transition-all duration-200",
            compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
            selectedMood === mood.id 
              ? `${mood.color} ring-2 ring-primary/50` 
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>{mood.emoji}</span>
          {!compact && <span>{mood.label}</span>}
        </motion.button>
      ))}
    </div>
  );
}

export function getMoodById(id: string): Mood | undefined {
  return MOODS.find((m) => m.id === id);
}
