import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GENRES, type Movie } from "@/lib/movie-types";
import { Star, Upload } from "lucide-react";

export type MovieFormValues = Omit<Movie, "id" | "createdAt" | "updatedAt">;

export function MovieForm({
  initial,
  onSubmit,
  submitLabel = "Save Movie",
}: {
  initial?: Partial<MovieFormValues>;
  onSubmit: (v: MovieFormValues) => void;
  submitLabel?: string;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [poster, setPoster] = useState(initial?.poster ?? "");
  const [year, setYear] = useState<string>(initial?.year ? String(initial.year) : "");
  const [runtime, setRuntime] = useState<string>(initial?.runtime ? String(initial.runtime) : "");
  const [genres, setGenres] = useState<string[]>(initial?.genres ?? []);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [status, setStatus] = useState<"watchlist" | "watched">(initial?.status ?? "watchlist");
  const [rating, setRating] = useState<number>(initial?.rating ?? 7);
  const [favorite, setFavorite] = useState<boolean>(initial?.favorite ?? false);

  const toggleGenre = (g: string) =>
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const handleFile = (file: File) => {
    const r = new FileReader();
    r.onload = () => setPoster(r.result as string);
    r.readAsDataURL(file);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
          title: title.trim(),
          poster: poster || undefined,
          year: year ? Number(year) : undefined,
          runtime: runtime ? Number(runtime) : undefined,
          genres,
          description: description || undefined,
          note: note || undefined,
          status,
          rating: status === "watched" ? rating : initial?.rating,
          favorite,
          watchDate: initial?.watchDate,
        });
      }}
      className="space-y-6"
    >
      {/* Poster */}
      <div className="flex gap-4">
        <div className="relative h-40 w-28 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border">
          {poster ? (
            <img src={poster} alt="poster" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No poster
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Label className="text-xs">Poster URL</Label>
          <Input value={poster} onChange={(e) => setPoster(e.target.value)} placeholder="https://..." />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent">
            <Upload className="h-3.5 w-3.5" /> Upload image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      <div>
        <Label>Title *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Year</Label>
          <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Runtime (min)</Label>
          <Input type="number" value={runtime} onChange={(e) => setRuntime(e.target.value)} className="mt-1" />
        </div>
      </div>

      <div>
        <Label>Genres</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {GENRES.map((g) => {
            const on = genres.includes(g);
            return (
              <button
                type="button"
                key={g}
                onClick={() => toggleGenre(g)}
                className={`rounded-full px-3 py-1 text-xs transition-all ${
                  on
                    ? "bg-primary text-primary-foreground shadow"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1" />
      </div>

      <div>
        <Label>Personal note</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-1" placeholder="Private thoughts, review..." />
      </div>

      <div>
        <Label>Status</Label>
        <RadioGroup
          value={status}
          onValueChange={(v) => setStatus(v as "watchlist" | "watched")}
          className="mt-2 grid grid-cols-2 gap-2"
        >
          {(["watchlist", "watched"] as const).map((s) => (
            <label
              key={s}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition-all ${
                status === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"
              }`}
            >
              <RadioGroupItem value={s} className="sr-only" />
              {s}
            </label>
          ))}
        </RadioGroup>
      </div>

      {status === "watched" && (
        <div className="rounded-2xl border border-border bg-card p-4 animate-fade-in">
          <div className="mb-3 flex items-center justify-between">
            <Label className="flex items-center gap-2"><Star className="h-4 w-4 text-gold" />Your rating</Label>
            <span className="text-lg font-semibold text-gold">{rating.toFixed(1)}</span>
          </div>
          <Slider value={[rating]} min={0} max={10} step={0.5} onValueChange={(v) => setRating(v[0])} />
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <div>
          <Label className="text-sm">Mark as favorite</Label>
          <p className="text-xs text-muted-foreground">Show in your Favorites collection</p>
        </div>
        <Switch checked={favorite} onCheckedChange={setFavorite} />
      </div>

      <Button type="submit" className="w-full rounded-xl py-6 text-base font-semibold">
        {submitLabel}
      </Button>
    </form>
  );
}
