import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type IncomingKnowledgeTopic = {
  title: string;
  description?: string;
  content: string;
  status?: string;
  version?: string;
  canonical_key?: string;
  source_title?: string;
  source_url?: string;
  provided_by?: string;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: hasRole } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });

    if (!hasRole) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, fileContent, fileName, category, topics } = await req.json();

    if (action === 'parse') {
      // Parse PDF content (text extracted from frontend)
      const parsedContent = parsePdfContent(fileContent, fileName);
      
      console.log(`Parsed file: ${fileName}, title: ${parsedContent.title}`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        parsed: parsedContent 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'save') {
      // Save topics to database
      const insertData = (topics as IncomingKnowledgeTopic[]).map((topic) => ({
        title: topic.title,
        description: topic.description || `Bài dẫn thiền: ${topic.title}`,
        content: topic.content,
        icon: '🧘',
        category: category || 'Bé Ly dẫn thiền',
        status: topic.status || 'review',
        version: topic.version || '1.0',
        canonical_key: topic.canonical_key || topic.title
          ?.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        source_title: topic.source_title || null,
        source_url: topic.source_url || null,
        provided_by: topic.provided_by || null,
      }));

      const { data, error } = await supabase
        .from('knowledge_topics')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Database insert error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Saved ${data.length} topics to database`);

      return new Response(JSON.stringify({ 
        success: true, 
        saved: data.length,
        topics: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-knowledge-file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parsePdfContent(content: string, fileName: string): { title: string; content: string; description: string } {
  // Clean up the content
  let cleanContent = content
    // Remove repeated headers like "Ms. Camly Dương dẫn thiền"
    .replace(/Ms\.?\s*Camly\s*Dương\s*dẫn\s*thiền/gi, '')
    // Remove page numbers like "1/14", "2/14", etc.
    .replace(/\d+\s*\/\s*\d+/g, '')
    // Remove multiple spaces
    .replace(/\s{3,}/g, '\n\n')
    // Trim
    .trim();

  // Extract title from filename or first line
  let title = fileName
    .replace(/\.pdf$/i, '')
    .replace(/_/g, ' ')
    .replace(/Bài_dẫn_thiền_/i, '')
    .trim();

  // Try to get title from first non-empty line if it's in caps
  const lines = cleanContent.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // If first line looks like a title (mostly uppercase or short)
    if (firstLine.length < 200 && (firstLine === firstLine.toUpperCase() || firstLine.length < 100)) {
      title = firstLine;
      // Remove title from content
      cleanContent = lines.slice(1).join('\n').trim();
    }
  }

  // Generate description from first few words
  const description = cleanContent.substring(0, 150).replace(/\n/g, ' ').trim() + '...';

  return {
    title,
    content: cleanContent,
    description,
  };
}
