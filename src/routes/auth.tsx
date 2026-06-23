import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/crm/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — THE VYROL CRM" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading, signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: "/" });
  }, [loading, user, nav]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) toast.error(error);
    else nav({ to: "/" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo className="h-10" /></div>
        <div className="card-elevated p-6">
          <h1 className="font-display text-2xl font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use the credentials provided to you.</p>
          <form onSubmit={handle} className="mt-5 space-y-3">
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Password</Label>
              <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={submitting} className="gradient-brand w-full text-white">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Accounts are created by your admin.</p>
      </div>
    </div>
  );
}
