import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Trash2, Edit2, Check, X, 
  Loader2, AlertCircle, CheckCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseMutiplePdfFiles, ParsedPdfContent } from '@/lib/pdfParser';

interface PdfItem extends ParsedPdfContent {
  id: string;
  status: 'pending' | 'saved' | 'error';
  isEditing: boolean;
}

interface PdfUploaderProps {
  onSave: (items: Array<{ title: string; description: string; content: string }>) => Promise<void>;
  saving: boolean;
}

export function PdfUploader({ onSave, saving }: PdfUploaderProps) {
  const [items, setItems] = useState<PdfItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState({ current: 0, total: 0, fileName: '' });

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf');
    
    if (pdfFiles.length === 0) return;

    setParsing(true);
    setParseProgress({ current: 0, total: pdfFiles.length, fileName: '' });

    const parsed = await parseMutiplePdfFiles(pdfFiles, (current, total, fileName) => {
      setParseProgress({ current, total, fileName });
    });

    const newItems: PdfItem[] = parsed.map(p => ({
      ...p,
      id: crypto.randomUUID(),
      status: p.content ? 'pending' : 'error',
      isEditing: false,
    }));

    setItems(prev => [...prev, ...newItems]);
    setParsing(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const updateItem = (id: string, updates: Partial<PdfItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    const pendingItems = items.filter(i => i.status === 'pending' && i.content);
    if (pendingItems.length === 0) return;

    await onSave(pendingItems.map(i => ({
      title: i.title,
      description: i.description,
      content: i.content,
    })));

    // Mark as saved
    setItems(prev => prev.map(item => 
      pendingItems.some(p => p.id === item.id) 
        ? { ...item, status: 'saved' } 
        : item
    ));
  };

  const pendingCount = items.filter(i => i.status === 'pending' && i.content).length;
  const savedCount = items.filter(i => i.status === 'saved').length;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        animate={{
          scale: isDragOver ? 1.02 : 1,
          borderColor: isDragOver ? 'hsl(var(--angel-gold))' : 'hsl(var(--border))',
        }}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center 
          transition-colors cursor-pointer
          ${isDragOver ? 'bg-angel-gold/10' : 'bg-muted/30 hover:bg-muted/50'}
        `}
      >
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {parsing ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 mx-auto text-angel-gold animate-spin" />
            <div>
              <p className="font-medium">
                Đang đọc file {parseProgress.current}/{parseProgress.total}
              </p>
              <p className="text-sm text-muted-foreground truncate max-w-xs mx-auto">
                {parseProgress.fileName}
              </p>
            </div>
            <Progress 
              value={(parseProgress.current / parseProgress.total) * 100} 
              className="max-w-xs mx-auto"
            />
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium text-foreground">
              Kéo thả file PDF vào đây
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              hoặc click để chọn file (hỗ trợ nhiều file)
            </p>
          </>
        )}
      </motion.div>

      {/* Items List */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">
                  Danh sách ({items.length} file)
                </h3>
                {savedCount > 0 && (
                  <span className="text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full">
                    {savedCount} đã lưu
                  </span>
                )}
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || pendingCount === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Lưu tất cả ({pendingCount})
                  </>
                )}
              </Button>
            </div>

            {/* Items */}
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-3 pr-4">
                {items.map((item, index) => (
                  <PdfItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdate={(updates) => updateItem(item.id, updates)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PdfItemCardProps {
  item: PdfItem;
  index: number;
  onUpdate: (updates: Partial<PdfItem>) => void;
  onRemove: () => void;
}

function PdfItemCard({ item, index, onUpdate, onRemove }: PdfItemCardProps) {
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDescription, setEditDescription] = useState(item.description);
  const [showContent, setShowContent] = useState(false);

  const handleSaveEdit = () => {
    onUpdate({ 
      title: editTitle, 
      description: editDescription,
      isEditing: false 
    });
  };

  const handleCancelEdit = () => {
    setEditTitle(item.title);
    setEditDescription(item.description);
    onUpdate({ isEditing: false });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`p-4 ${item.status === 'error' ? 'border-destructive/50' : ''}`}>
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="flex-shrink-0 mt-1">
            {item.status === 'saved' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : item.status === 'error' ? (
              <AlertCircle className="w-5 h-5 text-destructive" />
            ) : (
              <FileText className="w-5 h-5 text-angel-gold" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {item.isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Tiêu đề"
                  className="font-medium"
                />
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Mô tả"
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Check className="w-3 h-3 mr-1" /> Lưu
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    <X className="w-3 h-3 mr-1" /> Hủy
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h4 className="font-medium truncate">{item.title}</h4>
                <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{item.pageCount} trang</span>
                  <span>•</span>
                  <span>{item.content.length.toLocaleString()} ký tự</span>
                  <span>•</span>
                  <button 
                    onClick={() => setShowContent(!showContent)}
                    className="text-angel-gold hover:underline"
                  >
                    {showContent ? 'Ẩn nội dung' : 'Xem nội dung'}
                  </button>
                </div>
              </>
            )}

            {/* Content Preview */}
            <AnimatePresence>
              {showContent && !item.isEditing && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <Textarea
                    value={item.content}
                    readOnly
                    rows={6}
                    className="mt-2 text-xs bg-muted/30"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          {item.status !== 'saved' && !item.isEditing && (
            <div className="flex-shrink-0 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate({ isEditing: true })}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
