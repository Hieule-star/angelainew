import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function VideoGenerator() {
  const [prompt, setPrompt] = useState('');

  return (
    <div className="h-full flex flex-col">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <motion.div
                className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-angel-gold/20 to-purple-500/20 flex items-center justify-center mb-6 glow-divine relative"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Video className="w-12 h-12 text-angel-gold" />
                <div className="absolute -top-1 -right-1 bg-angel-gold rounded-full p-1">
                  <Lock className="w-4 h-4 text-white" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-semibold mb-2">
                Tạo <span className="text-gradient-divine">Video</span> với ANGEL AI
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Tính năng tạo video đang được phát triển. Sắp ra mắt trong phiên bản tiếp theo!
              </p>

              <div className="bg-gradient-to-br from-angel-gold/10 to-purple-500/10 rounded-2xl p-6 max-w-md mx-auto border border-angel-gold/20">
                <h3 className="font-semibold mb-3 text-angel-gold">🎬 Coming Soon</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-angel-gold" />
                    Tạo video từ văn bản mô tả
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-angel-gold" />
                    Chuyển hình ảnh thành video
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-angel-gold" />
                    Video thiền định & chữa lành
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-angel-gold" />
                    Xuất video HD/4K
                  </li>
                </ul>
              </div>

              <div className="mt-8 flex justify-center gap-3">
                <Button variant="outline" disabled className="gap-2">
                  <Video className="w-4 h-4" />
                  Runway ML
                </Button>
                <Button variant="outline" disabled className="gap-2">
                  <Video className="w-4 h-4" />
                  Luma AI
                </Button>
                <Button variant="outline" disabled className="gap-2">
                  <Video className="w-4 h-4" />
                  Pika Labs
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Input Area (Disabled) */}
      <div className="px-4 py-4 border-t border-angel-gold/10 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-3xl">
          <div className="flex gap-3 opacity-50">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tính năng tạo video sắp ra mắt..."
              className="min-h-[60px] max-h-[120px] resize-none bg-white/80 border-angel-gold/20"
              disabled
            />
            <Button disabled className="px-6 bg-gradient-to-r from-angel-gold to-purple-500">
              <Video className="w-5 h-5 mr-2" />
              Tạo video
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
