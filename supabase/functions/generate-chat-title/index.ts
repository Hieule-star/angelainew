import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callChatCompletion } from "../_shared/aiProvider.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ title: 'Cuộc trò chuyện mới' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!LOVABLE_API_KEY && !GEMINI_API_KEY) {
      console.error('No AI provider key configured');
      return new Response(
        JSON.stringify({ title: 'Cuộc trò chuyện mới' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Take first 1-2 user messages for title generation
    const userMessages = messages
      .filter((m: { role: string }) => m.role === 'user')
      .slice(0, 2)
      .map((m: { message: string }) => m.message)
      .join(' ');

    const systemPrompt = `Bạn là AI tạo tiêu đề ngắn gọn cho cuộc hội thoại.

Quy tắc TUYỆT ĐỐI:
- Độ dài: 3-8 từ
- Đơn giản, dễ hiểu, phản ánh ý định chính
- KHÔNG dùng emoji
- Ngôn ngữ: Giống ngôn ngữ người dùng (Việt/Anh)
- CHỈ trả về tiêu đề, KHÔNG giải thích, KHÔNG thêm gì khác

Ví dụ đúng:
- "Hướng dẫn thiền giảm stress"
- "Hỏi về Camly Coin"
- "Ý nghĩa 8 thần chú"
- "How to meditate daily"`;

    const { response, provider } = await callChatCompletion({
      model: 'google/gemini-3.1-flash-lite',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Tạo tiêu đề cho cuộc hội thoại này:\n\n"${userMessages}"` }
      ],
      max_completion_tokens: 50,
    });
    console.log(`[generate-chat-title] provider=${provider} status=${response.status}`);

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      return new Response(
        JSON.stringify({ title: 'Cuộc trò chuyện mới' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let title = data.choices?.[0]?.message?.content?.trim() || 'Cuộc trò chuyện mới';
    
    // Clean up title - remove quotes, limit length
    title = title.replace(/^["']|["']$/g, '').trim();
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }

    console.log('Generated title:', title);

    return new Response(
      JSON.stringify({ title }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating title:', error);
    return new Response(
      JSON.stringify({ title: 'Cuộc trò chuyện mới' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
