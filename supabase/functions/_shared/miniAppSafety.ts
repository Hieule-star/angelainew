// Shared safety blocklist for Mini App Builder.
// Used by both edge function (pre/post filter) and frontend (last-mile check).

export const PROMPT_BLOCKLIST: { pattern: RegExp; flag: string }[] = [
  { pattern: /phishing|lừa đảo|scam|ponzi/i, flag: "scam" },
  { pattern: /wallet\s*drain|seed\s*phrase|private\s*key|metamask\s*connect.*send|drain.*wallet/i, flag: "wallet_drain" },
  { pattern: /steal.*credential|keylog|capture.*password|fake\s*login/i, flag: "credential_theft" },
  { pattern: /spam|mass\s*email|bulk\s*sms/i, flag: "spam" },
  { pattern: /malware|ransomware|virus|exploit|backdoor/i, flag: "malicious" },
  { pattern: /\b(porn|sexual|nsfw|nude)\b/i, flag: "nsfw" },
];

export const CODE_BLOCKLIST: { pattern: RegExp; flag: string }[] = [
  { pattern: /\beval\s*\(/, flag: "eval" },
  { pattern: /new\s+Function\s*\(/, flag: "new_function" },
  { pattern: /document\.cookie/, flag: "cookie_access" },
  { pattern: /localStorage\.(get|remove|clear)/, flag: "localstorage_read" },
  { pattern: /sessionStorage\.(get|remove|clear)/, flag: "sessionstorage_read" },
  { pattern: /window\.parent|window\.top|window\.opener/, flag: "frame_escape" },
  { pattern: /postMessage\s*\(/, flag: "postmessage" }, // allowed but logged
  { pattern: /import\s*\(\s*['"`]https?:/, flag: "dynamic_remote_import" },
  { pattern: /fetch\s*\(\s*['"`](?!https:\/\/(?:cdn\.tailwindcss\.com|unpkg\.com|cdn\.jsdelivr\.net|esm\.sh))/, flag: "external_fetch" },
  { pattern: /supabase|VITE_|SERVICE_ROLE|LOVABLE_API_KEY|sb-[a-z0-9]+-auth-token/i, flag: "secret_leak" },
  { pattern: /\.env\b/, flag: "env_access" },
  { pattern: /crypto\.subtle\.|XMLHttpRequest|navigator\.sendBeacon/, flag: "exfiltration_risk" },
];

export function scanText(text: string, list: typeof PROMPT_BLOCKLIST): string[] {
  const flags: string[] = [];
  for (const { pattern, flag } of list) {
    if (pattern.test(text)) flags.push(flag);
  }
  return flags;
}

// Hard-block flags that must abort generation. Soft flags (e.g. postmessage) only log.
export const HARD_BLOCK_FLAGS = new Set([
  "scam", "wallet_drain", "credential_theft", "malicious", "nsfw",
  "eval", "new_function", "secret_leak", "env_access", "dynamic_remote_import",
  "external_fetch", "exfiltration_risk", "frame_escape",
]);

export function shouldBlock(flags: string[]): boolean {
  return flags.some((f) => HARD_BLOCK_FLAGS.has(f));
}
