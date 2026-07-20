import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Heart, Star, Pencil, Trash2, CheckCircle2, RotateCcw, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PosterFallback } from "@/components/MovieCard";
import { useMovies } from "@/lib/movies-store";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/movie/$id")({ component: MovieDetail });

function MovieDetail() {
  const { id } = Route.useParams();
  const { movies, toggleFavorite, markWatched, moveToWatchlist, deleteMovie } = useMovies();
  const navigate = useNavigate();
  const movie = movies.find((m) => m.id === id);

  if (!movie) {
    return (
      <AppShell>
        <div className="py-20 text-center text-muted-foreground">Movie not found.</div>
      </AppShell>
    );
  }

  return (
    <div className="relative min-h-screen pb-32">
      <div className="relative h-[380px] w-full overflow-hidden">
        {movie.poster ? (
          <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full"><PosterFallback title={movie.title} /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Link to="/" className="glass flex h-10 w-10 items-center justify-center rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <button
            onClick={() => { toggleFavorite(movie.id); toast(movie.favorite ? "Removed from favorites" : "Added to favorites"); }}
            className="glass flex h-10 w-10 items-center justify-center rounded-full"
          >
            <Heart className={`h-4 w-4 ${movie.favorite ? "fill-primary text-primary" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mx-auto -mt-16 w-full max-w-2xl px-4">
        <div className="rounded-3xl bg-card p-6 ring-1 ring-border shadow-xl shadow-black/40 animate-fade-in">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {movie.year && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{movie.year}</span>}
            {movie.runtime && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{movie.runtime}m</span>}
            <span className={`rounded-full px-2 py-0.5 ${movie.status === "watched" ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400"}`}>
              {movie.status === "watched" ? "Watched" : "Watchlist"}
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold leading-tight">{movie.title}</h1>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {movie.genres.map((g) => (
              <span key={g} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">{g}</span>
            ))}
          </div>

          {movie.status === "watched" && movie.rating != null && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-gold/10 p-4">
              <Star className="h-5 w-5 fill-current text-gold" />
              <div className="text-2xl font-bold text-gold">{movie.rating.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">/ 10 · your rating</div>
            </div>
          )}

          {movie.description && (
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overview</h3>
              <p className="text-sm leading-relaxed">{movie.description}</p>
            </div>
          )}

          {movie.note && (
            <div className="mt-6 rounded-2xl border-l-4 border-primary bg-primary/5 p-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Personal note</h3>
              <p className="text-sm italic leading-relaxed">{movie.note}</p>
            </div>
          )}

          {movie.watchDate && (
            <p className="mt-4 text-xs text-muted-foreground">Watched on {new Date(movie.watchDate).toLocaleDateString()}</p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2">
            {movie.status === "watchlist" ? (
              <Button onClick={() => { markWatched(movie.id); toast.success("Marked as watched"); }} className="col-span-2 gradient-primary text-white">
                <CheckCircle2 className="mr-2 h-4 w-4" />Mark as Watched
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => { moveToWatchlist(movie.id); toast("Moved back to watchlist"); }} className="col-span-2">
                <RotateCcw className="mr-2 h-4 w-4" />Move to Watchlist
              </Button>
            )}
            <Link to="/edit/$id" params={{ id: movie.id }}>
              <Button variant="outline" className="w-full"><Pencil className="mr-2 h-4 w-4" />Edit</Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full text-destructive hover:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{movie.title}"?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => { deleteMovie(movie.id); toast.success("Deleted"); navigate({ to: "/" }); }}
                    className="bg-destructive text-destructive-foreground"
                  >Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
