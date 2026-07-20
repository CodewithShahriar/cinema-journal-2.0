import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { MovieForm } from "@/components/MovieForm";
import { useMovies } from "@/lib/movies-store";

export const Route = createFileRoute("/add")({ component: AddPage });

function AddPage() {
  const { addMovie } = useMovies();
  const navigate = useNavigate();
  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-3">
        <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-card ring-1 ring-border">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-semibold">Add a movie</h1>
      </div>
      <MovieForm
        onSubmit={(v) => {
          const m = addMovie({ ...v, watchDate: v.status === "watched" ? new Date().toISOString() : undefined });
          toast.success(`"${m.title}" added`);
          navigate({ to: v.status === "watched" ? "/watched" : "/watchlist" });
        }}
        submitLabel="Add to journal"
      />
    </AppShell>
  );
}
