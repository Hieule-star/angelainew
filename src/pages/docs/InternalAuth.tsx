import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { ShieldAlert } from 'lucide-react';

export default function InternalAuth() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Internal Application Key Authentication</h1>
          <p className="text-muted-foreground mt-2">
            How trusted services (FUN Hub Core, FUN Profile) authenticate against Angel AI.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>
              Angel AI exposes internal service-to-service authentication through a single shared
              secret called <code className="font-mono">ANGEL_AI_APP_KEY</code>. The key is generated
              and rotated from <strong>Admin → Application Keys</strong>.
            </p>
            <p>
              Format: <code className="font-mono">angel_ai_live_</code> followed by 56 hex characters
              (70 chars total) — generated with the Web Crypto API.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Making an authenticated call</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted rounded p-4 overflow-x-auto text-xs">{`POST https://<project>.functions.supabase.co/angel-ai
Authorization: Bearer angel_ai_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json

{
  "messages": [{ "role": "user", "content": "Hello Angel" }]
}`}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Server-side validation (example)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted rounded p-4 overflow-x-auto text-xs">{`import { validateAppKey } from "../_shared/validateAppKey.ts";

const auth = validateAppKey(req);
if (!auth.ok) {
  return new Response(JSON.stringify({ error: auth.error }), {
    status: auth.status,
  });
}`}</pre>
          </CardContent>
        </Card>

        <Card className="border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <ShieldAlert className="w-5 h-5" /> Security Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Server-side only — store in each service's secret manager.</li>
              <li>Never embed in frontend bundles, browser code, or mobile apps.</li>
              <li>Never persist in <code>localStorage</code>, <code>sessionStorage</code>, or cookies.</li>
              <li>Never log the key. Use the masked form (<code>angel_ai_live_xxxx…wxyz</code>) for diagnostics.</li>
              <li>Rotate immediately on suspected leak via Admin → Application Keys → Rotate.</li>
              <li>After rotation, update <code>ANGEL_AI_APP_KEY</code> in this project and the
                corresponding secret in every downstream service.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rotation procedure</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Open <strong>Admin → Application Keys</strong>.</li>
              <li>Click <strong>Rotate Key</strong> and copy the value from the one-time reveal modal.</li>
              <li>Update the <code>ANGEL_AI_APP_KEY</code> secret in this project's edge function secrets.</li>
              <li>Update the corresponding secret in FUN Hub Core, FUN Profile, and any other
                service that calls Angel AI.</li>
              <li>Verify each service still authenticates successfully.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
