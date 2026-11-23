import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, LayoutGrid, List } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { MovieCard, EmptyState } from "@/components/MovieCard";
import { useMovies } from "@/lib/movies-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/favorites")({
  component: FavPage,
  head: () => ({
    meta: [
      { title: "Favorite Movies · CineJournal" },
      { name: "description", content: "Your all-time favorite cinema masterworks." },
      { property: "og:title", content: "Favorite Movies · CineJournal" },
      { property: "og:description", content: "Your all-time favorite films." },
    ],
  }),
});

function FavPage() {
  const { movies } = useMovies();
  const [viewMode, setViewMode] = useState<"grid" | "row">("grid");
  const list = movies.filter((m) => m.favorite);

  return (
    <AppShell>
      <PageHeader
        title="Favorite Cinema"
        subtitle={`${list.length} beloved masterworks in your private collection`}
        right={
          list.length > 0 && (
            <div className="flex items-center gap-1 rounded-xl bg-card p-1 border border-white/10">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-lg ${
                  viewMode === "grid"
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-white"
                }`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-lg ${
                  viewMode === "row"
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-white"
                }`}
                onClick={() => setViewMode("row")}
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )
        }
      />

      {list.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          hint="Tap the heart icon on any movie card or detail page to add it to your beloved cinema collection."
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4">
          {list.map((m) => (
            <MovieCard key={m.id} movie={m} variant="grid" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((m) => (
            <MovieCard key={m.id} movie={m} variant="row" />
          ))}
        </div>
      )}
    </AppShell>
  );
}
