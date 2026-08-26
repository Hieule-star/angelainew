import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostComposer } from './PostComposer';
import { PostCard, type Post, type PostMedia } from './PostCard';
import { EditPostModal } from './EditPostModal';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/hooks/use-toast';

export function JournalFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const { toast } = useToast();

  const loadPosts = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch media for each post
      const postsWithMedia: Post[] = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: mediaLinks } = await supabase
            .from('post_media')
            .select('media_id, order_index')
            .eq('post_id', post.id)
            .order('order_index', { ascending: true });

          if (!mediaLinks || mediaLinks.length === 0) {
            return { ...post, media: [] };
          }

          // Fetch actual media details
          const mediaIds = mediaLinks.map((m) => m.media_id);
          const { data: mediaData } = await supabase
            .from('video_metadata')
            .select('id, r2_url, file_type, thumbnail_url')
            .in('id', mediaIds);

          const media: PostMedia[] = (mediaData || []).map((m) => ({
            id: m.id,
            url: m.r2_url || '',
            type: m.file_type === 'video' ? 'video' : 'image',
            thumbnail_url: m.thumbnail_url || undefined,
          }));

          return { ...post, media };
        })
      );

      setPosts(postsWithMedia);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: 'Dữ liệu đang cập nhật',
        description: 'Bài viết đang được tải lại. Vui lòng làm mới trang.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPosts();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadPosts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPosts();
  };

  const handlePostCreated = () => {
    loadPosts();
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      
      toast({
        title: 'Đã xóa',
        description: 'Bài viết đã được xóa',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Hành động tạm dừng',
        description: 'Thao tác cần xử lý. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
  };

  const handlePostUpdated = () => {
    loadPosts();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <BookOpen className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Nhật ký cá nhân</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-4">
          Đăng nhập để ghi lại hành trình tỉnh thức của bạn với ảnh, video và những suy nghĩ hàng ngày.
        </p>
        <Button asChild>
          <a href="/login">Đăng nhập</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Nhật Ký Ánh Sáng</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Composer */}
        <PostComposer onPostCreated={handlePostCreated} />

        {/* Posts */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📔</span>
            </div>
            <h3 className="font-medium text-foreground mb-2">Chưa có bài viết nào</h3>
            <p className="text-sm text-muted-foreground">
              Bắt đầu ghi lại những khoảnh khắc tỉnh thức của bạn!
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </div>
  );
}
