import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { MovieCard, EmptyState } from "@/components/MovieCard";
import { useMovies } from "@/lib/movies-store";

export const Route = createFileRoute("/favorites")({ component: FavPage });

function FavPage() {
  const { movies } = useMovies();
  const list = movies.filter((m) => m.favorite);
  return (
    <AppShell>
      <PageHeader title="Favorites" subtitle={`${list.length} beloved films`} />
      {list.length === 0 ? (
        <EmptyState icon={Heart} title="No favorites yet" hint="Tap the heart on a movie to add it here." />
      ) : (
        <div className="space-y-3">{list.map((m) => <MovieCard key={m.id} movie={m} />)}</div>
      )}
    </AppShell>
  );
}
