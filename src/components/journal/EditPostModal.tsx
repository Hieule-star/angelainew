import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MoodSelector } from './MoodSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Post } from './PostCard';

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: () => void;
}

export function EditPostModal({ post, isOpen, onClose, onPostUpdated }: EditPostModalProps) {
  const [content, setContent] = useState(post.content || '');
  const [mood, setMood] = useState<string | null>(post.mood);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Sync state when post changes
  useEffect(() => {
    setContent(post.content || '');
    setMood(post.mood);
  }, [post]);

  const canSubmit = content.trim() || post.media.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content: content.trim() || null,
          mood: mood || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (error) throw error;

      toast({
        title: '✨ Đã cập nhật',
        description: 'Bài viết đã được chỉnh sửa thành công',
      });

      onPostUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: 'Cần xử lý',
        description: 'Cập nhật cần được xác minh. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-2xl border border-border/50 shadow-lg w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-medium text-foreground">Chỉnh sửa bài viết</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Text Input */}
          <Textarea
            placeholder="Hôm nay con cảm thấy..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none border-0 bg-muted/30 focus-visible:ring-1 focus-visible:ring-primary/50 text-base placeholder:text-muted-foreground/60 rounded-xl"
            disabled={isSubmitting}
          />

          {/* Media Preview (read-only) */}
          {post.media.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Media đính kèm:</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {post.media.map((media) => (
                  <div
                    key={media.id}
                    className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted"
                  >
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={media.thumbnail_url || media.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                * Media không thể thay đổi sau khi đăng
              </p>
            </div>
          )}

          {/* Mood Selector */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Tâm trạng:</p>
            <MoodSelector
              selectedMood={mood}
              onSelect={setMood}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border/50 flex justify-end gap-2 bg-muted/30">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
