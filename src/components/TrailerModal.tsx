import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTmdbTrailer } from "@/lib/tmdb";
import { Film, Loader2, Play, ExternalLink } from "lucide-react";

interface TrailerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tmdbId?: number;
  title?: string;
}

export function TrailerModal({
  isOpen,
  onOpenChange,
  tmdbId,
  title = "Movie Trailer",
}: TrailerModalProps) {
  const { data: trailer, isLoading, isError } = useTmdbTrailer(tmdbId ?? 0, isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-full sm:max-w-4xl sm:w-[90vw] p-0 overflow-hidden bg-zinc-950 border-y sm:border border-white/15 text-white shadow-2xl rounded-none sm:rounded-2xl">
        <DialogHeader className="p-3.5 sm:p-5 border-b border-white/10 flex flex-row items-center justify-between gap-3 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950">
          <div className="flex items-center gap-2.5 min-w-0 pr-8">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/30">
              <Film className="h-4 w-4" />
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-base sm:text-lg font-bold text-white truncate tracking-tight text-left">
                {title}
              </DialogTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-red-500 font-semibold flex items-center gap-1">
                  <Play className="h-2.5 w-2.5 fill-red-500" />
                  Official Trailer
                </span>
                {trailer?.name && <span className="truncate hidden sm:inline">• {trailer.name}</span>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium">Fetching official trailer...</p>
            </div>
          ) : trailer?.key ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
              title={`${title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                <Film className="h-6 w-6" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-white">No trailer found on TMDB</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                We couldn't retrieve an official YouTube trailer stream for this title.
              </p>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                  `${title} official trailer`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90"
              >
                Search Trailer on YouTube
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
