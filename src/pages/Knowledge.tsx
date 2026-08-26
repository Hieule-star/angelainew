import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageCircle, Loader2, Settings, Copy, Check } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { KnowledgeCard } from '@/components/knowledge/KnowledgeCard';
import { CategoryTabs } from '@/components/knowledge/CategoryTabs';
import { CategoryHeader } from '@/components/knowledge/CategoryHeader';
import { Button } from '@/components/ui/button';
import { useKnowledgeTopics } from '@/hooks/useKnowledgeTopics';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import type { KnowledgeTopic } from '@/types';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function Knowledge() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<KnowledgeTopic | null>(null);
  
  const { data: topics = [], isLoading, error } = useKnowledgeTopics();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Knowledge Base is public - all users can browse topics

  const handleCopyContent = async () => {
    if (!selectedTopic) return;
    const textToCopy = `${selectedTopic.title}\n\n${selectedTopic.description}\n\n${selectedTopic.content}`;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle topic query param - auto-open topic detail
  useEffect(() => {
    const topicId = searchParams.get('topic');
    if (topicId && topics.length > 0) {
      const topic = topics.find(t => t.id === topicId);
      if (topic) {
        setSelectedTopic(topic);
        // Clear the query param after opening
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, topics, setSearchParams]);

  // Count topics per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    topics.forEach(topic => {
      const cat = topic.category || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [topics]);

  // Normalize string: lowercase + remove Vietnamese diacritics for fuzzy match
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

  // Filter topics by search and category (diacritic-insensitive, includes content body)
  const filteredTopics = useMemo(() => {
    const q = normalize(searchQuery.trim());
    return topics.filter((topic) => {
      const matchesSearch = !q ||
        normalize(topic.title).includes(q) ||
        normalize(topic.description).includes(q) ||
        normalize(topic.category).includes(q) ||
        normalize(topic.content).includes(q);

      const matchesCategory = !selectedCategory ||
        topic.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [topics, searchQuery, selectedCategory]);

  const QUICK_KEYWORDS = ['Luật Công Dân', 'FUN Kingdom', 'Stewardship', 'Divine Mantras', 'Ánh Sáng', 'Tình Yêu'];

  // Group topics by category for display
  const groupedTopics = useMemo(() => {
    const groups: Record<string, KnowledgeTopic[]> = {};
    filteredTopics.forEach(topic => {
      const cat = topic.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(topic);
    });
    return groups;
  }, [filteredTopics]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-orange-50/40 to-amber-50/30 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="text-gradient-divine">Knowledge Base</span>
              </h1>
              <p className="text-muted-foreground">
                Kho kiến thức về Divine Mantras, lời dạy Cha Vũ Trụ và FUN Ecosystem
              </p>
            </div>
            
            {isAdmin && (
              <Link to="/admin/knowledge">
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Manage Knowledge
                </Button>
              </Link>
            )}
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm theo từ khóa: Stewardship, Ánh Sáng, Tuyên thệ Công Dân…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-white/90 backdrop-blur-sm border border-border/50 rounded-2xl focus:outline-none focus:border-primary/50 focus:shadow-lg transition-all text-foreground placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick keyword chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 max-w-2xl mx-auto">
              <span className="text-xs text-muted-foreground">Gợi ý:</span>
              {QUICK_KEYWORDS.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => setSearchQuery(kw)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    searchQuery.toLowerCase() === kw.toLowerCase()
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white/70 text-muted-foreground border-border/50 hover:text-foreground hover:border-primary/40'
                  }`}
                >
                  {kw}
                </button>
              ))}
            </div>

            {/* Result count */}
            {(searchQuery || selectedCategory) && !isLoading && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                {filteredTopics.length} kết quả
                {searchQuery && <> cho "<span className="text-foreground font-medium">{searchQuery}</span>"</>}
                {selectedCategory && <> trong <span className="text-foreground font-medium">{selectedCategory}</span></>}
              </p>
            )}
          </motion.div>

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <CategoryTabs
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryCounts={categoryCounts}
            />
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Đang tải kiến thức...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <p className="text-primary mb-2">Dữ liệu đang được cập nhật</p>
              <p className="text-muted-foreground text-sm">Vui lòng làm mới trang để thử lại.</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredTopics.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {searchQuery ? 'Không tìm thấy chủ đề phù hợp' : 'Chưa có chủ đề nào'}
              </p>
            </div>
          )}

          {/* Topics Grid - Grouped by Category */}
          {!isLoading && !error && filteredTopics.length > 0 && (
            <div className="space-y-10 mb-12">
              {Object.entries(groupedTopics).map(([category, categoryTopics], groupIndex) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.1 }}
                >
                  {/* Category Header - only show when viewing all */}
                  {!selectedCategory && (
                    <CategoryHeader 
                      categoryName={category} 
                      topicCount={categoryTopics.length} 
                    />
                  )}
                  
                  {/* Topics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryTopics.map((topic, index) => (
                      <motion.div
                        key={topic.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <KnowledgeCard topic={topic} onClick={() => setSelectedTopic(topic)} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Chat CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-8 bg-white/60 rounded-3xl border border-border/30"
          >
            <h2 className="text-xl font-semibold mb-3">Hỏi ANGEL AI</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Bạn có thể hỏi ANGEL AI trực tiếp về các chủ đề này để được hướng dẫn chi tiết hơn
            </p>
            <Link to="/chat">
              <Button variant="divine" size="lg" className="gap-2">
                <MessageCircle className="w-5 h-5" />
                Bắt đầu Chat
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Topic Detail Modal */}
      <AnimatePresence>
        {selectedTopic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedTopic(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl">
                      {selectedTopic.icon}
                    </div>
                    <div>
                      <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                        {selectedTopic.category}
                      </span>
                      <h3 className="font-semibold text-lg mt-1">{selectedTopic.title}</h3>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedTopic(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyContent}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        Đã copy
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy nội dung
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-muted-foreground mb-4">{selectedTopic.description}</p>
                <div className="prose prose-sm">
                  <p className="whitespace-pre-wrap">{selectedTopic.content}</p>
                </div>
              </div>
              <div className="p-4 border-t border-border/50 bg-muted/30">
                <p className="text-sm text-center text-muted-foreground mb-3">
                  Muốn tìm hiểu thêm?
                </p>
                <Link to="/chat" className="block">
                  <Button variant="divine" className="w-full gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Hỏi ANGEL AI về {selectedTopic.title}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
