import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Copy, KeyRound, RefreshCw, ShieldAlert, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type Status = {
  configured: boolean;
  masked: string | null;
  fingerprint: string | null;
  lastRotation: { action: string; created_at: string; masked_key: string; key_fingerprint: string } | null;
};

type AuditEntry = {
  id: string;
  actor_user_id: string | null;
  action: string;
  masked_key: string;
  key_fingerprint: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export default function ApplicationKeys() {
  const [status, setStatus] = useState<Status | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [revealKey, setRevealKey] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'generate' | 'rotate' | null>(null);
  const [copied, setCopied] = useState(false);

  async function call(action: string, body: Record<string, unknown> = {}) {
    const { data, error } = await supabase.functions.invoke('app-key-management', {
      body: { action, ...body },
    });
    if (error) throw error;
    return data;
  }

  async function refresh() {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([call('get_masked'), call('list_audit')]);
      setStatus(s);
      setAudit(a.entries ?? []);
    } catch (e: any) {
      toast({ title: 'Failed to load', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function doGenerateOrRotate(action: 'generate' | 'rotate') {
    setWorking(true);
    try {
      const data = await call(action);
      setRevealKey(data.key);
      await refresh();
    } catch (e: any) {
      toast({ title: 'Operation failed', description: e.message, variant: 'destructive' });
    } finally {
      setWorking(false);
      setConfirmAction(null);
    }
  }

  function copyKey() {
    if (!revealKey) return;
    navigator.clipboard.writeText(revealKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function closeReveal() {
    setRevealKey(null);
    setCopied(false);
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <KeyRound className="w-6 h-6" /> Application Keys
          </h1>
          <p className="text-muted-foreground mt-1">
            Internal service-to-service authentication for Angel AI (FUN Hub Core, FUN Profile, ...).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ANGEL_AI_APP_KEY</CardTitle>
            <CardDescription>
              Server-side secret. Never embedded in the frontend, never stored in localStorage,
              never returned by public APIs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : status?.configured ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <code className="px-3 py-2 rounded bg-muted font-mono text-sm">{status.masked}</code>
                  <Badge variant="secondary">fp: {status.fingerprint}</Badge>
                  {status.lastRotation && (
                    <span className="text-xs text-muted-foreground">
                      Last {status.lastRotation.action} {new Date(status.lastRotation.created_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmAction('rotate')}
                  disabled={working}
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Rotate Key
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-amber-600">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-sm">No application key configured yet.</span>
                </div>
                <Button onClick={() => setConfirmAction('generate')} disabled={working}>
                  <KeyRound className="w-4 h-4 mr-2" /> Generate Key
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>Last 50 generation / rotation events. Key material is never stored.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Masked</TableHead>
                  <TableHead>Fingerprint</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audit.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No events yet
                    </TableCell>
                  </TableRow>
                ) : (
                  audit.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs">{new Date(e.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={e.action === 'rotated' ? 'destructive' : 'default'}>{e.action}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{e.masked_key}</TableCell>
                      <TableCell className="font-mono text-xs">{e.key_fingerprint}</TableCell>
                      <TableCell className="text-xs">{e.ip_address ?? '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'rotate' ? 'Rotate application key?' : 'Generate application key?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'rotate'
                ? 'The previous key will stop working as soon as you update the ANGEL_AI_APP_KEY secret with the new value. All downstream services (FUN Hub Core, FUN Profile, ...) must be updated.'
                : 'A new cryptographically-secure key will be generated. You must then store it in the ANGEL_AI_APP_KEY secret.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmAction && doGenerateOrRotate(confirmAction)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* One-time reveal */}
      <Dialog open={!!revealKey} onOpenChange={(o) => !o && closeReveal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" /> Copy this key now
            </DialogTitle>
            <DialogDescription>
              This is the only time the full key will be shown. Save it to the{' '}
              <code className="font-mono">ANGEL_AI_APP_KEY</code> secret immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded p-3 font-mono text-sm break-all select-all">
            {revealKey}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={copyKey}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button onClick={closeReveal}>I have saved it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
