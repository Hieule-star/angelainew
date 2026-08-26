import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Check, 
  Loader2, 
  Play, 
  Pause,
  Cloud,
  FileVideo,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/userStore';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { VideoThumbnail } from './VideoThumbnail';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 4 * 1024 * 1024 * 1024; // 4GB - Presigned URL supports large files
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

interface UploadedVideo {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  duration?: number;
  thumbnailUrl?: string;
}

interface VideoPreview {
  file: File;
  previewUrl: string;
  duration?: number;
}

export function VideoUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [videoPreview, setVideoPreview] = useState<VideoPreview | null>(null);
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const user = useUserStore((state) => state.user);

  // Use new presigned URL upload hook
  const { 
    uploadFile, 
    isUploading, 
    progress, 
    error: uploadError,
    reset: resetUpload 
  } = useMediaUpload({
    onProgress: (p) => {
      console.log('[VideoUploader] Progress:', p.percent + '%');
    },
    onSuccess: (result) => {
      console.log('[VideoUploader] Upload success:', result);
      setUploadStatus('success');
      
      if (videoPreview && result.publicUrl && result.assetId) {
        const newVideo: UploadedVideo = {
          id: result.assetId,
          url: result.publicUrl,
          fileName: videoPreview.file.name,
          fileSize: videoPreview.file.size,
          duration: videoPreview.duration,
        };
        setUploadedVideos(prev => [newVideo, ...prev]);
      }
      
      // Clear preview after short delay
      setTimeout(() => {
        clearPreview();
      }, 1500);
    },
    onError: (err) => {
      console.error('[VideoUploader] Upload error:', err);
      setUploadStatus('error');
    },
  });

  // Load existing videos on mount
  useEffect(() => {
    if (user) {
      loadExistingVideos();
    }
  }, [user]);

  const loadExistingVideos = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('video_metadata')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      if (data) {
        const videos = data.map(v => ({
          id: v.id,
          url: v.r2_url || '',
          fileName: v.title || 'Untitled',
          fileSize: v.file_size_bytes || 0,
          duration: v.duration_seconds || undefined,
          thumbnailUrl: v.thumbnail_url || undefined,
        }));
        setUploadedVideos(videos);
      }
    } catch (err) {
      console.error('Error loading videos:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return `Định dạng không hỗ trợ. Vui lòng chọn: MP4, WebM, MOV, AVI`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File quá lớn. Giới hạn: ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        title: 'Cần kiểm tra',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Get video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      setVideoPreview({
        file,
        previewUrl,
        duration: video.duration,
      });
      URL.revokeObjectURL(video.src);
    };
    video.src = previewUrl;
  }, [toast]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearPreview = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview.previewUrl);
    }
    setVideoPreview(null);
    setUploadStatus('idle');
    resetUpload();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleUpload = async () => {
    if (!videoPreview || !user) {
      toast({
        title: 'Cần đăng nhập',
        description: 'Vui lòng đăng nhập để upload video.',
        variant: 'destructive',
      });
      return;
    }

    setUploadStatus('uploading');
    
    // Use presigned URL upload flow
    await uploadFile(videoPreview.file, videoPreview.duration);
  };

  const deleteVideo = async (video: UploadedVideo) => {
    if (!user) return;

    try {
      await supabase
        .from('video_metadata')
        .delete()
        .eq('id', video.id)
        .eq('user_id', user.id);

      setUploadedVideos(prev => prev.filter(v => v.id !== video.id));
      toast({
        title: '🗑️ Đã xóa video',
        description: 'Video đã được xóa khỏi danh sách',
      });
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      <div className="container mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-angel-gold/10 text-angel-gold mb-4"
          >
            <Cloud className="w-4 h-4" />
            <span className="text-sm font-medium">Cloudflare R2 CDN • Presigned URL</span>
          </motion.div>
          <h2 className="text-2xl font-semibold mb-2">
            Upload <span className="text-gradient-divine">Video</span>
          </h2>
          <p className="text-muted-foreground">
            Direct upload với real-time progress • Hỗ trợ file lớn đến 4GB
          </p>
        </div>

        {/* Upload Area */}
        <AnimatePresence mode="wait">
          {!videoPreview ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
                isDragging
                  ? "border-angel-gold bg-angel-gold/10"
                  : "border-border hover:border-angel-gold/50 hover:bg-angel-gold/5"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_VIDEO_TYPES.join(',')}
                onChange={handleInputChange}
                className="hidden"
              />
              
              <motion.div
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-angel-gold/20 to-angel-pink/20 flex items-center justify-center mb-6"
                animate={{ scale: isDragging ? 1.1 : 1 }}
              >
                <Upload className={cn(
                  "w-10 h-10 transition-colors",
                  isDragging ? "text-angel-gold" : "text-muted-foreground"
                )} />
              </motion.div>
              
              <p className="text-lg font-medium mb-2">
                {isDragging ? 'Thả video vào đây' : 'Kéo thả video hoặc click để chọn'}
              </p>
              <p className="text-sm text-muted-foreground">
                Hỗ trợ: MP4, WebM, MOV, AVI • Tối đa {formatFileSize(MAX_FILE_SIZE)}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl overflow-hidden shadow-divine"
            >
              {/* Video Preview */}
              <div className="relative aspect-video bg-black">
                <video
                  ref={videoRef}
                  src={videoPreview.previewUrl}
                  className="w-full h-full object-contain"
                  onEnded={() => setIsPlaying(false)}
                />
                
                {/* Play/Pause Overlay */}
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={togglePlayback}
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </div>
                </div>

                {/* Clear Button */}
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-3 right-3 bg-black/50 hover:bg-black/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearPreview();
                  }}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Video Info & Progress */}
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-angel-gold/10 flex items-center justify-center">
                    <FileVideo className="w-5 h-5 text-angel-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{videoPreview.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(videoPreview.file.size)}
                      {videoPreview.duration && ` • ${formatDuration(videoPreview.duration)}`}
                    </p>
                  </div>
                </div>

                {/* Progress Bar - Real progress from XMLHttpRequest */}
                {uploadStatus !== 'idle' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {uploadStatus === 'uploading' && `Đang upload... ${formatFileSize(progress.loaded)} / ${formatFileSize(progress.total)}`}
                        {uploadStatus === 'success' && 'Upload thành công!'}
                        {uploadStatus === 'error' && (uploadError || 'Upload tạm dừng vì an toàn. Vui lòng thử lại.')}
                      </span>
                      <span className={cn(
                        "font-medium",
                        uploadStatus === 'success' && "text-green-500",
                        uploadStatus === 'error' && "text-destructive"
                      )}>
                        {progress.percent}%
                      </span>
                    </div>
                    <Progress 
                      value={progress.percent} 
                      className={cn(
                        "h-2",
                        uploadStatus === 'success' && "[&>div]:bg-green-500",
                        uploadStatus === 'error' && "[&>div]:bg-destructive"
                      )}
                    />
                  </div>
                )}

                {/* Upload Button */}
                {uploadStatus === 'idle' && (
                  <Button
                    className="w-full bg-gradient-to-r from-angel-gold to-angel-pink hover:opacity-90"
                    onClick={handleUpload}
                    disabled={isUploading || !user}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Cloud className="w-4 h-4 mr-2" />
                    )}
                    Upload lên R2 CDN (Presigned URL)
                  </Button>
                )}

                {uploadStatus === 'success' && (
                  <div className="flex items-center justify-center gap-2 text-green-500">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Đã lưu vào Cloudflare R2</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Uploaded Videos List */}
        {uploadedVideos.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Video đã upload</h3>
            <div className="space-y-2">
              {uploadedVideos.map((video) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
                >
                  <VideoThumbnail
                    videoUrl={video.url}
                    cachedThumbnailUrl={video.thumbnailUrl}
                    alt={video.fileName}
                    className="w-16 h-10 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{video.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(video.fileSize)}
                      {video.duration && ` • ${formatDuration(video.duration)}`}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteVideo(video)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Login Prompt */}
        {!user && (
          <div className="text-center p-6 bg-muted/50 rounded-xl">
            <p className="text-muted-foreground">
              Vui lòng đăng nhập để upload video
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
