import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TransformType = "thumbnail" | "preview" | "poster" | "resize";

interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "jpeg" | "webp" | "gif" | "mp4";
}

interface TransformResult {
  url: string;
  cached: boolean;
  fallback?: boolean;
}

interface UseVideoTransformReturn {
  getTransform: (videoId: string, type: TransformType, options?: TransformOptions) => Promise<TransformResult | null>;
  getThumbnail: (videoId: string, options?: TransformOptions) => Promise<string | null>;
  getPreview: (videoId: string, options?: TransformOptions) => Promise<string | null>;
  getPoster: (videoId: string, options?: TransformOptions) => Promise<string | null>;
  getResized: (videoId: string, quality: "720p" | "480p" | "360p") => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

const QUALITY_PRESETS = {
  "720p": { width: 1280, height: 720, quality: 80 },
  "480p": { width: 854, height: 480, quality: 75 },
  "360p": { width: 640, height: 360, quality: 70 },
};

export function useVideoTransform(): UseVideoTransformReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTransform = useCallback(async (
    videoId: string,
    type: TransformType,
    options: TransformOptions = {}
  ): Promise<TransformResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("media-transform", {
        body: {
          videoId,
          type,
          ...options,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || "Transform failed");
      }

      return {
        url: response.data.url,
        cached: response.data.cached || false,
        fallback: response.data.fallback,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transform failed";
      setError(message);
      console.error("[useVideoTransform] Error:", message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getThumbnail = useCallback(async (
    videoId: string,
    options: TransformOptions = {}
  ): Promise<string | null> => {
    const result = await getTransform(videoId, "thumbnail", {
      width: 300,
      height: 200,
      format: "webp",
      ...options,
    });
    return result?.url || null;
  }, [getTransform]);

  const getPreview = useCallback(async (
    videoId: string,
    options: TransformOptions = {}
  ): Promise<string | null> => {
    const result = await getTransform(videoId, "preview", {
      width: 320,
      height: 180,
      format: "gif",
      ...options,
    });
    return result?.url || null;
  }, [getTransform]);

  const getPoster = useCallback(async (
    videoId: string,
    options: TransformOptions = {}
  ): Promise<string | null> => {
    const result = await getTransform(videoId, "poster", {
      width: 1920,
      height: 1080,
      quality: 90,
      format: "jpeg",
      ...options,
    });
    return result?.url || null;
  }, [getTransform]);

  const getResized = useCallback(async (
    videoId: string,
    quality: "720p" | "480p" | "360p"
  ): Promise<string | null> => {
    const preset = QUALITY_PRESETS[quality];
    const result = await getTransform(videoId, "resize", {
      ...preset,
      format: "mp4",
    });
    return result?.url || null;
  }, [getTransform]);

  return {
    getTransform,
    getThumbnail,
    getPreview,
    getPoster,
    getResized,
    isLoading,
    error,
  };
}
