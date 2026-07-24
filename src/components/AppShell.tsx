import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_38%,transparent),transparent_66%)]" />
      <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-32">{children}</div>
      <BottomNav />
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <div className="min-w-0">
        <h1 className="font-display truncate text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
