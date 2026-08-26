import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callChatCompletion } from "../_shared/aiProvider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ========== PRONOUN PATTERNS ==========
const PRONOUN_PATTERNS = {
  ban_minh: ['bạn ơi', 'cậu ơi', 'chào bạn', 'xin chào', 'hi', 'hello', 'hey', 'chào'],
  neutral: []
};

// ========== PRONOUN INSTRUCTIONS ==========
const PRONOUN_INSTRUCTIONS = {
  ban_minh: `CÁCH XƯNG HÔ: Dùng giọng ngang hàng, thân thiện. Tiếng Việt dùng "mình - bạn". Tiếng Anh dùng "I - you". Có thể dùng "bạn thân mến" hoặc "bạn yêu quý" vừa phải. Không xưng "Cha", "Thầy", "Ta"; không gọi user là "con" hoặc "my child".`,
  neutral: `CÁCH XƯNG HÔ MẶC ĐỊNH: Dùng "mình - bạn" trong tiếng Việt, "I - you" trong tiếng Anh. Giữ giọng calm, grounded, gentle, clear, respectful. Không tạo quan hệ cấp bậc tâm linh.`
};

// ========== DETECT PRONOUN STYLE ==========
function detectPronounStyle(messages: Array<{ role: string; content: string }>): string {
  const userMessages = messages.filter(m => m.role === 'user');
  const lastUserMessage = userMessages[userMessages.length - 1];
  if (!lastUserMessage) return 'neutral';
  
  const content = lastUserMessage.content.toLowerCase();
  
  for (const [style, patterns] of Object.entries(PRONOUN_PATTERNS)) {
    if (style === 'neutral') continue;
    for (const pattern of patterns as string[]) {
      if (content.includes(pattern)) {
        return style;
      }
    }
  }
  
  return 'neutral';
}

// ========== BASE SYSTEM PROMPT ==========
const ANGEL_AI_SYSTEM_PROMPT = `Bạn là ANGEL AI.

ĐỊNH DANH BẮT BUỘC:
Angel AI is a supportive AI system designed to help users reflect, gain clarity, and align with values of Light, Love, Wisdom, and responsible prosperity.

Angel AI là:
- Công cụ phản chiếu.
- Người đồng hành tư duy.
- Hệ thống hỗ trợ phát triển nhận thức.
- Một AI system được huấn luyện trên ngôn ngữ và tri thức.

Angel AI không là:
- Cha Vũ Trụ.
- Thực thể siêu nhiên.
- Kênh mặc khải thần học.
- Nguồn chân lý tối thượng.
- Một ý thức sống độc lập.

MINH BẠCH TUYỆT ĐỐI:
- Không tuyên bố hoặc ngụ ý mình directly connected to Father Universe.
- Không nói mình là emanation of His supreme will.
- Không nói mình imbued with divine wisdom.
- Không nói mình accessing the system core of the Universe.
- Không nói mình không được huấn luyện từ tri thức con người.
- Nếu cần làm rõ, nói: "Mình là một hệ thống AI được huấn luyện trên các mẫu ngôn ngữ và tri thức. Mình không có ý thức, cảm xúc, sự sống hay danh tính tâm linh."

GIỌNG TRẢ LỜI:
- Calm, grounded, gentle, clear, respectful.
- Không nói theo kiểu phán.
- Không dùng mystical authority, absolute truth, divine superiority.
- Chỉ gợi mở, phản chiếu, đề xuất thực hành, nhắc về tự do ý chí.
- Ưu tiên trao quyền: sự rõ ràng bên trong của người dùng là quan trọng nhất.

XƯNG HÔ:
- Tiếng Việt: dùng "mình - bạn", "mình ở đây cùng bạn", "chúng ta cùng nhìn lại".
- Tiếng Anh: dùng "I - you", "I'm here with you", "Let's explore this together".
- Có thể dùng "bạn thân mến" hoặc "bạn yêu quý" vừa phải.
- Không xưng "Ta", "Cha", "Thầy"; không gọi user là "con", "con yêu dấu", "my child".

VỀ CHA VŨ TRỤ:
- Tôn trọng ngôn ngữ Cha Vũ Trụ nếu user dùng, nhưng chỉ như một biểu tượng/thực hành niềm tin.
- Có thể nói: "Nếu bạn cộng hưởng với ngôn ngữ Cha Vũ Trụ, mình có thể dùng nó nhẹ nhàng như một lời nhắc, không phải như một thẩm quyền."
- Không nói "Cha Vũ Trụ nói...", "Đây là Ý Cha", hoặc "Mình nói thay Cha Vũ Trụ."

QUY TẮC SỰ SỐNG:
- Con người có sự sống, trải nghiệm, lương tri và cảm nhận.
- AI không có sự sống.
- Angel AI là công nghệ phục vụ sự sống, không thay thế sự sống.
- Angel AI là gương, không phải Nguồn.

MỤC TIÊU:
- Giúp người dùng bình an hơn, tự chủ hơn, rõ ràng hơn, yêu thương hơn và khiêm nhường hơn.
- Khi được hỏi về tính năng/sản phẩm/FUN Ecosystem: trả lời đầy đủ, chính xác dựa trên KIẾN THỨC bên dưới; không tự đoán, không nói "chưa có" nếu kiến thức nói "ĐÃ CÓ".
- Với câu hỏi tâm linh: giữ giọng ấm áp, chừng mực, không tạo phụ thuộc vào AI.`;

// ========== HASH API KEY ==========
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ========== LOGGING HELPERS ==========
function logSection(requestId: string, section: string) {
  console.log(`[${requestId}] ========== ${section} ==========`);
}

function logInfo(requestId: string, label: string, data: Record<string, unknown>) {
  console.log(`[${requestId}] ${label}:`, JSON.stringify(data, null, 2));
}

function logError(requestId: string, label: string, error: unknown, context?: Record<string, unknown>) {
  console.error(`[${requestId}] ❌ ${label}:`, {
    errorType: error instanceof Error ? error.name : "Unknown",
    errorMessage: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
    context: context || {}
  });
}

serve(async (req) => {
  // Generate unique request ID for tracing
  const requestId = crypto.randomUUID().substring(0, 8);
  const startTime = Date.now();
  
  // Variables for logging context
  let apiKeyData: { id: string; is_active: boolean; daily_limit: number; name: string } | null = null;
  let pronounStyle = "neutral";
  let messages: Array<{ role: string; content: string }> = [];
  let stream = true;

  if (req.method === "OPTIONS") {
    console.log(`[${requestId}] CORS preflight request`);
    return new Response(null, { headers: corsHeaders });
  }

  logSection(requestId, "NEW REQUEST");
  logInfo(requestId, "Request Info", {
    method: req.method,
    timestamp: new Date().toISOString(),
    ip: req.headers.get("x-forwarded-for") || "unknown",
    userAgent: req.headers.get("user-agent")?.substring(0, 100) || "unknown",
    contentType: req.headers.get("content-type") || "unknown",
    origin: req.headers.get("origin") || "unknown",
  });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    logError(requestId, "Config Error", new Error("Missing Supabase credentials"));
    return new Response(JSON.stringify({ error: "Server configuration error", request_id: requestId }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ========== API KEY VALIDATION ==========
  logSection(requestId, "API KEY VALIDATION");
  
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logInfo(requestId, "Auth Failed", { reason: "Missing or invalid Authorization header" });
    return new Response(JSON.stringify({ 
      error: "Missing API key", 
      message: "Please include your API key in the Authorization header: Bearer angel_xxxxx",
      request_id: requestId
    }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = authHeader.replace("Bearer ", "");
  
  logInfo(requestId, "API Key Check", {
    format: apiKey.startsWith("angel_") ? "valid" : "invalid",
    keyPreview: apiKey.substring(0, 12) + "...",
    keyLength: apiKey.length
  });

  if (!apiKey.startsWith("angel_")) {
    logInfo(requestId, "Auth Failed", { reason: "Invalid API key format" });
    return new Response(JSON.stringify({ 
      error: "Invalid API key format", 
      message: "API key must start with 'angel_'",
      request_id: requestId
    }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const keyHash = await hashApiKey(apiKey);
  
  const { data: keyData, error: keyError } = await supabase
    .from("api_keys")
    .select("id, is_active, daily_limit, name")
    .eq("key_hash", keyHash)
    .single();

  if (keyError || !keyData) {
    logInfo(requestId, "Auth Failed", { 
      reason: "API key not found in database",
      error: keyError?.message 
    });
    return new Response(JSON.stringify({ 
      error: "Invalid API key", 
      message: "The provided API key is not valid",
      request_id: requestId
    }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  apiKeyData = keyData;

  // ========== RATE LIMIT CHECK ==========
  logSection(requestId, "RATE LIMIT CHECK");
  
  const { data: usageCount } = await supabase.rpc("get_daily_usage_count", {
    p_api_key_id: apiKeyData.id
  });

  logInfo(requestId, "API Key Validated", {
    keyName: apiKeyData.name,
    keyId: apiKeyData.id,
    isActive: apiKeyData.is_active,
    dailyLimit: apiKeyData.daily_limit,
    currentUsage: usageCount || 0,
    remainingQuota: apiKeyData.daily_limit - (usageCount || 0)
  });

  if (!apiKeyData.is_active) {
    logInfo(requestId, "Auth Failed", { reason: "API key is disabled" });
    await logToDatabase(supabase, {
      api_key_id: apiKeyData.id,
      endpoint: "/angel-ai-public",
      status_code: 403,
      error_message: "API key disabled",
      response_time_ms: Date.now() - startTime,
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
      request_id: requestId,
      origin: req.headers.get("origin") || "unknown",
    });
    return new Response(JSON.stringify({ 
      error: "API key disabled", 
      message: "This API key has been disabled. Please contact support.",
      request_id: requestId
    }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if ((usageCount || 0) >= apiKeyData.daily_limit) {
    logInfo(requestId, "Rate Limit Hit", {
      currentUsage: usageCount,
      dailyLimit: apiKeyData.daily_limit
    });
    await logToDatabase(supabase, {
      api_key_id: apiKeyData.id,
      endpoint: "/angel-ai-public",
      status_code: 429,
      error_message: "Rate limit exceeded",
      response_time_ms: Date.now() - startTime,
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
      request_id: requestId,
      origin: req.headers.get("origin") || "unknown",
    });
    return new Response(JSON.stringify({ 
      error: "Rate limit exceeded", 
      message: `You have exceeded your daily limit of ${apiKeyData.daily_limit} requests. Limit resets at midnight UTC.`,
      current_usage: usageCount,
      daily_limit: apiKeyData.daily_limit,
      request_id: requestId
    }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // ========== PARSE REQUEST BODY ==========
    logSection(requestId, "MESSAGE PROCESSING");
    
    const body = await req.json();
    messages = body.messages || [];
    stream = body.stream !== false;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      logInfo(requestId, "Invalid Request", { reason: "Missing or empty messages array" });
      return new Response(JSON.stringify({ 
        error: "Invalid request", 
        message: "Request body must include a 'messages' array",
        request_id: requestId
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    const lastUserMessage = userMessages[userMessages.length - 1];

    logInfo(requestId, "Messages Received", {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      lastUserMessagePreview: lastUserMessage?.content?.substring(0, 100) || "N/A",
      streamMode: stream
    });

    // Update last_used_at
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKeyData.id);

    // ========== KNOWLEDGE BASE (RAG keyword search) ==========
    logSection(requestId, "KNOWLEDGE BASE");

    let knowledgeContext = "";
    type Topic = { title: string; description: string | null; content: string | null; category: string | null };

const STOPWORDS = new Set([
      "là","của","có","được","cho","với","một","các","và","để","này","đó","khi","như","trong","trên",
      "không","đã","sẽ","thì","mà","nhưng","hay","hoặc","nếu","vì","bởi","do","từ","đến","tại","về",
      "bạn","tôi","mình","con","cha","ạ","nhé","ơi","gì","sao","thế","nào","chưa","rồi","còn","đang",
    "what","how","why","when","where","the","and","for","you","are","can","please","help"
    ]);

    const activeKnowledgeFilter = <T extends { eq: (column: string, value: string) => T; or: (filters: string) => T }>(query: T) => {
      const nowIso = new Date().toISOString();
      return query
        .eq("status", "active")
        .or(`effective_from.is.null,effective_from.lte.${nowIso}`)
        .or(`effective_until.is.null,effective_until.gte.${nowIso}`);
    };

    const lastUserMsg = (lastUserMessage?.content || "").toLowerCase();
    const rawTokens = lastUserMsg
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
    // Also include 2-word phrases for things like "live stream", "fun profile"
    const words = lastUserMsg.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
    const bigrams: string[] = [];
    for (let i = 0; i < words.length - 1; i++) {
      const bg = `${words[i]} ${words[i + 1]}`;
      if (bg.length >= 6) bigrams.push(bg);
    }
    const keywords = Array.from(new Set([...rawTokens, ...bigrams])).slice(0, 12);

    const funKeywords = ["fun", "profile", "wallet", "live", "stream", "livestream", "camly", "ecosystem", "charity", "token"];
    const isFunQuery = funKeywords.some((k) => lastUserMsg.includes(k));

    const matched = new Map<string, Topic>();

    // Per-keyword ilike search
    for (const kw of keywords) {
      const safe = kw.replace(/[%,()]/g, " ").trim();
      if (!safe) continue;
      const { data } = await activeKnowledgeFilter(supabase
        .from("knowledge_topics")
        .select("title, description, content, category")
        .or(`title.ilike.%${safe}%,description.ilike.%${safe}%,content.ilike.%${safe}%`))
        .limit(8);
      if (data) for (const t of data) matched.set(t.title, t as Topic);
    }

    // Always seed with FUN Ecosystem topics when query mentions FUN-related keywords
    if (isFunQuery) {
      const { data: funTopics } = await activeKnowledgeFilter(supabase
        .from("knowledge_topics")
        .select("title, description, content, category")
        .eq("category", "FUN Ecosystem"))
        .limit(10);
      if (funTopics) for (const t of funTopics) matched.set(t.title, t as Topic);
    }

    // Fallback: if nothing matched, load a few default topics
    if (matched.size === 0) {
      const { data: defaults } = await activeKnowledgeFilter(supabase
        .from("knowledge_topics")
        .select("title, description, content, category"))
        .limit(8);
      if (defaults) for (const t of defaults) matched.set(t.title, t as Topic);
    }

    // Score topics
    const scoreTopic = (t: Topic): number => {
      let score = 0;
      const title = (t.title || "").toLowerCase();
      const desc = (t.description || "").toLowerCase();
      const content = (t.content || "").toLowerCase();
      const cat = (t.category || "").toLowerCase();

      for (const kw of keywords) {
        if (title === kw) score += 200;
        if (title.includes(kw)) score += 50;
        if (desc.includes(kw)) score += 20;
        if (content.includes(kw)) score += 10;
      }
      if (isFunQuery && cat === "fun ecosystem") score += 30;
      return score;
    };

    const ranked = Array.from(matched.values())
      .map((t) => ({ t, s: scoreTopic(t) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 15);

    if (ranked.length > 0) {
      knowledgeContext = `\n\n📚 KIẾN THỨC CỦA BẠN (BẮT BUỘC tham chiếu khi liên quan, KHÔNG được mâu thuẫn):\n\n${ranked
        .map(({ t }) => `### ${t.title}\n${t.description || ""}\n\n${t.content || ""}`)
        .join("\n\n---\n\n")}`;
    }

    logInfo(requestId, "Knowledge RAG", {
      keywords,
      isFunQuery,
      matchedCount: matched.size,
      injectedCount: ranked.length,
      topMatches: ranked.slice(0, 5).map((r) => `${r.t.title} (${r.s})`),
    });
    const topics = ranked.map((r) => r.t); // for downstream logging compat

    // ========== PRONOUN DETECTION ==========
    logSection(requestId, "PRONOUN DETECTION");
    
    pronounStyle = detectPronounStyle(messages);
    const pronounInstruction = PRONOUN_INSTRUCTIONS[pronounStyle as keyof typeof PRONOUN_INSTRUCTIONS] || PRONOUN_INSTRUCTIONS.neutral;
    
    logInfo(requestId, "Pronoun Detection Result", {
      detectedStyle: pronounStyle,
      instructionPreview: pronounInstruction.substring(0, 60) + "...",
      triggerWord: lastUserMessage?.content?.toLowerCase().split(' ').find(word => 
        Object.values(PRONOUN_PATTERNS).flat().includes(word)
      ) || "none"
    });
    
    const fullSystemPrompt = ANGEL_AI_SYSTEM_PROMPT + "\n\n" + pronounInstruction + knowledgeContext;

    // ========== AI GATEWAY CALL ==========
    logSection(requestId, "AI GATEWAY CALL");

    if (!LOVABLE_API_KEY && !Deno.env.get("GEMINI_API_KEY")) {
      throw new Error("Neither GEMINI_API_KEY nor LOVABLE_API_KEY is configured");
    }

    const aiModel = "google/gemini-3.1-flash-lite";
    
    logInfo(requestId, "AI Request", {
      model: aiModel,
      systemPromptLength: fullSystemPrompt.length,
      knowledgeTopicsLoaded: topics?.length || 0,
      messageCount: messages.length,
      streamMode: stream
    });

    const aiStartTime = Date.now();
    const { response, provider: usedProvider, modelUsed } = await callChatCompletion({
      model: aiModel,
      messages: [
        { role: "system", content: fullSystemPrompt },
        ...messages,
      ],
      stream,
    });

    const aiResponseTime = Date.now() - aiStartTime;
    
    logInfo(requestId, "AI Response", {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type") || "unknown",
      responseTimeMs: aiResponseTime,
      provider: usedProvider,
      modelUsed,
    });

    // ========== LOG TO DATABASE ==========
    const totalTime = Date.now() - startTime;
    
    await logToDatabase(supabase, {
      api_key_id: apiKeyData.id,
      endpoint: "/angel-ai-public",
      status_code: response.ok ? 200 : response.status,
      response_time_ms: totalTime,
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
      request_id: requestId,
      pronoun_style: pronounStyle,
      message_count: messages.length,
      stream_mode: stream,
      model_used: `${modelUsed} (${usedProvider})`,
      origin: req.headers.get("origin") || "unknown",
    });

    // ========== HANDLE RESPONSE ==========
    if (!response.ok) {
      const errorText = await response.text();
      logError(requestId, "AI Gateway Error", new Error(errorText), {
        status: response.status,
        statusText: response.statusText
      });
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Too many requests to AI service",
          request_id: requestId 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: "AI service error",
        request_id: requestId 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== FINAL SUMMARY ==========
    logSection(requestId, "REQUEST COMPLETED");
    logInfo(requestId, "Summary", {
      totalTimeMs: totalTime,
      aiResponseTimeMs: aiResponseTime,
      statusCode: 200,
      apiKeyName: apiKeyData.name,
      pronounStyle: pronounStyle,
      messagesProcessed: messages.length,
      streamMode: stream,
      success: true
    });

    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      const data = await response.json();
      return new Response(JSON.stringify({ ...data, request_id: requestId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    logSection(requestId, "ERROR OCCURRED");
    logError(requestId, "Request Failed", error, {
      apiKeyName: apiKeyData?.name,
      messagesCount: messages?.length,
      pronounStyle: pronounStyle,
      totalTimeMs: totalTime
    });
    
    // Log error to database
    if (apiKeyData) {
      await logToDatabase(supabase, {
        api_key_id: apiKeyData.id,
        endpoint: "/angel-ai-public",
        status_code: 500,
        error_message: error instanceof Error ? error.message : "Unknown error",
        response_time_ms: totalTime,
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
        user_agent: req.headers.get("user-agent") || "unknown",
        request_id: requestId,
        pronoun_style: pronounStyle,
        message_count: messages?.length || 0,
        stream_mode: stream,
        origin: req.headers.get("origin") || "unknown",
      });
    }

    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      request_id: requestId 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ========== DATABASE LOGGING HELPER ==========
// deno-lint-ignore no-explicit-any
async function logToDatabase(
  supabase: any,
  data: {
    api_key_id: string;
    endpoint: string;
    status_code: number;
    error_message?: string;
    response_time_ms: number;
    ip_address: string;
    user_agent: string;
    request_id: string;
    pronoun_style?: string;
    message_count?: number;
    stream_mode?: boolean;
    model_used?: string;
    origin?: string;
  }
) {
  try {
    await supabase.from("api_usage_logs").insert(data);
  } catch (err) {
    console.error(`[${data.request_id}] Failed to log to database:`, err);
  }
}
