import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, Video, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { cn } from '@/lib/utils';

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  uploading?: boolean;
  uploadedUrl?: string;
  assetId?: string;
}

interface MediaPickerProps {
  selectedFiles: MediaFile[];
  onFilesChange: (files: MediaFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function MediaPicker({ 
  selectedFiles, 
  onFilesChange, 
  maxFiles = 10,
  disabled = false 
}: MediaPickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = useMediaUpload();

  const validateFile = (file: File): string | null => {
    if (![...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].includes(file.type)) {
      return 'Chỉ hỗ trợ ảnh (JPEG, PNG, GIF, WebP) và video (MP4, WebM, MOV)';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File quá lớn. Tối đa 100MB';
    }
    return null;
  };

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

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (disabled) return;
    
    const fileArray = Array.from(files);
    const remainingSlots = maxFiles - selectedFiles.length;
    const filesToProcess = fileArray.slice(0, remainingSlots);

    const newFiles: MediaFile[] = [];

    for (const file of filesToProcess) {
      const error = validateFile(file);
      if (error) {
        console.error(error);
        continue;
      }

      const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
      const mediaFile: MediaFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
        uploading: false,
      };

      newFiles.push(mediaFile);
    }

    if (newFiles.length > 0) {
      onFilesChange([...selectedFiles, ...newFiles]);
    }
  }, [selectedFiles, onFilesChange, maxFiles, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles, disabled]);

  const removeFile = useCallback((id: string) => {
    const file = selectedFiles.find(f => f.id === id);
    if (file) {
      URL.revokeObjectURL(file.preview);
    }
    onFilesChange(selectedFiles.filter(f => f.id !== id));
  }, [selectedFiles, onFilesChange]);

  const uploadAllFiles = async (): Promise<MediaFile[]> => {
    const uploadedFiles: MediaFile[] = [];
    let currentFiles = [...selectedFiles];

    for (const file of selectedFiles) {
      if (file.uploadedUrl) {
        uploadedFiles.push(file);
        continue;
      }

      // Update status to uploading
      currentFiles = currentFiles.map(f => 
        f.id === file.id ? { ...f, uploading: true } : f
      );
      onFilesChange(currentFiles);

      const duration = file.type === 'video' ? await getVideoDuration(file.file) : undefined;
      const result = await uploadFile(file.file, duration);

      if (result.success && result.publicUrl) {
        const updated = {
          ...file,
          uploading: false,
          uploadedUrl: result.publicUrl,
          assetId: result.assetId,
        };
        uploadedFiles.push(updated);
        
        // Update in state
        currentFiles = currentFiles.map(f => 
          f.id === file.id ? updated : f
        );
        onFilesChange(currentFiles);
      } else {
        // Mark as failed
        currentFiles = currentFiles.map(f => 
          f.id === file.id ? { ...f, uploading: false } : f
        );
        onFilesChange(currentFiles);
      }
    }

    return uploadedFiles;
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone / Add Button */}
      {selectedFiles.length < maxFiles && (
        <motion.div
          className={cn(
            "relative border-2 border-dashed rounded-xl p-4 transition-colors cursor-pointer",
            isDragging 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50 hover:bg-muted/30",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          whileHover={!disabled ? { scale: 1.01 } : undefined}
          whileTap={!disabled ? { scale: 0.99 } : undefined}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ImagePlus className="w-5 h-5 text-primary" />
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
                <Video className="w-5 h-5 text-secondary-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Kéo thả hoặc nhấn để thêm ảnh/video
            </p>
            <p className="text-xs text-muted-foreground/70">
              Tối đa {maxFiles} files • 100MB/file
            </p>
          </div>
        </motion.div>
      )}

      {/* Preview Grid */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-3 sm:grid-cols-4 gap-2"
          >
            {selectedFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
              >
                {file.type === 'image' ? (
                  <img
                    src={file.preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={file.preview}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}

                {/* Type badge */}
                {file.type === 'video' && (
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white flex items-center gap-1">
                    <Video className="w-3 h-3" />
                  </div>
                )}

                {/* Upload progress */}
                {file.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}

                {/* Uploaded indicator */}
                {file.uploadedUrl && (
                  <div className="absolute top-1 left-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(',')}
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}

export type { MediaFile };
