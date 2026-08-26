import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Zap, Brain, Server, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SelectionMode, AIModel, ProviderPreference } from '@/types';

interface ModeOption {
  id: SelectionMode;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface ProviderOption {
  id: ProviderPreference;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'auto',
    name: 'Auto',
    description: 'Thông minh & tự động',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-angel-gold',
  },
  {
    id: 'fast',
    name: 'Nhanh',
    description: 'Phản hồi tức thì',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-blue-500',
  },
  {
    id: 'deep',
    name: 'Sâu',
    description: 'Phân tích chi tiết',
    icon: <Brain className="w-4 h-4" />,
    color: 'text-purple-500',
  },
];

const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    id: 'auto',
    name: 'Auto',
    description: 'Tự động fallback khi cần',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-angel-gold',
  },
  {
    id: 'lovable',
    name: 'Lovable AI',
    description: 'Google Gemini & OpenAI GPT',
    icon: <Cloud className="w-4 h-4" />,
    color: 'text-pink-500',
  },
  {
    id: 'openai',
    name: 'OpenAI Direct',
    description: 'GPT-4o trực tiếp',
    icon: <Server className="w-4 h-4" />,
    color: 'text-green-500',
  },
];

interface ModelSelectorProps {
  selectedMode: SelectionMode;
  onModeChange: (mode: SelectionMode) => void;
  selectedProvider: ProviderPreference;
  onProviderChange: (provider: ProviderPreference) => void;
}

export function ModelSelector({ 
  selectedMode, 
  onModeChange,
  selectedProvider,
  onProviderChange 
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentMode = MODE_OPTIONS.find((m) => m.id === selectedMode) || MODE_OPTIONS[0];
  const currentProvider = PROVIDER_OPTIONS.find((p) => p.id === selectedProvider) || PROVIDER_OPTIONS[0];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 bg-white/60 hover:bg-white/80 border border-angel-gold/20 rounded-full"
      >
        <span className={currentMode.color}>{currentMode.icon}</span>
        <span className="font-medium hidden xs:inline">{currentMode.name}</span>
        <span className="hidden xs:inline text-muted-foreground">•</span>
        <span className={`hidden xs:inline ${currentProvider.color}`}>{currentProvider.icon}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-56 sm:w-64 max-w-[calc(100vw-24px)] bg-white/95 backdrop-blur-xl rounded-xl border border-angel-gold/20 shadow-divine overflow-hidden z-50"
            >
              {/* Mode Selection */}
              <div className="p-2 border-b border-angel-gold/10">
                <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Chế độ xử lý</p>
                {MODE_OPTIONS.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      onModeChange(mode.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedMode === mode.id
                        ? 'bg-angel-gold/10'
                        : 'hover:bg-angel-gold/5'
                    }`}
                  >
                    <span className={mode.color}>{mode.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{mode.name}</p>
                      <p className="text-xs text-muted-foreground">{mode.description}</p>
                    </div>
                    {selectedMode === mode.id && (
                      <div className="w-2 h-2 rounded-full bg-angel-gold" />
                    )}
                  </button>
                ))}
              </div>

              {/* Provider Selection */}
              <div className="p-2">
                <p className="text-xs text-muted-foreground px-2 py-1 font-medium">AI Provider</p>
                {PROVIDER_OPTIONS.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => {
                      onProviderChange(provider.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedProvider === provider.id
                        ? 'bg-angel-gold/10'
                        : 'hover:bg-angel-gold/5'
                    }`}
                  >
                    <span className={provider.color}>{provider.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{provider.name}</p>
                      <p className="text-xs text-muted-foreground">{provider.description}</p>
                    </div>
                    {selectedProvider === provider.id && (
                      <div className="w-2 h-2 rounded-full bg-angel-gold" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to get model display info for ChatBubble
export function getModelDisplayInfo(modelId: AIModel) {
  const MODEL_INFO: Record<AIModel, { icon: React.ReactNode; name: string; color: string }> = {
    'google/gemini-3.1-flash-lite': { icon: <Zap className="w-3 h-3" />, name: 'Flash Lite 3.1', color: 'text-cyan-500' },
    'google/gemini-2.5-flash-lite': { icon: <Zap className="w-3 h-3" />, name: 'Flash Lite', color: 'text-cyan-500' },
    'google/gemini-2.5-flash': { icon: <Zap className="w-3 h-3" />, name: 'Flash', color: 'text-blue-500' },
    'google/gemini-2.5-pro': { icon: <Sparkles className="w-3 h-3" />, name: 'Pro', color: 'text-purple-500' },
    'openai/gpt-5-mini': { icon: <Brain className="w-3 h-3" />, name: 'GPT-5 Mini', color: 'text-green-500' },
    'openai/gpt-5': { icon: <Brain className="w-3 h-3" />, name: 'GPT-5', color: 'text-amber-500' },
  };
  return MODEL_INFO[modelId] || MODEL_INFO['google/gemini-3.1-flash-lite'];
}

export function getModeDisplayInfo(mode: SelectionMode) {
  return MODE_OPTIONS.find((m) => m.id === mode) || MODE_OPTIONS[0];
}

export function getProviderDisplayInfo(provider: ProviderPreference) {
  return PROVIDER_OPTIONS.find((p) => p.id === provider) || PROVIDER_OPTIONS[0];
}
