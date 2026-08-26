import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Trash2, Save, Loader2, CheckCircle, Plus, FileUp, Keyboard } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { KNOWLEDGE_CATEGORIES } from '@/data/categories';
import { PdfUploader } from '@/components/knowledge/PdfUploader';

interface TopicEntry {
  id: string;
  title: string;
  description: string;
  content: string;
  status: 'pending' | 'saved';
}

export default function KnowledgeUpload() {
  const [topics, setTopics] = useState<TopicEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(KNOWLEDGE_CATEGORIES[3].name);
  const { toast } = useToast();
  
  const currentCategory = KNOWLEDGE_CATEGORIES.find(c => c.name === selectedCategory);

  const addNewTopic = () => {
    setTopics(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: '',
        description: '',
        content: '',
        status: 'pending',
      },
    ]);
  };

  const updateTopic = (id: string, field: keyof TopicEntry, value: string) => {
    setTopics(prev =>
      prev.map(t => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const removeTopic = (id: string) => {
    setTopics(prev => prev.filter(t => t.id !== id));
  };

  const handlePasteContent = async (id: string) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const topic = topics.find(t => t.id === id);
        if (topic && !topic.title) {
          const lines = text.split('\n').filter(l => l.trim());
          if (lines.length > 0) {
            const firstLine = lines[0].trim();
            if (firstLine.length < 200) {
              updateTopic(id, 'title', firstLine);
              updateTopic(id, 'content', lines.slice(1).join('\n').trim());
              updateTopic(id, 'description', lines.slice(1).join(' ').substring(0, 150) + '...');
              toast({ title: 'Đã paste và tự động tách tiêu đề!' });
              return;
            }
          }
        }
        updateTopic(id, 'content', text);
        toast({ title: 'Đã paste nội dung!' });
      }
    } catch (err) {
      toast({
        title: 'Không thể paste',
        description: 'Vui lòng paste thủ công bằng Ctrl+V',
        variant: 'destructive',
      });
    }
  };

  const saveTopicsToDb = async (topicsToSave: Array<{ title: string; description: string; content: string }>) => {
    setSaving(true);

    try {
      const response = await supabase.functions.invoke('process-knowledge-file', {
        body: {
          action: 'save',
          category: selectedCategory,
          topics: topicsToSave.map(t => ({
            title: t.title,
            description: t.description || `${currentCategory?.icon || '📚'} ${t.title}`,
            content: t.content,
          })),
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: 'Lưu thành công!',
        description: `Đã lưu ${response.data.saved} bài vào database.`,
      });

      return true;
    } catch (err: any) {
      console.error('Save error:', err);
      toast({
        title: 'Lỗi lưu dữ liệu',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveManualTopics = async () => {
    const pendingTopics = topics.filter(t => t.status === 'pending' && t.title && t.content);
    if (pendingTopics.length === 0) {
      toast({
        title: 'Không có bài để lưu',
        description: 'Vui lòng thêm tiêu đề và nội dung',
        variant: 'destructive',
      });
      return;
    }

    const success = await saveTopicsToDb(pendingTopics);
    
    if (success) {
      setTopics(prev =>
        prev.map(t => 
          pendingTopics.some(pt => pt.id === t.id) 
            ? { ...t, status: 'saved' } 
            : t
        )
      );
    }
  };

  const handlePdfSave = async (items: Array<{ title: string; description: string; content: string }>) => {
    await saveTopicsToDb(items);
  };

  const pendingCount = topics.filter(t => t.status === 'pending' && t.title && t.content).length;
  const savedCount = topics.filter(t => t.status === 'saved').length;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Upload Knowledge Base
            </h1>
            <p className="text-muted-foreground">
              Upload nội dung vào Knowledge Base
            </p>
          </div>

          {/* Category Selection */}
          <Card className="p-4">
            <label className="block text-sm font-medium mb-2">
              📂 Chọn Category để upload:
            </label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {KNOWLEDGE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.id} value={cat.name}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentCategory && (
              <p className="text-xs text-muted-foreground mt-2">
                {currentCategory.description}
              </p>
            )}
          </Card>

          {/* Upload Methods Tabs */}
          <Tabs defaultValue="pdf" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pdf" className="flex items-center gap-2">
                <FileUp className="w-4 h-4" />
                Upload PDF
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                Nhập thủ công
              </TabsTrigger>
            </TabsList>

            {/* PDF Upload Tab */}
            <TabsContent value="pdf" className="mt-4">
              <PdfUploader onSave={handlePdfSave} saving={saving} />
            </TabsContent>

            {/* Manual Input Tab */}
            <TabsContent value="manual" className="mt-4 space-y-4">
              {/* Instructions */}
              <Card className="p-4 bg-angel-gold/5 border-angel-gold/30">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-angel-gold" />
                  Hướng dẫn
                </h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Mở file PDF/nội dung cần upload</li>
                  <li>Copy toàn bộ nội dung (Ctrl+A, Ctrl+C)</li>
                  <li>Nhấn "Thêm bài mới" bên dưới</li>
                  <li>Nhấn nút "Paste từ clipboard" hoặc paste thủ công</li>
                  <li>Kiểm tra và chỉnh sửa tiêu đề, mô tả nếu cần</li>
                  <li>Nhấn "Lưu tất cả" khi hoàn tất</li>
                </ol>
              </Card>

              {/* Add New Button */}
              <div className="flex justify-center">
                <Button
                  onClick={addNewTopic}
                  className="bg-angel-gold hover:bg-angel-gold/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm bài mới
                </Button>
              </div>

              {/* Topics List */}
              {topics.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      Danh sách bài ({topics.length} bài, {savedCount} đã lưu)
                    </h3>
                    <Button
                      onClick={saveManualTopics}
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
                          <Save className="w-4 h-4 mr-2" />
                          Lưu tất cả ({pendingCount})
                        </>
                      )}
                    </Button>
                  </div>

                  {topics.map((topic, index) => (
                    <Card key={topic.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {topic.status === 'saved' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-angel-gold/20 text-angel-gold flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {topic.status === 'saved' ? 'Đã lưu' : 'Chưa lưu'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTopic(topic.id)}
                          disabled={topic.status === 'saved'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground">Tiêu đề *</label>
                          <Input
                            value={topic.title}
                            onChange={(e) => updateTopic(topic.id, 'title', e.target.value)}
                            disabled={topic.status === 'saved'}
                            placeholder="Nhập tiêu đề bài dẫn thiền"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Mô tả ngắn</label>
                          <Input
                            value={topic.description}
                            onChange={(e) => updateTopic(topic.id, 'description', e.target.value)}
                            disabled={topic.status === 'saved'}
                            placeholder="Mô tả ngắn về bài thiền (tự động tạo nếu bỏ trống)"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-muted-foreground">
                              Nội dung * ({topic.content.length} ký tự)
                            </label>
                            {topic.status !== 'saved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePasteContent(topic.id)}
                                className="h-6 text-xs"
                              >
                                <Upload className="w-3 h-3 mr-1" />
                                Paste từ clipboard
                              </Button>
                            )}
                          </div>
                          <Textarea
                            value={topic.content}
                            onChange={(e) => updateTopic(topic.id, 'content', e.target.value)}
                            disabled={topic.status === 'saved'}
                            rows={8}
                            className="text-xs"
                            placeholder="Paste nội dung bài dẫn thiền vào đây..."
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {topics.length === 0 && (
                <Card className="p-8 text-center border-dashed border-2">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Chưa có bài nào. Nhấn "Thêm bài mới" để bắt đầu.
                  </p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
