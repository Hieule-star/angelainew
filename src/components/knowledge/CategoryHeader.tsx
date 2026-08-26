import { motion } from 'framer-motion';
import { getCategoryIcon, getCategoryDescription } from '@/data/categories';

interface CategoryHeaderProps {
  categoryName: string;
  topicCount: number;
}

export function CategoryHeader({ categoryName, topicCount }: CategoryHeaderProps) {
  const icon = getCategoryIcon(categoryName);
  const description = getCategoryDescription(categoryName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 mb-4"
    >
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl shadow-sm">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">{categoryName}</h2>
          <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
            {topicCount} topics
          </span>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </motion.div>
  );
}
