import { useEffect, useMemo, useRef, useState } from "react";
import { scanCode } from "@/lib/miniAppSafety";
import { AlertTriangle } from "lucide-react";

interface MiniAppPreviewProps {
  files: Record<string, string>;
  entry?: string;
  className?: string;
}

function buildSrcDoc(code: string): string {
  // CSP: allow scripts from CDN, no remote connect.
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src https://unpkg.com https://cdn.tailwindcss.com 'unsafe-inline' 'unsafe-eval'; style-src https://cdn.tailwindcss.com 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none';" />
<title>Mini App Preview</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>
  html,body,#root{height:100%;margin:0;background:#fafafa;font-family:ui-sans-serif,system-ui,-apple-system}
</style>
</head>
<body>
<div id="root"></div>
<script>
  window.addEventListener("error", (e) => {
    const root = document.getElementById("root");
    if (root) root.innerHTML = '<pre style="color:#b91c1c;padding:16px;white-space:pre-wrap;font-family:ui-monospace">Runtime error: ' + (e.message || "unknown") + '</pre>';
  });
</script>
<script type="text/babel" data-presets="typescript,react">
const { useState, useEffect, useRef, useMemo, useCallback, useReducer } = React;
try {
${code}

const Root = (typeof App !== "undefined") ? App : (typeof Component !== "undefined" ? Component : null);
if (!Root) throw new Error("No default React component named App found");
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Root));
} catch (err) {
  document.getElementById("root").innerHTML = '<pre style="color:#b91c1c;padding:16px;white-space:pre-wrap;font-family:ui-monospace">Compile error: ' + (err && err.message ? err.message : err) + '</pre>';
}
</script>
</body>
</html>`;
}

function stripExportDefault(code: string): string {
  // Babel standalone won't execute ES module exports; convert to global decl.
  return code
    .replace(/export\s+default\s+function\s+(\w+)/g, "function $1")
    .replace(/export\s+default\s+(\w+)\s*;?/g, "const App = $1;")
    .replace(/export\s+default\s+/g, "const App = ")
    .replace(/^\s*import\s+.*?;?\s*$/gm, ""); // strip imports
}

export function MiniAppPreview({ files, entry = "App.tsx", className }: MiniAppPreviewProps) {
  const code = files[entry] ?? "";
  const flags = useMemo(() => scanCode(code), [code]);
  const blocked = flags.length > 0;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);

  const srcDoc = useMemo(() => {
    if (blocked || !code) return "";
    return buildSrcDoc(stripExportDefault(code));
  }, [code, blocked]);

  useEffect(() => {
    setKey((k) => k + 1);
  }, [srcDoc]);

  if (blocked) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 p-8 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 ${className ?? ""}`}>
        <AlertTriangle className="w-10 h-10" />
        <div className="text-center">
          <p className="font-semibold">Mã không an toàn — preview bị chặn</p>
          <p className="text-sm mt-1">Flags: {flags.join(", ")}</p>
        </div>
      </div>
    );
  }

  if (!code) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 rounded-xl text-muted-foreground ${className ?? ""}`}>
        Chưa có mini app để preview
      </div>
    );
  }

  return (
    <iframe
      key={key}
      ref={iframeRef}
      title="Mini App Preview"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      className={`w-full h-full bg-white rounded-xl border border-border ${className ?? ""}`}
    />
  );
}
