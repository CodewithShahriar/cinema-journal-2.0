import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CineWrappedModal } from "@/components/CineWrappedModal";
import { useState } from "react";
import { Sparkles, ArrowLeft, Play, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/wrapped")({
  component: WrappedPage,
  head: () => ({
    meta: [
      { title: "CineWrapped · Your Cinema Year in Review" },
      { name: "description", content: "Interactive annual recap of your movie screening journey." },
    ],
  }),
});

function WrappedPage() {
  const [modalOpen, setModalOpen] = useState(true);

  return (
    <AppShell>
      <div className="py-6 sm:py-10 max-w-2xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/30 px-4 py-1.5 text-xs font-bold text-red-400">
          <Sparkles className="h-4 w-4 animate-spin text-primary" />
          Annual Cinema Recap
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Your Personal <span className="text-primary">CineWrapped</span>
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          Relive your favorite films, discover your cinematic DNA persona, and see your total hours spent in film this year.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => setModalOpen(true)}
            size="lg"
            className="rounded-2xl bg-primary hover:bg-primary/90 text-white font-black px-8 py-6 shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-base"
          >
            <Play className="mr-2 h-5 w-5 fill-white" />
            Launch CineWrapped Experience
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-2xl border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold px-6 py-6"
          >
            <Link to="/stats">
              <BarChart3 className="mr-2 h-5 w-5 text-amber-400" />
              View Full Analytics
            </Link>
          </Button>
        </div>
      </div>

      <CineWrappedModal isOpen={modalOpen} onOpenChange={setModalOpen} />
    </AppShell>
  );
}
