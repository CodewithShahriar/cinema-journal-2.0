import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Download, Upload, Trash2, LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useMovies } from "@/lib/movies-store";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { TrackedMovie } from "@/lib/movie-types";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getCurrentUser, signInWithEmail, signOut, signUpWithEmail } from "@/lib/supabase-auth";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const { movies, replaceAll, clearAll } = useMovies();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSupabaseConfigured) {
      void getCurrentUser().then(setUser).catch(() => setUser(null));
    }
  }, []);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(movies, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `cinejournal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Exported");
  };

  const importData = (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result as string) as TrackedMovie[];
        if (!Array.isArray(data)) throw new Error();
        replaceAll(data);
        toast.success(`Imported ${data.length} movies`);
      } catch { toast.error("Invalid file"); }
    };
    r.readAsText(file);
  };

  const finishAuthentication = () => {
    // Reloading reinitializes the movie provider with the newly authenticated user's collection.
    window.location.reload();
  };

  const signIn = async () => {
    if (!email.trim() || password.length < 6) {
      toast.error("Enter an email and a password with at least 6 characters.");
      return;
    }
    setAuthBusy(true);
    try {
      await signInWithEmail(email.trim(), password);
      finishAuthentication();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setAuthBusy(false);
    }
  };

  const signUp = async () => {
    if (!email.trim() || password.length < 6) {
      toast.error("Enter an email and a password with at least 6 characters.");
      return;
    }
    setAuthBusy(true);
    try {
      const data = await signUpWithEmail(email.trim(), password);
      if (data.session) finishAuthentication();
      else toast.success("Account created. Check your email to confirm it, then sign in.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create your account.");
    } finally {
      setAuthBusy(false);
    }
  };

  const logOut = async () => {
    setAuthBusy(true);
    try {
      // Do not leave this account's private collection in the browser for the next visitor.
      localStorage.removeItem("cinejournal.movies.v2");
      await signOut();
      finishAuthentication();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Settings" subtitle="Customize your journal" />

      {isSupabaseConfigured && (
        <section className="mb-4 rounded-2xl bg-card p-5 ring-1 ring-border">
          <h3 className="mb-1 text-sm font-semibold">Account & sync</h3>
          {user?.email ? (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Signed in as {user.email}. Your movies sync across devices.</p>
              <Button variant="outline" className="w-full justify-start" onClick={() => void logOut()} disabled={authBusy}>
                <LogOut className="mr-2 h-4 w-4" />Sign out
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Create an account to keep your journal when you change device.</p>
              <input
                type="email" value={email} onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address" autoComplete="email" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
              <input
                type="password" value={password} onChange={(event) => setPassword(event.target.value)}
                placeholder="Password (at least 6 characters)" autoComplete="current-password" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => void signIn()} disabled={authBusy}>Sign in</Button>
                <Button onClick={() => void signUp()} disabled={authBusy}><UserRound className="mr-2 h-4 w-4" />Create account</Button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mb-4 rounded-2xl bg-card p-5 ring-1 ring-border">
        <h3 className="mb-4 text-sm font-semibold">Data</h3>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />Export movie list
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />Import movie list
          </Button>
          <input
            ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
          />
        </div>
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h3 className="mb-2 text-sm font-semibold text-destructive">Danger zone</h3>
        <p className="mb-3 text-xs text-muted-foreground">Permanently remove all movies from this device.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />Reset all data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete all movies?</AlertDialogTitle>
              <AlertDialogDescription>This cannot be undone. Export first if you'd like a backup.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { clearAll(); toast.success("All data cleared"); }} className="bg-destructive text-destructive-foreground">Delete everything</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      <p className="mt-8 text-center text-xs text-muted-foreground">CineJournal · Your private movie tracker</p>
    </AppShell>
  );
}
