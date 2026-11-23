import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Film } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TmdbSearchPicker } from "@/components/TmdbSearchPicker";

export const Route = createFileRoute("/add")({
  component: AddPage,
  head: () => ({
    meta: [
      { title: "Log a Movie · CineJournal" },
      { name: "description", content: "Search TMDB and add a film to your personal journal." },
      { property: "og:title", content: "Log a Movie · CineJournal" },
      { property: "og:description", content: "Search TMDB and add a film to your journal." },
    ],
  }),
});

function AddPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-white/10 text-muted-foreground hover:text-white transition-all hover:border-primary/40"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <Film className="h-6 w-6 text-primary" />
              Log a Movie
            </h1>
            <p className="text-xs text-muted-foreground">
              Search TMDB to add to your watchlist or review as watched
            </p>
          </div>
        </div>
        <div className="mt-6">
          <TmdbSearchPicker />
        </div>
      </div>
    </AppShell>
  );
}
