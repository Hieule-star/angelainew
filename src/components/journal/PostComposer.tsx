import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MediaPicker, type MediaFile } from './MediaPicker';
import { MoodSelector } from './MoodSelector';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/hooks/use-toast';

interface PostComposerProps {
  onPostCreated: () => void;
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { uploadFile, progress } = useMediaUpload();
  const user = useUserStore((state) => state.user);
  const { toast } = useToast();

  const canSubmit = content.trim() || mediaFiles.length > 0;

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(Math.floor(video.duration));
      };
      video.onerror = () => resolve(0);
      video.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit || !user?.id) return;

    setIsSubmitting(true);

    try {
      // Step 1: Upload all media files
      const uploadedMedia: { assetId: string; url: string }[] = [];
      
      for (const file of mediaFiles) {
        if (file.uploadedUrl && file.assetId) {
          uploadedMedia.push({ assetId: file.assetId, url: file.uploadedUrl });
          continue;
        }

        const duration = file.type === 'video' ? await getVideoDuration(file.file) : undefined;
        const result = await uploadFile(file.file, duration);
        
        if (result.success && result.publicUrl && result.assetId) {
          uploadedMedia.push({ assetId: result.assetId, url: result.publicUrl });
        }
      }

      // Step 2: Create post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim() || null,
          mood: mood || null,
          visibility: 'private',
        })
        .select()
        .single();

      if (postError) throw postError;

      // Step 3: Link media to post
      if (uploadedMedia.length > 0 && post) {
        const postMediaInserts = uploadedMedia.map((media, index) => ({
          post_id: post.id,
          media_id: media.assetId,
          order_index: index,
        }));

        const { error: linkError } = await supabase
          .from('post_media')
          .insert(postMediaInserts);

        if (linkError) {
          console.error('Error linking media:', linkError);
        }
      }

      // Reset form
      setContent('');
      setMood(null);
      setMediaFiles([]);
      
      toast({
        title: '✨ Đã lưu vào nhật ký',
        description: 'Bài viết của bạn đã được lưu thành công',
      });

      onPostCreated();

    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Cần xử lý',
        description: 'Bài viết cần được xác minh. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border/50 shadow-soft overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Ghi chú mới</h3>
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-4">
        {/* Text Input */}
        <Textarea
          placeholder="Hôm nay con cảm thấy..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-none border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-muted-foreground/60"
          disabled={isSubmitting}
        />

        {/* Media Picker */}
        <MediaPicker
          selectedFiles={mediaFiles}
          onFilesChange={setMediaFiles}
          maxFiles={10}
          disabled={isSubmitting}
        />

        {/* Mood Selector */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Tâm trạng hôm nay:</p>
          <MoodSelector
            selectedMood={mood}
            onSelect={setMood}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/50 flex justify-between items-center bg-muted/30">
        <p className="text-xs text-muted-foreground">
          {mediaFiles.length > 0 && `${mediaFiles.length} media • `}
          Chỉ bạn mới xem được
        </p>
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
              <Send className="w-4 h-4" />
              Lưu nhật ký
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
