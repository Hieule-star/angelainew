import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, Loader2, ImageIcon, Trash2, FolderOpen, Plus, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/userStore';
import angelLogo from '@/assets/angel-logo.png';

const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/angel-image`;
const R2_UPLOAD_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cloudflare-r2-upload`;

interface GeneratedImage {
  id?: string;
  url: string;
  prompt: string;
  description?: string;
  timestamp: string;
}

interface SavedImage {
  id: string;
  prompt: string;
  image_url: string;
  created_at: string;
}

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [activeTab, setActiveTab] = useState('create');
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const { toast } = useToast();
  const user = useUserStore((state) => state.user);

  // Fetch saved images when gallery tab is active
  useEffect(() => {
    if (activeTab === 'gallery' && user) {
      fetchSavedImages();
    }
  }, [activeTab, user]);

  const fetchSavedImages = async () => {
    if (!user) return;
    
    setIsLoadingGallery(true);
    try {
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedImages(data || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const saveImageToStorage = async (imageUrl: string, promptText: string) => {
    if (!user) {
      toast({
        title: 'Cần đăng nhập',
        description: 'Vui lòng đăng nhập để lưu hình ảnh vào gallery.',
        variant: 'destructive',
      });
      return null;
    }

    setIsSaving(true);
    try {
      // Convert base64 to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Create FormData for R2 upload
      const formData = new FormData();
      formData.append('file', blob, `${Date.now()}.png`);
      formData.append('type', 'image');

      // Upload to Cloudflare R2 via edge function
      const uploadResponse = await fetch(R2_UPLOAD_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload to R2');
      }

      const uploadResult = await uploadResponse.json();
      console.log('R2 upload result:', uploadResult);

      // Save metadata to generated_images table (keep existing table for backward compatibility)
      const { data: imageData, error: dbError } = await supabase
        .from('generated_images')
        .insert({
          user_id: user.id,
          prompt: promptText,
          image_url: uploadResult.url,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Also save to video_metadata for unified media management
      await supabase
        .from('video_metadata')
        .insert({
          user_id: user.id,
          title: promptText.slice(0, 100),
          description: promptText,
          r2_url: uploadResult.url,
          file_type: 'image',
          file_size_bytes: uploadResult.fileSize,
          mime_type: uploadResult.fileType,
        });

      toast({
        title: '☁️ Đã lưu vào R2 CDN!',
        description: 'Hình ảnh đã được lưu trữ trên Cloudflare R2',
      });

      return imageData;
    } catch (error) {
      console.error('Error saving image to R2:', error);
      toast({
        title: 'Lưu hình ảnh tạm dừng',
        description: error instanceof Error ? error.message : 'Vui lòng thử lại để lưu hình ảnh.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteImage = async (imageId: string, imageUrl: string) => {
    if (!user) return;

    try {
      // Check if it's an old Supabase Storage URL or new R2 URL
      const isSupabaseUrl = imageUrl.includes('/generated-images/');
      
      if (isSupabaseUrl) {
        // Legacy: Delete from Supabase storage
        const urlParts = imageUrl.split('/generated-images/');
        const filePath = urlParts[1];
        if (filePath) {
          await supabase.storage.from('generated-images').remove([filePath]);
        }
      }
      // Note: R2 deletion would require a separate edge function
      // For now, we just remove from database (R2 files can be cleaned up separately)

      // Delete from generated_images table
      const { error } = await supabase
        .from('generated_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      // Also delete from video_metadata if exists
      await supabase
        .from('video_metadata')
        .delete()
        .eq('r2_url', imageUrl)
        .eq('user_id', user.id);

      setSavedImages(prev => prev.filter(img => img.id !== imageId));
      toast({
        title: '🗑️ Đã xóa hình ảnh',
        description: 'Hình ảnh đã được xóa khỏi gallery',
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Thao tác tạm dừng',
        description: 'Vui lòng thử lại để hoàn tất.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Cần hoàn thiện mô tả',
        description: 'Hãy mô tả hình ảnh bạn muốn tạo để bắt đầu.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(IMAGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();

      if (data.imageUrl) {
        const newImage: GeneratedImage = {
          url: data.imageUrl,
          prompt: prompt.trim(),
          description: data.description,
          timestamp: new Date().toISOString(),
        };
        setGeneratedImages((prev) => [newImage, ...prev]);
        setPrompt('');
        toast({
          title: '✨ Hình ảnh đã được tạo!',
          description: 'Năng lượng ánh sáng đã hiện hình',
        });
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: 'Tạo hình ảnh cần xử lý',
        description: error instanceof Error ? error.message : 'Vui lòng thử lại sau giây lát.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string, promptText: string) => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `angel-ai-${promptText.slice(0, 20).replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: 'Tải xuống tạm dừng',
        description: 'Vui lòng thử lại để tải hình ảnh.',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Sub-tabs for Create/Gallery */}
        <div className="px-4 pt-4 pb-2 bg-background/50">
          <TabsList className="w-full max-w-xs mx-auto">
            <TabsTrigger value="create" className="flex-1 gap-2">
              <Plus className="w-4 h-4" />
              Tạo mới
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex-1 gap-2">
              <FolderOpen className="w-4 h-4" />
              Gallery {savedImages.length > 0 && `(${savedImages.length})`}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Create Tab */}
        <TabsContent value="create" className="flex-1 flex flex-col mt-0">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="container mx-auto max-w-3xl space-y-6">
              {generatedImages.length === 0 && !isGenerating ? (
                <div className="text-center py-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <motion.div
                      className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-angel-gold/20 to-angel-pink/20 flex items-center justify-center mb-6 glow-divine"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <ImageIcon className="w-12 h-12 text-angel-gold" />
                    </motion.div>
                    <h2 className="text-2xl font-semibold mb-2">
                      Tạo <span className="text-gradient-divine">Hình Ảnh</span> với ANGEL AI
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Mô tả hình ảnh bạn muốn tạo và để năng lượng ánh sáng Cha Vũ Trụ hiện thực hóa
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">
                    {[
                      'Thiên thần ánh sáng vàng',
                      'Cầu vồng thiêng liêng',
                      'Hoa sen tỏa sáng',
                      'Vũ trụ yêu thương',
                      'Năng lượng chữa lành',
                      'Ánh bình minh tâm linh',
                    ].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => setPrompt(suggestion)}
                        className="text-xs hover:bg-angel-gold/10 hover:border-angel-gold/30"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {generatedImages.map((image, index) => (
                    <motion.div
                      key={image.timestamp}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-card rounded-2xl shadow-divine overflow-hidden"
                    >
                      <div className="p-4 border-b border-angel-gold/10">
                        <div className="flex items-center gap-2">
                          <img src={angelLogo} alt="ANGEL AI" className="w-6 h-6 rounded-full" />
                          <span className="text-sm font-medium text-angel-gold">ANGEL AI ✨</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">"{image.prompt}"</p>
                      </div>
                      <div className="relative">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full max-h-[500px] object-contain bg-gradient-to-br from-angel-gold/5 to-angel-pink/5"
                        />
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          {user && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => saveImageToStorage(image.url, image.prompt)}
                              disabled={isSaving}
                              className="bg-card/90 hover:bg-card shadow-lg"
                            >
                          {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Cloud className="w-4 h-4 mr-1" />
                                  Lưu R2
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownload(image.url, image.prompt)}
                            className="bg-card/90 hover:bg-card shadow-lg"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Tải xuống
                          </Button>
                        </div>
                      </div>
                      {image.description && (
                        <div className="p-4 bg-angel-gold/5">
                          <p className="text-sm text-muted-foreground">{image.description}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl shadow-divine p-8 text-center"
                >
                  <motion.div
                    className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-angel-gold/30 to-angel-pink/30 flex items-center justify-center mb-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-10 h-10 text-angel-gold" />
                  </motion.div>
                  <p className="text-lg font-medium text-angel-gold">Đang tạo hình ảnh...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Năng lượng ánh sáng đang hiện hình ✨
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="px-4 py-4 border-t border-border bg-background/50 backdrop-blur-sm">
            <div className="container mx-auto max-w-3xl">
              <div className="flex gap-3">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Mô tả hình ảnh bạn muốn tạo... (VD: Thiên thần ánh sáng vàng đang bay trên bầu trời)"
                  className="min-h-[60px] max-h-[120px] resize-none bg-card border-angel-gold/20 focus:border-angel-gold/50"
                  disabled={isGenerating}
                />
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="px-6 bg-gradient-to-r from-angel-gold to-angel-pink hover:opacity-90"
                >
                  {isGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Tạo ảnh
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="flex-1 overflow-y-auto px-4 py-6 mt-0">
          <div className="container mx-auto max-w-4xl">
            {!user ? (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-medium mb-2">Đăng nhập để xem Gallery</h3>
                <p className="text-muted-foreground">
                  Đăng nhập để lưu và xem lại các hình ảnh đã tạo
                </p>
              </div>
            ) : isLoadingGallery ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-angel-gold" />
                <p className="mt-4 text-muted-foreground">Đang tải gallery...</p>
              </div>
            ) : savedImages.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-medium mb-2">Gallery trống</h3>
                <p className="text-muted-foreground mb-4">
                  Tạo hình ảnh và lưu vào đây để xem lại sau
                </p>
                <Button onClick={() => setActiveTab('create')} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo hình ảnh mới
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedImages.map((image) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card rounded-xl overflow-hidden shadow-divine group"
                  >
                    <div className="relative aspect-square">
                      <img
                        src={image.image_url}
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(image.image_url, image.prompt)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteImage(image.id, image.image_url)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">{image.prompt}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {new Date(image.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
