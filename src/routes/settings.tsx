import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Download,
  Upload,
  Trash2,
  LogOut,
  UserRound,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  CloudOff,
  Database,
  History,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useMovies } from "@/lib/movies-store";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { TrackedMovie } from "@/lib/movie-types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  getCurrentUser,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  resetPasswordForEmail,
  updateUserPassword,
  isValidEmail,
  checkPasswordStrength,
} from "@/lib/supabase-auth";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

type AuthTab = "signin" | "signup" | "forgot" | "reset_password";

function SettingsPage() {
  const { movies, replaceAll, clearAll, syncStatus, lastSyncedAt, syncNow } = useMovies();
  const [user, setUser] = useState<User | null>(null);

  // Auth form states
  const [authTab, setAuthTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [syncBusy, setSyncBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Check current session
  useEffect(() => {
    if (isSupabaseConfigured) {
      void getCurrentUser().then(setUser).catch(() => setUser(null));
    }
  }, []);

  // Listen for Password Recovery events (when user clicks link in reset email)
  useEffect(() => {
    if (!supabase) return;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthTab("reset_password");
        if (session?.user) {
          setUser(session.user);
        }
        toast.info("Please set a new password for your account.");
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const passwordStrength = checkPasswordStrength(password);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(movies, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cinejournal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded successfully");
  };

  const importData = (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result as string) as TrackedMovie[];
        if (!Array.isArray(data)) throw new Error("Invalid format");
        replaceAll(data);
        toast.success(`Successfully imported ${data.length} movies`);
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    r.readAsText(file);
  };

  const restoreFromEmergencyBackup = () => {
    try {
      const raw = localStorage.getItem("cinejournal.movies.backup");
      if (!raw) {
        toast.error("No emergency backup found in local storage.");
        return;
      }
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        replaceAll(data);
        toast.success(`Restored ${data.length} movies from emergency backup!`);
      } else {
        toast.error("Emergency backup is empty.");
      }
    } catch {
      toast.error("Could not read backup data.");
    }
  };

  const handleManualSync = async () => {
    setSyncBusy(true);
    try {
      await syncNow();
      toast.success("Cloud sync complete!");
    } catch {
      toast.error("Sync could not complete. Check your internet connection.");
    } finally {
      setSyncBusy(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setAuthBusy(true);
    try {
      await signInWithEmail(email, password);
      const activeUser = await getCurrentUser();
      setUser(activeUser);
      setPassword("");
      toast.success("Signed in successfully! Merging movies to your account...");
      await syncNow();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not sign in.";
      toast.error(msg);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setAuthBusy(true);
    try {
      const data = await signUpWithEmail(email, password);
      if (data.session) {
        const activeUser = await getCurrentUser();
        setUser(activeUser);
        setPassword("");
        setConfirmPassword("");
        toast.success("Account created! Uploading journal to cloud...");
        await syncNow();
      } else {
        toast.success("Account created! Check your email inbox to confirm your account.");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not create account.";
      toast.error(msg);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setAuthBusy(true);
    try {
      await resetPasswordForEmail(email);
      setResetSent(true);
      toast.success("Password reset link sent to your email!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to send reset email.";
      toast.error(msg);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setAuthBusy(true);
    try {
      await updateUserPassword(password);
      setPassword("");
      setConfirmPassword("");
      toast.success("Password successfully updated!");
      setAuthTab("signin");
      const activeUser = await getCurrentUser();
      setUser(activeUser);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to update password.";
      toast.error(msg);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogOut = async () => {
    setAuthBusy(true);
    try {
      await signOut();
      setUser(null);
      setPassword("");
      toast.success("Signed out safely. Your local journal remains preserved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Settings & Sync"
        subtitle="Manage your cloud account, sync status, and journal backups"
      />

      {/* Cloud Sync Status Card */}
      <section className="mb-5 overflow-hidden rounded-2xl glass-card p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                syncStatus === "synced"
                  ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                  : syncStatus === "syncing"
                    ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30 animate-pulse"
                    : "bg-white/5 text-muted-foreground ring-1 ring-white/10"
              }`}
            >
              {syncStatus === "synced" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : syncStatus === "syncing" ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <CloudOff className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-white">
                {syncStatus === "synced"
                  ? "Cloud Synced & Safe"
                  : syncStatus === "syncing"
                    ? "Syncing in progress…"
                    : syncStatus === "offline"
                      ? "Offline (Local Storage Active)"
                      : "Sync Ready"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {lastSyncedAt
                  ? `Last synced: ${lastSyncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "Changes are automatically cached locally"}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSync}
            disabled={syncBusy || syncStatus === "syncing"}
            className="border-primary/30 text-xs hover:border-primary hover:bg-primary/10"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${syncBusy ? "animate-spin" : ""}`} />
            Sync Now
          </Button>
        </div>
      </section>

      {/* Upgraded Cloud Account & Authentication Section */}
      {isSupabaseConfigured && (
        <section className="mb-5 rounded-2xl glass-card p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Supabase Account & Sync
              </h3>
            </div>
            {user?.email && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="h-3 w-3" />
                Authenticated
              </span>
            )}
          </div>

          {user?.email ? (
            /* Logged-in State */
            <div className="space-y-4">
              <div className="rounded-xl bg-background/60 p-4 border border-white/10">
                <span className="text-xs text-muted-foreground">Logged in as:</span>
                <p className="font-mono text-sm sm:text-base font-bold text-white mt-0.5">
                  {user.email}
                </p>
                <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Your movies automatically synchronize with this account across mobile & desktop.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button
                  variant="outline"
                  className="w-full justify-center text-muted-foreground hover:text-white hover:bg-white/5 border-white/10"
                  onClick={() => {
                    setEmail(user.email ?? "");
                    setAuthTab("forgot");
                  }}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset Password
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-center text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                  onClick={() => void handleLogOut()}
                  disabled={authBusy}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            /* Logged-out State: Tabs for Sign In, Create Account, and Forgot Password */
            <div className="space-y-4">
              {/* Tab Selector */}
              {authTab !== "reset_password" && (
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-background/80 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("signin");
                      setResetSent(false);
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      authTab === "signin"
                        ? "bg-primary text-white shadow-md shadow-primary/30"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("signup");
                      setResetSent(false);
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      authTab === "signup"
                        ? "bg-primary text-white shadow-md shadow-primary/30"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Mode 1: Sign In Form */}
              {authTab === "signin" && (
                <form onSubmit={handleSignIn} className="space-y-3 pt-1 animate-reveal-card">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        className="h-10 w-full pl-9 pr-3 rounded-xl border border-white/10 bg-background/70 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-muted-foreground">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab("forgot");
                          setResetSent(false);
                        }}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                        className="h-10 w-full pl-9 pr-10 rounded-xl border border-white/10 bg-background/70 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-muted-foreground/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={authBusy}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-sm h-11 rounded-xl shadow-lg shadow-primary/25 mt-2"
                  >
                    {authBusy ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserRound className="mr-2 h-4 w-4" />
                    )}
                    Sign In & Sync
                  </Button>
                </form>
              )}

              {/* Mode 2: Create Account Form */}
              {authTab === "signup" && (
                <form onSubmit={handleSignUp} className="space-y-3 pt-1 animate-reveal-card">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        className="h-10 w-full pl-9 pr-3 rounded-xl border border-white/10 bg-background/70 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Choose Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                        required
                        className="h-10 w-full pl-9 pr-10 rounded-xl border border-white/10 bg-background/70 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-muted-foreground/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Live Password Strength Meter */}
                    {password && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">Strength:</span>
                          <span className="font-semibold text-white">{passwordStrength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex gap-1">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-full flex-1 rounded-full transition-colors ${
                                passwordStrength.score >= step ? passwordStrength.color : "bg-transparent"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        required
                        className="h-10 w-full pl-9 pr-10 rounded-xl border border-white/10 bg-background/70 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-muted-foreground/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground pt-1">
                    Your current local movies will be automatically uploaded and saved to this account!
                  </p>

                  <Button
                    type="submit"
                    disabled={authBusy}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-sm h-11 rounded-xl shadow-lg shadow-primary/25 mt-2"
                  >
                    {authBusy ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-2 h-4 w-4" />
                    )}
                    Create Account & Upload
                  </Button>
                </form>
              )}

              {/* Mode 3: Forgot Password Request Form */}
              {authTab === "forgot" && (
                <div className="space-y-3 pt-1 animate-reveal-card">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setAuthTab("signin")}
                      className="text-xs text-muted-foreground hover:text-white flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to Sign In
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Enter your email address and we'll send you a secure link to reset your password.
                  </p>

                  {resetSent ? (
                    <div className="rounded-xl bg-emerald-500/15 p-4 border border-emerald-500/30 text-emerald-400 space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        Reset Link Sent!
                      </div>
                      <p className="text-xs text-zinc-300">
                        Check your email inbox at <strong className="text-white">{email}</strong>. Click
                        the recovery link to set your new password.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Account Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                            className="h-10 w-full pl-9 pr-3 rounded-xl border border-white/10 bg-background/70 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-muted-foreground/60"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={authBusy}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-sm h-11 rounded-xl shadow-lg shadow-primary/25"
                      >
                        {authBusy ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <KeyRound className="mr-2 h-4 w-4" />
                        )}
                        Send Password Reset Link
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {/* Mode 4: Set New Password Form (Recovery) */}
              {authTab === "reset_password" && (
                <form onSubmit={handleSetNewPassword} className="space-y-3 pt-1 animate-reveal-card">
                  <div className="rounded-xl bg-primary/10 p-3 border border-primary/20">
                    <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <KeyRound className="h-4 w-4" />
                      Set New Password
                    </h4>
                    <p className="text-xs text-zinc-300 mt-1">
                      Enter and confirm your new account password below.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      New Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        className="h-10 w-full pl-9 pr-10 rounded-xl border border-white/10 bg-background/70 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-muted-foreground/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        className="h-10 w-full pl-9 pr-10 rounded-xl border border-white/10 bg-background/70 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-muted-foreground/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={authBusy}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-sm h-11 rounded-xl shadow-lg shadow-primary/25 mt-2"
                  >
                    {authBusy ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Save New Password
                  </Button>
                </form>
              )}
            </div>
          )}
        </section>
      )}

      {/* Data Management & Emergency Recovery */}
      <section className="mb-5 rounded-2xl glass-card p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-white">Backup & Data Recovery</h3>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          You currently have <strong className="text-white">{movies.length}</strong> movies in your
          journal. Export a backup or restore whenever you need.
        </p>
        <div className="space-y-2.5">
          <Button
            variant="outline"
            className="w-full justify-start hover:border-primary/40 hover:bg-primary/5 transition-all border-white/10"
            onClick={exportData}
          >
            <Download className="mr-2 h-4 w-4 text-primary" />
            Download JSON Backup
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start hover:border-primary/40 hover:bg-primary/5 transition-all border-white/10"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4 text-primary" />
            Restore from JSON File
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-amber-400 hover:text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all border-white/10"
            onClick={restoreFromEmergencyBackup}
          >
            <History className="mr-2 h-4 w-4" />
            Restore from Local Auto-Backup
          </Button>

          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
          />
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-2xl glass-card p-5 shadow-xl">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Permanently clear your active list. (An emergency backup will still be preserved in
          browser memory).
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Reset active movies
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-white/10 bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all movies?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear the current list. You can still restore from a backup file or
                emergency auto-backup.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  clearAll();
                  toast.success("List cleared. Auto-backup saved.");
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirm Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        CineJournal 2.0 · Ultra-Modern Movie Tracker
      </p>
    </AppShell>
  );
}
