import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Archive,
  BookOpen,
  CheckCircle2,
  Eye,
  Filter,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { KNOWLEDGE_CATEGORIES } from '@/data/categories';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeTopic {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  icon: string | null;
  category: string | null;
  audio_url: string | null;
  created_at: string | null;
  canonical_key?: string | null;
  version?: string | null;
  status?: string | null;
  effective_from?: string | null;
  effective_until?: string | null;
  source_title?: string | null;
  source_url?: string | null;
  provided_by?: string | null;
  approved_at?: string | null;
  deprecated_at?: string | null;
}

interface KnowledgeFeedback {
  id: string;
  feedback_type: string;
  review_status: string;
  message: string | null;
  created_at: string;
  knowledge_topics?: { title: string | null } | null;
}

type SupabaseError = { message: string };
type TopicMutation = {
  select: (columns: string) => {
    single: () => Promise<{ data: KnowledgeTopic; error: SupabaseError | null }>;
  };
};
type TopicTable = {
  insert: (payload: Record<string, unknown>) => TopicMutation;
  update: (payload: Record<string, unknown>) => {
    eq: (column: string, value: string) => TopicMutation;
  };
};
type FeedbackTable = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      order: (column: string, options: { ascending: boolean }) => {
        limit: (count: number) => Promise<{ data: KnowledgeFeedback[] | null; error: SupabaseError | null }>;
      };
    };
  };
};

function knowledgeTopicsTable() {
  return supabase.from('knowledge_topics') as unknown as TopicTable;
}

function knowledgeFeedbackTable() {
  return supabase.from('knowledge_feedback') as unknown as FeedbackTable;
}

type TopicForm = {
  title: string;
  description: string;
  content: string;
  icon: string;
  category: string;
  audio_url: string;
  canonical_key: string;
  version: string;
  status: string;
  effective_from: string;
  effective_until: string;
  source_title: string;
  source_url: string;
  provided_by: string;
};

const emptyForm: TopicForm = {
  title: '',
  description: '',
  content: '',
  icon: '📚',
  category: 'FUN Ecosystem',
  audio_url: '',
  canonical_key: '',
  version: '1.0',
  status: 'draft',
  effective_from: '',
  effective_until: '',
  source_title: '',
  source_url: '',
  provided_by: '',
};

const STATUS_OPTIONS = ['draft', 'review', 'approved', 'active', 'deprecated', 'archived'];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  review: 'Review',
  approved: 'Approved',
  active: 'Active',
  deprecated: 'Deprecated',
  archived: 'Archived',
};

function toDateTimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function makeCanonicalKey(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toForm(topic: KnowledgeTopic): TopicForm {
  return {
    title: topic.title,
    description: topic.description || '',
    content: topic.content || '',
    icon: topic.icon || '📚',
    category: topic.category || '',
    audio_url: topic.audio_url || '',
    canonical_key: topic.canonical_key || '',
    version: topic.version || '1.0',
    status: topic.status || 'draft',
    effective_from: toDateTimeLocal(topic.effective_from),
    effective_until: toDateTimeLocal(topic.effective_until),
    source_title: topic.source_title || '',
    source_url: topic.source_url || '',
    provided_by: topic.provided_by || '',
  };
}

export default function KnowledgeManager() {
  const [topics, setTopics] = useState<KnowledgeTopic[]>([]);
  const [feedback, setFeedback] = useState<KnowledgeFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<TopicForm>(emptyForm);
  const [editTopic, setEditTopic] = useState<KnowledgeTopic | null>(null);
  const [editForm, setEditForm] = useState<TopicForm>(emptyForm);
  const [viewTopic, setViewTopic] = useState<KnowledgeTopic | null>(null);
  const [deleteTopic, setDeleteTopic] = useState<KnowledgeTopic | null>(null);
  const { toast } = useToast();

  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTopics(data || []);

      const { data: feedbackData, error: feedbackError } = await knowledgeFeedbackTable()
        .select('id, feedback_type, review_status, message, created_at, knowledge_topics(title)')
        .eq('review_status', 'open')
        .order('created_at', { ascending: false })
        .limit(20);

      if (feedbackError) throw feedbackError;
      setFeedback(feedbackData || []);
    } catch (err) {
      console.error('Error fetching knowledge topics:', err);
      toast({
        title: 'Không tải được Knowledge Base',
        description: 'Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchTopics();
  }, [fetchTopics]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...KNOWLEDGE_CATEGORIES.map((category) => category.name),
        ...topics.map((topic) => topic.category).filter(Boolean),
      ])
    ).sort((a, b) => a.localeCompare(b)) as string[];
  }, [topics]);

  const categoryGroups = useMemo(() => {
    return categoryOptions
      .map((category) => {
        const categoryTopics = topics.filter((topic) => topic.category === category);
        return {
          category,
          count: categoryTopics.length,
          chars: categoryTopics.reduce((sum, topic) => sum + (topic.content?.length || 0), 0),
        };
      })
      .filter((group) => group.count > 0);
  }, [categoryOptions, topics]);

  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase();
    return topics.filter((topic) => {
      const matchesSearch =
        !query ||
        topic.title.toLowerCase().includes(query) ||
        (topic.description || '').toLowerCase().includes(query) ||
        (topic.content || '').toLowerCase().includes(query);
      const matchesCategory = categoryFilter === 'all' || topic.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || (topic.status || 'active') === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, search, statusFilter, topics]);

  async function createTopic() {
    const payload = normalizeForm(createForm);
    if (!payload) return;

    setSaving(true);
    try {
      const { data, error } = await knowledgeTopicsTable()
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;

      setTopics((prev) => [data, ...prev]);
      setCreateForm(emptyForm);
      setCreateOpen(false);
      toast({ title: 'Đã tạo topic mới cho RAG!' });
    } catch (err: unknown) {
      toast({
        title: 'Không tạo được topic',
        description: getErrorMessage(err, 'Vui lòng kiểm tra quyền admin và thử lại.'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function updateTopic() {
    if (!editTopic) return;
    const payload = normalizeForm(editForm);
    if (!payload) return;

    setSaving(true);
    try {
      const { data, error } = await knowledgeTopicsTable()
        .update(payload)
        .eq('id', editTopic.id)
        .select('*')
        .single();

      if (error) throw error;

      setTopics((prev) => prev.map((topic) => (topic.id === editTopic.id ? data : topic)));
      setEditTopic(null);
      setEditForm(emptyForm);
      toast({ title: 'Đã cập nhật topic!' });
    } catch (err: unknown) {
      toast({
        title: 'Không lưu được topic',
        description: getErrorMessage(err, 'Vui lòng kiểm tra quyền admin và thử lại.'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeTopic() {
    if (!deleteTopic) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('knowledge_topics')
        .delete()
        .eq('id', deleteTopic.id);

      if (error) throw error;

      setTopics((prev) => prev.filter((topic) => topic.id !== deleteTopic.id));
      setDeleteTopic(null);
      toast({ title: 'Đã xóa topic khỏi Knowledge Base.' });
    } catch (err: unknown) {
      toast({
        title: 'Không xóa được topic',
        description: getErrorMessage(err, 'Vui lòng kiểm tra quyền admin và thử lại.'),
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  }

  async function updateTopicStatus(topic: KnowledgeTopic, status: string) {
    setSaving(true);
    try {
      const payload: Record<string, string | null> = { status };
      if (status === 'active') payload.approved_at = new Date().toISOString();
      if (status === 'deprecated') payload.deprecated_at = new Date().toISOString();

      const { data, error } = await knowledgeTopicsTable()
        .update(payload)
        .eq('id', topic.id)
        .select('*')
        .single();

      if (error) throw error;

      setTopics((prev) => prev.map((item) => (item.id === topic.id ? data : item)));
      toast({ title: `ÄÃ£ chuyá»ƒn topic sang ${STATUS_LABELS[status] || status}.` });
    } catch (err: unknown) {
      toast({
        title: 'KhÃ´ng cáº­p nháº­t Ä‘Æ°á»£c tráº¡ng thÃ¡i',
        description: getErrorMessage(err, 'Vui lÃ²ng thá»­ láº¡i.'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function normalizeForm(form: TopicForm) {
    const title = form.title.trim();
    const category = form.category.trim();
    const content = form.content.trim();

    if (!title || !category || !content) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Tiêu đề, category và nội dung là bắt buộc.',
        variant: 'destructive',
      });
      return null;
    }

    return {
      title,
      category,
      content,
      description: form.description.trim() || null,
      icon: form.icon.trim() || '📚',
      audio_url: form.audio_url.trim() || null,
      canonical_key: form.canonical_key.trim() || makeCanonicalKey(title),
      version: form.version.trim() || '1.0',
      status: form.status || 'draft',
      effective_from: fromDateTimeLocal(form.effective_from),
      effective_until: fromDateTimeLocal(form.effective_until),
      source_title: form.source_title.trim() || null,
      source_url: form.source_url.trim() || null,
      provided_by: form.provided_by.trim() || null,
    };
  }

  function openEdit(topic: KnowledgeTopic) {
    setEditTopic(topic);
    setEditForm(toForm(topic));
  }

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              Knowledge Base Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Tạo, sửa, xóa topic và nhóm category để Angel AI RAG truy xuất đúng hơn.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Tạo topic mới
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <CategoryCard
            active={categoryFilter === 'all'}
            title="Tất cả category"
            subtitle={`${topics.length} topics`}
            onClick={() => setCategoryFilter('all')}
          />
          {categoryGroups.map((group) => (
            <CategoryCard
              key={group.category}
              active={categoryFilter === group.category}
              title={group.category}
              subtitle={`${group.count} topics · ${group.chars.toLocaleString()} ký tự`}
              count={group.count}
              onClick={() => setCategoryFilter(group.category)}
            />
          ))}
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tiêu đề, mô tả hoặc nội dung..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-[240px]">
                  <SelectValue placeholder="Tất cả category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả category</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {feedback.length > 0 && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Knowledge feedback cần xử lý</h2>
                <p className="text-sm text-muted-foreground">
                  {feedback.length} feedback open mới nhất từ user/admin.
                </p>
              </div>
              <Badge variant="outline">{feedback.length}</Badge>
            </div>
            <div className="grid gap-2">
              {feedback.map((item) => (
                <div key={item.id} className="rounded-lg border border-border/50 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{item.feedback_type}</Badge>
                    <span className="font-medium">
                      {item.knowledge_topics?.title || 'Knowledge topic'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                  {item.message && <p className="mt-1 text-muted-foreground">{item.message}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Độ dài</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTopics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Không tìm thấy topic phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTopics.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium line-clamp-1">
                            {topic.icon ? `${topic.icon} ` : ''}
                            {topic.title}
                          </p>
                          {topic.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {topic.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {topic.category ? (
                          <Badge variant="secondary">{topic.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={(topic.status || 'active') === 'active' ? 'default' : 'outline'}>
                          {STATUS_LABELS[topic.status || 'active'] || topic.status || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {topic.version || '1.0'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(topic.content?.length || 0).toLocaleString()} ký tự
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {topic.created_at ? format(new Date(topic.created_at), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setViewTopic(topic)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(topic.status || 'active') === 'draft' && (
                            <Button variant="ghost" size="icon" onClick={() => updateTopicStatus(topic, 'review')} title="Send to review">
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          {(topic.status || 'active') === 'review' && (
                            <Button variant="ghost" size="icon" onClick={() => updateTopicStatus(topic, 'approved')} title="Approve">
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                          {['approved', 'draft', 'review'].includes(topic.status || 'active') && (
                            <Button variant="ghost" size="icon" onClick={() => updateTopicStatus(topic, 'active')} title="Activate">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          {(topic.status || 'active') === 'active' && (
                            <Button variant="ghost" size="icon" onClick={() => updateTopicStatus(topic, 'deprecated')} title="Deprecate">
                              <XCircle className="w-4 h-4 text-orange-600" />
                            </Button>
                          )}
                          {(topic.status || 'active') !== 'archived' && (
                            <Button variant="ghost" size="icon" onClick={() => updateTopicStatus(topic, 'archived')} title="Archive">
                              <Archive className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(topic)}
                            className="text-amber-600 hover:text-amber-700"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTopic(topic)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        <p className="text-sm text-muted-foreground">
          Hiển thị {filteredTopics.length} / {topics.length} topics
        </p>

        <TopicFormDialog
          open={createOpen}
          title="Tạo topic mới"
          description="Topic mới sẽ được đưa vào knowledge_topics để RAG truy xuất."
          form={createForm}
          categoryOptions={categoryOptions}
          saving={saving}
          submitLabel="Tạo topic"
          onOpenChange={setCreateOpen}
          onChange={setCreateForm}
          onSubmit={createTopic}
        />

        <TopicFormDialog
          open={!!editTopic}
          title="Sửa topic"
          description="Cập nhật nội dung, category và keyword để RAG match chính xác hơn."
          form={editForm}
          categoryOptions={categoryOptions}
          saving={saving}
          submitLabel="Lưu thay đổi"
          onOpenChange={(open) => {
            if (!open) setEditTopic(null);
          }}
          onChange={setEditForm}
          onSubmit={updateTopic}
        />

        <Dialog open={!!viewTopic} onOpenChange={() => setViewTopic(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewTopic?.title}</DialogTitle>
              <DialogDescription>
                {viewTopic?.category && (
                  <Badge variant="secondary" className="mt-2">
                    {viewTopic.category}
                  </Badge>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {viewTopic?.description && (
                <section>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Mô tả</h4>
                  <p className="text-sm">{viewTopic.description}</p>
                </section>
              )}
              <section>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Nội dung</h4>
                <div className="bg-muted/50 rounded-lg p-4 max-h-[440px] overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-sans">
                    {viewTopic?.content || 'Không có nội dung'}
                  </pre>
                </div>
              </section>
              {viewTopic?.audio_url && (
                <section>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Audio URL</h4>
                  <p className="text-sm break-all">{viewTopic.audio_url}</p>
                </section>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteTopic} onOpenChange={() => setDeleteTopic(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xóa topic?</DialogTitle>
              <DialogDescription>
                Topic "{deleteTopic?.title}" sẽ bị xóa khỏi Knowledge Base và RAG sẽ không còn dùng topic này.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTopic(null)}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={removeTopic} disabled={deleting}>
                {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Xóa topic
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function CategoryCard({
  active,
  title,
  subtitle,
  count,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <Card
      className={`p-4 cursor-pointer transition-colors ${
        active ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium line-clamp-1">{title}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {typeof count === 'number' && <Badge variant="secondary">{count}</Badge>}
      </div>
    </Card>
  );
}

function TopicFormDialog({
  open,
  title,
  description,
  form,
  categoryOptions,
  saving,
  submitLabel,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  form: TopicForm;
  categoryOptions: string[];
  saving: boolean;
  submitLabel: string;
  onOpenChange: (open: boolean) => void;
  onChange: (form: TopicForm) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`${title}-title`}>Tiêu đề *</Label>
            <Input
              id={`${title}-title`}
              value={form.title}
              onChange={(event) => onChange({ ...form, title: event.target.value })}
              placeholder="VD: FUN Profile - Cảnh báo an toàn ví"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${title}-description`}>Mô tả / keyword cho RAG</Label>
            <Textarea
              id={`${title}-description`}
              value={form.description}
              onChange={(event) => onChange({ ...form, description: event.target.value })}
              placeholder="Tóm tắt ngắn và thêm keyword đồng nghĩa để RAG dễ match..."
              rows={3}
            />
          </div>

          <div className="grid gap-2 md:grid-cols-[120px_1fr]">
            <div className="grid gap-2">
              <Label htmlFor={`${title}-icon`}>Icon</Label>
              <Input
                id={`${title}-icon`}
                value={form.icon}
                onChange={(event) => onChange({ ...form, icon: event.target.value })}
                placeholder="📚"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${title}-category`}>Category / nhóm RAG *</Label>
              <Input
                id={`${title}-category`}
                value={form.category}
                onChange={(event) => onChange({ ...form, category: event.target.value })}
                list={`${title}-categories`}
                placeholder="FUN Ecosystem"
              />
              <datalist id={`${title}-categories`}>
                {categoryOptions.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((category) => (
              <Button
                key={category}
                type="button"
                variant={form.category === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange({ ...form, category })}
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor={`${title}-status`}>Lifecycle status</Label>
              <Select value={form.status} onValueChange={(status) => onChange({ ...form, status })}>
                <SelectTrigger id={`${title}-status`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${title}-version`}>Version</Label>
              <Input
                id={`${title}-version`}
                value={form.version}
                onChange={(event) => onChange({ ...form, version: event.target.value })}
                placeholder="1.0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${title}-canonical`}>Canonical key</Label>
              <Input
                id={`${title}-canonical`}
                value={form.canonical_key}
                onChange={(event) => onChange({ ...form, canonical_key: event.target.value })}
                placeholder="auto-from-title"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${title}-effective-from`}>Effective from</Label>
              <Input
                id={`${title}-effective-from`}
                type="datetime-local"
                value={form.effective_from}
                onChange={(event) => onChange({ ...form, effective_from: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${title}-effective-until`}>Effective until</Label>
              <Input
                id={`${title}-effective-until`}
                type="datetime-local"
                value={form.effective_until}
                onChange={(event) => onChange({ ...form, effective_until: event.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor={`${title}-source-title`}>Source title</Label>
              <Input
                id={`${title}-source-title`}
                value={form.source_title}
                onChange={(event) => onChange({ ...form, source_title: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${title}-source-url`}>Source URL</Label>
              <Input
                id={`${title}-source-url`}
                value={form.source_url}
                onChange={(event) => onChange({ ...form, source_url: event.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${title}-provided-by`}>Provided by</Label>
              <Input
                id={`${title}-provided-by`}
                value={form.provided_by}
                onChange={(event) => onChange({ ...form, provided_by: event.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${title}-content`}>Nội dung *</Label>
            <Textarea
              id={`${title}-content`}
              value={form.content}
              onChange={(event) => onChange({ ...form, content: event.target.value })}
              placeholder="Nội dung markdown đầy đủ của topic..."
              rows={14}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {form.content.length.toLocaleString()} ký tự. Nội dung này sẽ được đưa vào prompt khi RAG chọn topic.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${title}-audio`}>Audio URL (tùy chọn)</Label>
            <Input
              id={`${title}-audio`}
              value={form.audio_url}
              onChange={(event) => onChange({ ...form, audio_url: event.target.value })}
              placeholder="https://.../audio.mp3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={onSubmit} disabled={saving || !form.title.trim() || !form.category.trim() || !form.content.trim()}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
