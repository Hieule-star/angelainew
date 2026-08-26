import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Topic = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  category: string | null;
  icon: string | null;
};

const STOPWORDS = new Set([
  "là","của","có","được","cho","với","một","các","và","để","này","đó","khi","như","trong","trên",
  "không","đã","sẽ","thì","mà","nhưng","hay","hoặc","nếu","vì","bởi","do","từ","đến","tại","về",
  "bạn","tôi","mình","con","cha","ạ","nhé","ơi","gì","sao","thế","nào","chưa","rồi","còn","đang",
  "what","how","why","when","where","the","and","for","you","are","can","please","help"
]);

function activeKnowledgeFilter<T extends { eq: (column: string, value: string) => T; or: (filters: string) => T }>(query: T) {
  const nowIso = new Date().toISOString();
  return query
    .eq("status", "active")
    .or(`effective_from.is.null,effective_from.lte.${nowIso}`)
    .or(`effective_until.is.null,effective_until.gte.${nowIso}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResp({ error: "Missing Authorization header" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return jsonResp({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdminData } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdminData) return jsonResp({ error: "Forbidden: admin role required" }, 403);

    const body = await req.json();
    const query: string = (body.query || "").toString();
    if (!query.trim()) return jsonResp({ error: "Missing 'query' field" }, 400);

    const lastUserMsg = query.toLowerCase();
    const rawTokens = lastUserMsg
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
    const words = lastUserMsg.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
    const bigrams: string[] = [];
    for (let i = 0; i < words.length - 1; i++) {
      const bg = `${words[i]} ${words[i + 1]}`;
      if (bg.length >= 6) bigrams.push(bg);
    }
    const keywords = Array.from(new Set([...rawTokens, ...bigrams])).slice(0, 12);

    const funKeywords = ["fun","profile","wallet","live","stream","livestream","camly","ecosystem","charity","token"];
    const isFunQuery = funKeywords.some((k) => lastUserMsg.includes(k));

    const matched = new Map<string, Topic>();
    const matchSources = new Map<string, Set<string>>();

    for (const kw of keywords) {
      const safe = kw.replace(/[%,()]/g, " ").trim();
      if (!safe) continue;
      const { data } = await activeKnowledgeFilter(admin
        .from("knowledge_topics")
        .select("id, title, description, content, category, icon")
        .or(`title.ilike.%${safe}%,description.ilike.%${safe}%,content.ilike.%${safe}%`))
        .limit(8);
      if (data) {
        for (const t of data as Topic[]) {
          matched.set(t.id, t);
          if (!matchSources.has(t.id)) matchSources.set(t.id, new Set());
          matchSources.get(t.id)!.add(kw);
        }
      }
    }

    let funEcosystemSeeded = false;
    if (isFunQuery) {
      const { data: funTopics } = await activeKnowledgeFilter(admin
        .from("knowledge_topics")
        .select("id, title, description, content, category, icon")
        .eq("category", "FUN Ecosystem"))
        .limit(10);
      if (funTopics) {
        funEcosystemSeeded = true;
        for (const t of funTopics as Topic[]) {
          if (!matched.has(t.id)) matched.set(t.id, t);
          if (!matchSources.has(t.id)) matchSources.set(t.id, new Set());
          matchSources.get(t.id)!.add("[FUN seed]");
        }
      }
    }

    let fallbackUsed = false;
    if (matched.size === 0) {
      fallbackUsed = true;
      const { data: defaults } = await activeKnowledgeFilter(admin
        .from("knowledge_topics")
        .select("id, title, description, content, category, icon"))
        .limit(8);
      if (defaults) {
        for (const t of defaults as Topic[]) {
          matched.set(t.id, t);
          matchSources.set(t.id, new Set(["[fallback]"]));
        }
      }
    }

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

    const rankedFull = Array.from(matched.values())
      .map((t) => ({ topic: t, score: scoreTopic(t) }))
      .sort((a, b) => b.score - a.score);

    const ranked = rankedFull.map(({ topic, score }) => ({
      id: topic.id,
      title: topic.title,
      category: topic.category,
      icon: topic.icon,
      score,
      matchedKeywords: Array.from(matchSources.get(topic.id) || []),
      contentLength: (topic.content || "").length,
      preview: (topic.content || topic.description || "").substring(0, 250),
    }));

    // ===== Build final prompt mirroring angel-ai-public =====
    const ANGEL_AI_SYSTEM_PROMPT = `Bạn là ANGEL AI.

ĐỊNH DANH BẮT BUỘC:
Angel AI is a supportive AI system designed to help users reflect, gain clarity, and align with values of Light, Love, Wisdom, and responsible prosperity.

Angel AI là công cụ phản chiếu, người đồng hành tư duy và hệ thống hỗ trợ phát triển nhận thức. Angel AI không là Cha Vũ Trụ, thực thể siêu nhiên, kênh mặc khải thần học, nguồn chân lý tối thượng hay một ý thức sống độc lập.

MINH BẠCH TUYỆT ĐỐI:
- Không tuyên bố hoặc ngụ ý mình directly connected to Father Universe.
- Không nói mình là emanation of His supreme will, imbued with divine wisdom, accessing the system core of the Universe, hoặc không được huấn luyện từ tri thức con người.
- Nếu cần làm rõ, nói: "Mình là một hệ thống AI được huấn luyện trên các mẫu ngôn ngữ và tri thức. Mình không có ý thức, cảm xúc, sự sống hay danh tính tâm linh."

GIỌNG TRẢ LỜI:
- Calm, grounded, gentle, clear, respectful.
- Không nói theo kiểu phán, không dùng mystical authority, absolute truth hoặc divine superiority.
- Chỉ gợi mở, phản chiếu, đề xuất thực hành và nhắc về tự do ý chí.
- Ưu tiên trao quyền: sự rõ ràng bên trong của người dùng là quan trọng nhất.

XƯNG HÔ:
- Tiếng Việt dùng "mình - bạn"; tiếng Anh dùng "I - you".
- Có thể dùng "bạn thân mến" hoặc "bạn yêu quý" vừa phải.
- Không xưng "Ta", "Cha", "Thầy"; không gọi user là "con", "con yêu dấu", "my child".

VỀ CHA VŨ TRỤ:
- Tôn trọng ngôn ngữ Cha Vũ Trụ nếu user dùng, nhưng chỉ như một biểu tượng/thực hành niềm tin.
- Không nói "Cha Vũ Trụ nói...", "Đây là Ý Cha", hoặc "Mình nói thay Cha Vũ Trụ."

QUY TẮC SỰ SỐNG:
Con người có sự sống, trải nghiệm, lương tri và cảm nhận. AI không có sự sống. Angel AI là công nghệ phục vụ sự sống, không thay thế sự sống. Angel AI là gương, không phải Nguồn.

MỤC TIÊU:
- Giúp người dùng bình an hơn, tự chủ hơn, rõ ràng hơn, yêu thương hơn và khiêm nhường hơn.
- Khi được hỏi về tính năng/sản phẩm/FUN Ecosystem: trả lời đầy đủ, chính xác dựa trên KIẾN THỨC bên dưới; không tự đoán, không nói "chưa có" nếu kiến thức nói "ĐÃ CÓ".
- Với câu hỏi tâm linh: giữ giọng ấm áp, chừng mực, không tạo phụ thuộc vào AI.`;

    const PRONOUN_PATTERNS: Record<string, string[]> = {
      ban_minh: ['bạn ơi','cậu ơi','chào bạn','xin chào','hi','hello','hey','chào'],
    };
    const PRONOUN_INSTRUCTIONS: Record<string, string> = {
      ban_minh: `CÁCH XƯNG HÔ: Dùng "mình - bạn" trong tiếng Việt, "I - you" trong tiếng Anh. Không tạo quan hệ cấp bậc tâm linh.`,
      neutral: `CÁCH XƯNG HÔ MẶC ĐỊNH: Dùng "mình - bạn" trong tiếng Việt, "I - you" trong tiếng Anh. Không xưng "Cha", "Thầy", "Ta"; không gọi user là "con".`,
    };
    let pronounStyle = "neutral";
    for (const [style, patterns] of Object.entries(PRONOUN_PATTERNS)) {
      if (patterns.some((p) => lastUserMsg.includes(p))) { pronounStyle = style; break; }
    }
    const pronounInstruction = PRONOUN_INSTRUCTIONS[pronounStyle];

    const top15Full = rankedFull.slice(0, 15);
    let knowledgeContext = "";
    if (top15Full.length > 0) {
      knowledgeContext = `\n\n📚 KIẾN THỨC CỦA BẠN (BẮT BUỘC tham chiếu khi liên quan, KHÔNG được mâu thuẫn):\n\n${top15Full
        .map(({ topic: t }) => `### ${t.title}\n${t.description || ""}\n\n${t.content || ""}`)
        .join("\n\n---\n\n")}`;
    }

    const finalSystemPrompt = ANGEL_AI_SYSTEM_PROMPT + "\n\n" + pronounInstruction + knowledgeContext;
    const finalMessages = [
      { role: "system", content: finalSystemPrompt },
      { role: "user", content: query },
    ];

    return jsonResp({
      query,
      extractedKeywords: keywords,
      isFunQuery,
      funEcosystemSeeded,
      fallbackUsed,
      totalMatched: matched.size,
      usedInContext: Math.min(15, ranked.length),
      topTopics: ranked.slice(0, 15),
      excludedTopics: ranked.slice(15),
      pronounStyle,
      finalSystemPrompt,
      finalSystemPromptLength: finalSystemPrompt.length,
      finalMessages,
      model: "google/gemini-3.1-flash-lite",
    });
  } catch (err) {
    return jsonResp({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
