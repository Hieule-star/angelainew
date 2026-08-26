// RAG text normalization & scoring helpers (extracted for testability).
// Used by angel-ai/index.ts.

export interface KnowledgeTopic {
  id: string;
  title: string;
  description?: string;
  content?: string;
  category?: string;
  audio_url?: string | null;
}

export function removeDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

export const VN_NUMBER_WORDS: Record<string, string> = {
  'mot': '1', 'hai': '2', 'ba': '3', 'bon': '4', 'nam': '5',
  'sau': '6', 'bay': '7', 'tam': '8', 'chin': '9', 'muoi': '10',
  'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
  'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
};

export const SYNONYM_MAP: Record<string, string[]> = {
  'freedom': ['tự do', 'tu do'],
  'liberation': ['tự do', 'giải phóng'],
  'giai phong': ['tự do', 'giải phóng'],
  'tu tai': ['tự do', 'tự tại'],
  'layer': ['tầng', 'tang'],
  'layers': ['tầng', 'tang'],
  'level': ['tầng', 'cấp', 'bậc'],
  'absolute': ['tuyệt đối', 'tuyet doi'],
  'meditation': ['thiền', 'thien', 'dẫn thiền'],
  'meditate': ['thiền', 'thien'],
  'repent': ['sám hối', 'sam hoi'],
  'gratitude': ['biết ơn', 'biet on'],
  'kingdom': ['kingdom', 'tuyên ngôn'],
};

export const RAG_STOPWORDS = new Set([
  'cho','tôi','toi','bài','bai','của','cua','là','la','và','va','con','muốn','muon',
  'xin','ơi','oi','một','mot','các','cac','này','nay','đó','được','duoc','ạ',
  'với','voi','về','ve','cần','can','hay','thì','thi','mình','minh','bạn','ban','nhé','nhe',
  'gì','gi','như','nhu','để','de','khi','nào','nao','rồi','roi','đi','di','ở',
  'có','co','không','khong','sẽ','se','đã','da','vào','vao','ra','lên','len','xuống','xuong',
  'the','of','to','for','in','is','it','me','my','please','can','you','what','how','show','give','want','about','an',
]);

export function normalizeQuery(text: string): { raw: string; bare: string; expanded: string[] } {
  const raw = text.toLowerCase();
  const bare = removeDiacritics(raw);
  const expanded = new Set<string>();
  const bareTokens = bare.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  for (const tok of bareTokens) {
    if (VN_NUMBER_WORDS[tok]) expanded.add(VN_NUMBER_WORDS[tok]);
    if (SYNONYM_MAP[tok]) SYNONYM_MAP[tok].forEach(s => expanded.add(s));
  }
  for (let i = 0; i < bareTokens.length - 1; i++) {
    const bg = `${bareTokens[i]} ${bareTokens[i+1]}`;
    if (SYNONYM_MAP[bg]) SYNONYM_MAP[bg].forEach(s => expanded.add(s));
  }
  return { raw, bare, expanded: Array.from(expanded) };
}

export function generateRagPhrases(text: string): string[] {
  const lower = text.toLowerCase();
  const clean = lower.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  const tokens = clean.split(' ').filter(t => t.length >= 2 && !RAG_STOPWORDS.has(t) && !RAG_STOPWORDS.has(removeDiacritics(t)));
  const phrases = new Set<string>(tokens);
  for (let i = 0; i < tokens.length - 1; i++) {
    phrases.add(`${tokens[i]} ${tokens[i+1]}`);
    if (i < tokens.length - 2) phrases.add(`${tokens[i]} ${tokens[i+1]} ${tokens[i+2]}`);
  }
  const withBare = new Set<string>(phrases);
  for (const p of phrases) {
    const b = removeDiacritics(p);
    if (b !== p) withBare.add(b);
  }
  return Array.from(withBare).sort((a, b) => b.length - a.length).slice(0, 16);
}

export function calculateRelevanceScore(
  topic: KnowledgeTopic,
  userMessage: string,
  opts: { isFatherQuery?: boolean; isFatherUniverseContent?: boolean; isBuddhistContent?: boolean } = {}
): number {
  let score = 0;
  const titleLower = topic.title.toLowerCase();
  const descLower = (topic.description || '').toLowerCase();
  const contentLower = (topic.content || '').toLowerCase();
  const titleBare = removeDiacritics(titleLower);
  const descBare = removeDiacritics(descLower);
  const contentBare = removeDiacritics(contentLower);
  const messageLower = userMessage.toLowerCase();
  const messageBare = removeDiacritics(messageLower);

  if (opts.isFatherQuery) {
    if (opts.isFatherUniverseContent) score += 200;
    if (opts.isBuddhistContent) score -= 500;
    if (titleLower.includes('8 câu thần chú') || titleLower.includes('thần chú của cha vũ trụ')) {
      score += 100;
    }
  }

  const phrases = generateRagPhrases(userMessage);
  for (const p of phrases) {
    const isMulti = p.includes(' ');
    const titleHit = titleLower.includes(p) || titleBare.includes(p);
    const descHit = descLower.includes(p) || descBare.includes(p);
    const contentHit = contentLower.includes(p) || contentBare.includes(p);
    if (titleHit) score += isMulti ? 30 : 15;
    if (descHit) score += isMulti ? 12 : 6;
    if (contentHit) score += isMulti ? 6 : 2;
    if (titleHit && isMulti && p.length >= 8) score += 20;
  }

  const hasFreedom = messageBare.includes('tu do') || messageBare.includes('freedom');
  const hasLayer = messageBare.includes('tang') || messageBare.includes('layer') || messageBare.includes('level');
  if (hasFreedom && hasLayer) {
    const titleHasFreedom = titleBare.includes('tu do') || titleBare.includes('freedom');
    const titleHasLayer = titleBare.includes('tang') || titleBare.includes('layer');
    if (titleHasFreedom && titleHasLayer) score += 150;
  }

  if (topic.category) {
    const categoryLower = topic.category.toLowerCase();
    if (messageLower.includes('thiền') && (categoryLower.includes('meditation') || categoryLower.includes('thiền'))) {
      score += 30;
    }
    if (messageLower.includes('ecosystem') && categoryLower.includes('ecosystem')) {
      score += 30;
    }
  }

  return score;
}

/** Rank a set of topics by relevance for a given query. Returns sorted desc. */
export function rankTopics(
  topics: KnowledgeTopic[],
  userMessage: string,
  classify?: (t: KnowledgeTopic) => { isFatherUniverseContent?: boolean; isBuddhistContent?: boolean },
  isFatherQuery = false,
): Array<KnowledgeTopic & { _score: number }> {
  return topics
    .map(t => ({
      ...t,
      _score: calculateRelevanceScore(t, userMessage, { isFatherQuery, ...(classify?.(t) ?? {}) }),
    }))
    .sort((a, b) => b._score - a._score);
}
