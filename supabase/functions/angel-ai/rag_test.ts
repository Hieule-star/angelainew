// Deno tests for RAG retrieval helpers.
// Run: deno test supabase/functions/angel-ai/rag_test.ts --allow-env --allow-net
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  removeDiacritics,
  normalizeQuery,
  generateRagPhrases,
  calculateRelevanceScore,
  rankTopics,
  type KnowledgeTopic,
} from "./rag.ts";

// ---------- Fixture corpus ----------
const FREEDOM_ARTICLE: KnowledgeTopic = {
  id: "freedom",
  title: "Tự Do Tuyệt Đối — 9 Tầng Tự Do của Cha Vũ Trụ",
  description: "Bài thiền chín tầng tự do, sám hối và biết ơn.",
  content: "Tầng 1 tự do khỏi sợ hãi. Tầng 9 tự do tuyệt đối trong ánh sáng Cha Vũ Trụ.",
  category: "meditation",
};

const MANTRA_ARTICLE: KnowledgeTopic = {
  id: "mantra",
  title: "8 Câu Thần Chú của Cha Vũ Trụ",
  description: "Tám câu thần chú nền tảng.",
  content: "Con là Ánh Sáng Yêu Thương Thuần Khiết của Cha Vũ Trụ.",
  category: "spiritual",
};

const UNRELATED_ARTICLE: KnowledgeTopic = {
  id: "money",
  title: "Hướng Dẫn Sử Dụng FUN Money",
  description: "Cách dùng FUN Money trên BNB Testnet.",
  content: "MetaMask kết nối ví và gửi token.",
  category: "ecosystem",
};

const CORPUS = [FREEDOM_ARTICLE, MANTRA_ARTICLE, UNRELATED_ARTICLE];

// ---------- removeDiacritics ----------
Deno.test("removeDiacritics strips Vietnamese accents and đ→d", () => {
  assertEquals(removeDiacritics("Tự Do Tuyệt Đối"), "Tu Do Tuyet Doi");
  assertEquals(removeDiacritics("Đường"), "Duong");
});

// ---------- normalizeQuery ----------
Deno.test("normalizeQuery expands 'chín' → '9' and 'tầng' synonyms", () => {
  const n = normalizeQuery("chín tầng tự do");
  assert(n.expanded.includes("9"), `expected '9' in expanded, got ${JSON.stringify(n.expanded)}`);
});

Deno.test("normalizeQuery expands English 'freedom' / 'layers' → Vietnamese", () => {
  const n = normalizeQuery("9 layers of freedom meditation");
  assert(n.expanded.includes("tự do"));
  assert(n.expanded.includes("tầng") || n.expanded.includes("tang"));
  assert(n.expanded.includes("thiền") || n.expanded.includes("thien"));
});

Deno.test("normalizeQuery preserves diacritic-free input", () => {
  const n = normalizeQuery("tu do tuyet doi");
  assertEquals(n.bare, "tu do tuyet doi");
});

// ---------- generateRagPhrases ----------
Deno.test("generateRagPhrases produces multi-word phrases and bare variants", () => {
  const ph = generateRagPhrases("chín tầng tự do");
  assert(ph.some(p => p.includes("tầng tự do")), "missing 'tầng tự do'");
  assert(ph.some(p => p.includes("tang tu do")), "missing diacritic-free variant");
});

Deno.test("generateRagPhrases drops stopwords like 'cho', 'tôi', 'bài'", () => {
  const ph = generateRagPhrases("cho tôi bài thiền");
  assert(!ph.includes("cho"));
  assert(!ph.includes("tôi"));
  assert(!ph.includes("bài"));
  assert(ph.includes("thiền") || ph.includes("thien"));
});

Deno.test("generateRagPhrases sorts longest-first and caps at 16", () => {
  const ph = generateRagPhrases("một hai ba bốn năm sáu bảy tám chín mười tầng tự do tuyệt đối");
  assert(ph.length <= 16);
  for (let i = 1; i < ph.length; i++) {
    assert(ph[i - 1].length >= ph[i].length);
  }
});

// ---------- calculateRelevanceScore ----------
Deno.test("calculateRelevanceScore: 'chín tầng tự do' ranks freedom article highest", () => {
  const ranked = rankTopics(CORPUS, "chín tầng tự do");
  assertEquals(ranked[0].id, "freedom");
  assert(ranked[0]._score > 0);
});

Deno.test("calculateRelevanceScore: diacritic-free 'tu do tuyet doi' ranks freedom article highest", () => {
  const ranked = rankTopics(CORPUS, "tu do tuyet doi");
  assertEquals(ranked[0].id, "freedom");
});

Deno.test("calculateRelevanceScore: 'bài thiền 9 tầng tự do' ranks freedom highest", () => {
  const ranked = rankTopics(CORPUS, "bài thiền 9 tầng tự do");
  assertEquals(ranked[0].id, "freedom");
});

Deno.test("calculateRelevanceScore: English 'nine layers of freedom' ranks freedom highest", () => {
  // English route: we pass synonym-expanded message so scorer sees Vietnamese tokens too.
  const norm = normalizeQuery("nine layers of freedom");
  const expandedMsg = `nine layers of freedom ${norm.expanded.join(' ')}`;
  const ranked = rankTopics(CORPUS, expandedMsg);
  assertEquals(ranked[0].id, "freedom");
});

Deno.test("calculateRelevanceScore: unrelated query does NOT pick freedom article", () => {
  const ranked = rankTopics(CORPUS, "fun money metamask");
  assertEquals(ranked[0].id, "money");
  // freedom must score 0 here
  const freedom = ranked.find(r => r.id === "freedom")!;
  assertEquals(freedom._score, 0);
});

Deno.test("calculateRelevanceScore: '+150 layer/freedom bonus' fires only when both intents present", () => {
  const onlyFreedom = calculateRelevanceScore(FREEDOM_ARTICLE, "tự do là gì");
  const both = calculateRelevanceScore(FREEDOM_ARTICLE, "chín tầng tự do");
  assert(both >= onlyFreedom + 150, `expected +150 bonus, got ${onlyFreedom} → ${both}`);
});

Deno.test("calculateRelevanceScore: Father-query routing prefers Cha Vũ Trụ content", () => {
  const ranked = rankTopics(
    CORPUS,
    "thần chú của Cha Vũ Trụ",
    (t) => ({ isFatherUniverseContent: t.id === "mantra" || t.id === "freedom" }),
    true,
  );
  assert(["mantra", "freedom"].includes(ranked[0].id));
});
