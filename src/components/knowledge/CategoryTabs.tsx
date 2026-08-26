import { motion } from 'framer-motion';
import { KNOWLEDGE_CATEGORIES } from '@/data/categories';

interface CategoryTabsProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  categoryCounts: Record<string, number>;
}

export function CategoryTabs({ selectedCategory, onSelectCategory, categoryCounts }: CategoryTabsProps) {
  return (
    <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      <div className="flex gap-2 min-w-max">
        {/* All Topics Tab */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectCategory(null)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            selectedCategory === null
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-white/80 text-muted-foreground hover:bg-white hover:text-foreground border border-border/50'
          }`}
        >
          <span>📚</span>
          <span>All Topics</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            selectedCategory === null ? 'bg-white/20' : 'bg-muted'
          }`}>
            {Object.values(categoryCounts).reduce((a, b) => a + b, 0)}
          </span>
        </motion.button>

        {/* Category Tabs */}
        {KNOWLEDGE_CATEGORIES.map((category) => {
          const count = categoryCounts[category.name] || categoryCounts[category.nameEn] || 0;
          const isActive = selectedCategory === category.name || selectedCategory === category.nameEn;
          
          return (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectCategory(category.name)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-white/80 text-muted-foreground hover:bg-white hover:text-foreground border border-border/50'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20' : 'bg-muted'
                }`}>
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
