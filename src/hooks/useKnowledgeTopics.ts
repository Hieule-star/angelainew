import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { KnowledgeTopic } from '@/types';

export function useKnowledgeTopics() {
  return useQuery({
    queryKey: ['knowledge-topics'],
    queryFn: async (): Promise<KnowledgeTopic[]> => {
      const { data, error } = await supabase
        .from('knowledge_topics')
        .select('*')
        .eq('status' as never, 'active' as never)
        .or(`effective_from.is.null,effective_from.lte.${new Date().toISOString()}` as never)
        .or(`effective_until.is.null,effective_until.gte.${new Date().toISOString()}` as never)
        .order('category', { ascending: true })
        .order('title', { ascending: true });

      if (error) {
        throw error;
      }

      return data.map((topic) => ({
        id: topic.id,
        title: topic.title,
        description: topic.description || '',
        content: topic.content || '',
        icon: topic.icon || '✨',
        category: topic.category || 'General',
        created_at: topic.created_at || '',
      }));
    },
  });
}
