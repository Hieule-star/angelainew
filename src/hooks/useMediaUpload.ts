import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/stores/userStore';

interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

interface UploadResult {
  success: boolean;
  publicUrl?: string;
  assetId?: string;
  error?: string;
}

interface UseMediaUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useMediaUpload(options: UseMediaUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percent: 0 });
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const user = useUserStore((state) => state.user);

  // Step 1: Get presigned URL from edge function
  const getPresignedUrl = async (
    file: File,
    duration?: number
  ): Promise<{ uploadUrl: string; assetId: string; objectKey: string; publicUrl: string | null }> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/media-create-upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        duration: duration,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get upload URL');
    }

    return response.json();
  };

  // Step 2: Upload file directly to R2 with progress tracking
  const uploadToR2 = (
    uploadUrl: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progressData: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percent: Math.round((event.loaded / event.total) * 100),
          };
          setProgress(progressData);
          onProgress?.(progressData);
          options.onProgress?.(progressData);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  // Step 3: Confirm upload with edge function
  const confirmUpload = async (assetId: string): Promise<{ success: boolean; publicUrl: string }> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/media-confirm-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ assetId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to confirm upload');
    }

    return response.json();
  };

  // Main upload function
  const uploadFile = useCallback(async (
    file: File,
    duration?: number
  ): Promise<UploadResult> => {
    if (!user) {
      const errorMsg = 'Please login to upload files';
      setError(errorMsg);
      options.onError?.(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: file.size, percent: 0 });

    try {
      console.log('[useMediaUpload] Starting upload for:', file.name);

      // Step 1: Get presigned URL
      console.log('[useMediaUpload] Getting presigned URL...');
      const { uploadUrl, assetId, publicUrl } = await getPresignedUrl(file, duration);
      console.log('[useMediaUpload] Got presigned URL, assetId:', assetId);

      // Step 2: Upload to R2
      console.log('[useMediaUpload] Uploading to R2...');
      await uploadToR2(uploadUrl, file);
      console.log('[useMediaUpload] Upload complete');

      // Step 3: Confirm upload
      console.log('[useMediaUpload] Confirming upload...');
      const confirmResult = await confirmUpload(assetId);
      console.log('[useMediaUpload] Upload confirmed:', confirmResult.publicUrl);

      const result: UploadResult = {
        success: true,
        publicUrl: confirmResult.publicUrl,
        assetId,
      };

      options.onSuccess?.(result);
      
      toast({
        title: '☁️ Upload thành công!',
        description: 'File đã được lưu trên Cloudflare R2 CDN',
      });

      return result;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      console.error('[useMediaUpload] Error:', errorMsg);
      setError(errorMsg);
      options.onError?.(errorMsg);
      
      toast({
        title: 'Upload tạm dừng',
        description: 'Vui lòng kiểm tra kết nối và thử lại.',
        variant: 'destructive',
      });

      return { success: false, error: errorMsg };

    } finally {
      setIsUploading(false);
    }
  }, [user, toast, options]);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress({ loaded: 0, total: 0, percent: 0 });
    setError(null);
  }, []);

  return {
    uploadFile,
    isUploading,
    progress,
    error,
    reset,
  };
}
