import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getMoodById } from './MoodSelector';
import { cn } from '@/lib/utils';

interface PostMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail_url?: string;
}

interface Post {
  id: string;
  content: string | null;
  mood: string | null;
  created_at: string;
  media: PostMedia[];
}

interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, onEdit, onDelete }: PostCardProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const mood = post.mood ? getMoodById(post.mood) : null;
  const hasMedia = post.media && post.media.length > 0;
  const hasMultipleMedia = post.media && post.media.length > 1;
  const currentMedia = hasMedia ? post.media[currentMediaIndex] : null;

  const goToNextMedia = () => {
    if (hasMultipleMedia) {
      setCurrentMediaIndex((prev) => (prev + 1) % post.media.length);
    }
  };

  const goToPrevMedia = () => {
    if (hasMultipleMedia) {
      setCurrentMediaIndex((prev) => (prev - 1 + post.media.length) % post.media.length);
    }
  };

  const handleDelete = () => {
    onDelete?.(post.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border/50 shadow-soft overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-lg">✨</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">Nhật ký của tôi</span>
                {mood && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    mood.color
                  )}>
                    {mood.emoji} {mood.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { 
                  addSuffix: true, 
                  locale: vi 
                })}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(post)}>
                <Pencil className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
          </div>
        )}

        {/* Media Gallery */}
        {hasMedia && (
          <div 
            className="relative aspect-video bg-muted cursor-pointer"
            onClick={() => setShowMediaModal(true)}
          >
            {currentMedia?.type === 'image' ? (
              <img
                src={currentMedia.url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : currentMedia?.type === 'video' ? (
              <div className="relative w-full h-full">
                {currentMedia.thumbnail_url ? (
                  <img
                    src={currentMedia.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={currentMedia.url}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-6 h-6 text-foreground fill-current ml-1" />
                  </div>
                </div>
              </div>
            ) : null}

            {/* Navigation arrows */}
            {hasMultipleMedia && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevMedia();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextMedia();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </>
            )}

            {/* Media counter */}
            {hasMultipleMedia && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs">
                {currentMediaIndex + 1}/{post.media.length}
              </div>
            )}
          </div>
        )}

        {/* Dots indicator */}
        {hasMultipleMedia && (
          <div className="px-4 py-2 flex justify-center gap-1">
            {post.media.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentMediaIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentMediaIndex 
                    ? "bg-primary" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
            <AlertDialogDescription>
              Bài viết này sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Media Modal */}
      {showMediaModal && currentMedia && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setShowMediaModal(false)}
        >
          <button
            onClick={() => setShowMediaModal(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {currentMedia.type === 'image' ? (
            <img
              src={currentMedia.url}
              alt=""
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              src={currentMedia.url}
              className="max-w-full max-h-full"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Navigation in modal */}
          {hasMultipleMedia && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevMedia();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextMedia();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

export type { Post, PostMedia };
