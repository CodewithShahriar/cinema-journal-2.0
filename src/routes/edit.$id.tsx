import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PersonalDetailsForm } from "@/components/PersonalDetailsForm";
import { useMovies } from "@/lib/movies-store";

export const Route = createFileRoute("/edit/$id")({ component: EditPage });

function EditPage() {
  const { id } = Route.useParams();
  const { movies, updateMovie } = useMovies();
  const navigate = useNavigate();
  const movie = movies.find((m) => m.id === id);
  if (!movie) return <AppShell><div className="py-20 text-center">Not found</div></AppShell>;

  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/movie/$id"
          params={{ id }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card ring-1 ring-border"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-semibold">Edit movie</h1>
      </div>
      <PersonalDetailsForm
        initial={movie}
        onSubmit={(v) => {
          updateMovie(id, v);
          toast.success("Updated");
          navigate({ to: "/movie/$id", params: { id } });
        }}
      />
    </AppShell>
  );
}
