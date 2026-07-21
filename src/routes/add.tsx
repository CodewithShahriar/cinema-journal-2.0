import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TmdbSearchPicker } from "@/components/TmdbSearchPicker";

export const Route = createFileRoute("/add")({
  component: AddPage,
  head: () => ({
    meta: [
      { title: "Add a movie · CineJournal" },
      { name: "description", content: "Search TMDB and add a film to your personal journal." },
      { property: "og:title", content: "Add a movie · CineJournal" },
      { property: "og:description", content: "Search TMDB and add a film to your journal." },
    ],
  }),
});

function AddPage() {
  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card ring-1 ring-border"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-semibold">Add a movie</h1>
      </div>
      <TmdbSearchPicker />
    </AppShell>
  );
}
