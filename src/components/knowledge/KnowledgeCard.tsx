import { motion } from 'framer-motion';
import type { KnowledgeTopic } from '@/types';

interface KnowledgeCardProps {
  topic: KnowledgeTopic;
  onClick: () => void;
}

export function KnowledgeCard({ topic, onClick }: KnowledgeCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-4 bg-white hover:bg-white/95 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md border border-border/30 hover:border-primary/20 group flex flex-col items-center text-center"
    >
      {/* Large Icon */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
        {topic.icon}
      </div>
      
      {/* Title */}
      <h3 className="font-semibold text-foreground mb-1.5 line-clamp-2 group-hover:text-primary transition-colors text-sm">
        {topic.title}
      </h3>
      
      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {topic.description}
      </p>
    </motion.div>
  );
}
