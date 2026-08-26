// Frontend mirror of CODE_BLOCKLIST. Last-mile check before iframe render.
export const FRONTEND_CODE_BLOCKLIST: { pattern: RegExp; flag: string }[] = [
  { pattern: /\beval\s*\(/, flag: "eval" },
  { pattern: /new\s+Function\s*\(/, flag: "new_function" },
  { pattern: /document\.cookie/, flag: "cookie_access" },
  { pattern: /window\.parent|window\.top|window\.opener/, flag: "frame_escape" },
  { pattern: /import\s*\(\s*['"`]https?:/, flag: "dynamic_remote_import" },
  { pattern: /supabase|VITE_|SERVICE_ROLE|LOVABLE_API_KEY/i, flag: "secret_leak" },
];

export function scanCode(code: string): string[] {
  const flags: string[] = [];
  for (const { pattern, flag } of FRONTEND_CODE_BLOCKLIST) {
    if (pattern.test(code)) flags.push(flag);
  }
  return flags;
}
