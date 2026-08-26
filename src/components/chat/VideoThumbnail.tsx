import { useState, useRef, useEffect } from 'react';
import { Loader2, Play, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoThumbnailProps {
  videoUrl: string;
  cachedThumbnailUrl?: string;
  alt?: string;
  className?: string;
  onThumbnailGenerated?: (dataUrl: string) => void;
}

/**
 * VideoThumbnail component that generates thumbnails from video's first frame
 * Uses canvas to capture frame when no cached thumbnail is available
 */
export function VideoThumbnail({
  videoUrl,
  cachedThumbnailUrl,
  alt = 'Video thumbnail',
  className,
  onThumbnailGenerated,
}: VideoThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(cachedThumbnailUrl || null);
  const [isLoading, setIsLoading] = useState(!cachedThumbnailUrl);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // If we already have a cached thumbnail, use it
    if (cachedThumbnailUrl) {
      setThumbnailUrl(cachedThumbnailUrl);
      setIsLoading(false);
      return;
    }

    // Otherwise, generate from video
    if (!videoUrl) {
      setError(true);
      setIsLoading(false);
      return;
    }

    generateThumbnail();
  }, [videoUrl, cachedThumbnailUrl]);

  const generateThumbnail = () => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    
    video.onloadeddata = () => {
      // Seek to first frame (0.1s to avoid black frame)
      video.currentTime = 0.1;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          setError(true);
          setIsLoading(false);
          return;
        }

        // Set canvas size (thumbnail size)
        const aspectRatio = video.videoWidth / video.videoHeight;
        canvas.width = 320;
        canvas.height = Math.round(320 / aspectRatio);

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        setThumbnailUrl(dataUrl);
        setIsLoading(false);

        // Callback for caching
        if (onThumbnailGenerated) {
          onThumbnailGenerated(dataUrl);
        }

        // Cleanup
        video.remove();
      } catch (err) {
        console.error('Error generating thumbnail:', err);
        setError(true);
        setIsLoading(false);
      }
    };

    video.onerror = () => {
      console.error('Error loading video for thumbnail');
      setError(true);
      setIsLoading(false);
    };

    video.src = videoUrl;
  };

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted",
        className
      )}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !thumbnailUrl) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted",
        className
      )}>
        <ImageOff className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        src={thumbnailUrl}
        alt={alt}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
        <Play className="w-4 h-4 text-white" />
      </div>
    </div>
  );
}
