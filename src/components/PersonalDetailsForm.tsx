import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import type { TrackedMovie } from "@/lib/movie-types";

export interface PersonalDetailsValues {
  status: "watchlist" | "watched";
  favorite: boolean;
  personalRating?: number;
  review?: string;
  notes?: string;
  rewatchCount: number;
  watchDate?: string;
}

export function PersonalDetailsForm({
  initial,
  onSubmit,
  submitLabel = "Save changes",
}: {
  initial: TrackedMovie;
  onSubmit: (v: PersonalDetailsValues) => void;
  submitLabel?: string;
}) {
  const [status, setStatus] = useState<"watchlist" | "watched">(initial.status);
  const [favorite, setFavorite] = useState(initial.favorite);
  const [personalRating, setPersonalRating] = useState(initial.personalRating ?? 7);
  const [review, setReview] = useState(initial.review ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [rewatchCount, setRewatchCount] = useState(initial.rewatchCount ?? 0);
  const [watchDate, setWatchDate] = useState(
    initial.watchDate ? initial.watchDate.slice(0, 10) : "",
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          status,
          favorite,
          personalRating: status === "watched" ? personalRating : undefined,
          review: review.trim() || undefined,
          notes: notes.trim() || undefined,
          rewatchCount,
          watchDate:
            status === "watched"
              ? watchDate
                ? new Date(watchDate).toISOString()
                : initial.watchDate ?? new Date().toISOString()
              : undefined,
        });
      }}
      className="space-y-6"
    >
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
        <>
          <div className="rounded-2xl border border-border bg-card p-4 animate-fade-in">
            <div className="mb-3 flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Star className="h-4 w-4 text-gold" />
                Your rating
              </Label>
              <span className="text-lg font-semibold text-gold">{personalRating.toFixed(1)}</span>
            </div>
            <Slider
              value={[personalRating]}
              min={0}
              max={10}
              step={0.5}
              onValueChange={(v) => setPersonalRating(v[0])}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Watch date</Label>
              <Input
                type="date"
                value={watchDate}
                onChange={(e) => setWatchDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Rewatches</Label>
              <Input
                type="number"
                min={0}
                value={rewatchCount}
                onChange={(e) => setRewatchCount(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1"
              />
            </div>
          </div>
        </>
      )}

      <div>
        <Label>Review</Label>
        <Textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={3}
          className="mt-1"
          placeholder="What did you think?"
        />
      </div>

      <div>
        <Label>Private notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1"
          placeholder="Things to remember…"
        />
      </div>

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
