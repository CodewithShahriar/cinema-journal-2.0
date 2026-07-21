import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Moon, Sun, Download, Upload, Trash2, Palette } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useMovies, loadTheme, saveTheme, loadAccent, saveAccent } from "@/lib/movies-store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { TrackedMovie } from "@/lib/movie-types";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const ACCENTS: { name: string; value: string; hex: string }[] = [
  { name: "Ruby", value: "oklch(0.62 0.22 25)", hex: "#e63946" },
  { name: "Gold", value: "oklch(0.78 0.16 85)", hex: "#e8b84a" },
  { name: "Ocean", value: "oklch(0.62 0.16 230)", hex: "#3b82f6" },
  { name: "Emerald", value: "oklch(0.68 0.16 155)", hex: "#10b981" },
  { name: "Violet", value: "oklch(0.6 0.22 300)", hex: "#a855f7" },
  { name: "Rose", value: "oklch(0.68 0.2 355)", hex: "#f43f5e" },
];

function SettingsPage() {
  const { movies, replaceAll, clearAll } = useMovies();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [accent, setAccent] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTheme(loadTheme()); setAccent(loadAccent()); }, []);

  const toggleTheme = (dark: boolean) => {
    const t = dark ? "dark" : "light";
    setTheme(t); saveTheme(t);
  };

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

  return (
    <AppShell>
      <PageHeader title="Settings" subtitle="Customize your journal" />

      <section className="mb-4 rounded-2xl bg-card p-5 ring-1 ring-border">
        <h3 className="mb-4 text-sm font-semibold">Appearance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <div>
              <div className="text-sm font-medium">Dark mode</div>
              <div className="text-xs text-muted-foreground">Cinematic dark theme</div>
            </div>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
        </div>
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2"><Palette className="h-4 w-4" /><span className="text-sm font-medium">Accent color</span></div>
          <div className="grid grid-cols-6 gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.name}
                onClick={() => { setAccent(a.value); saveAccent(a.value); toast(`Accent: ${a.name}`); }}
                className={`aspect-square rounded-xl transition-transform hover:scale-110 ${accent === a.value ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}
                style={{ background: a.hex }}
                aria-label={a.name}
              />
            ))}
          </div>
        </div>
      </section>

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
