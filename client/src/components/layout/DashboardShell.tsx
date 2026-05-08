import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DashboardRoute = "home" | "projects" | "wipgo" | "ai-chat";

type DashboardShellProps = {
  activeRoute: DashboardRoute;
  children: ReactNode;
};

const NAV_ITEMS: Array<{ key: DashboardRoute; label: string; href: string }> = [
  { key: "home", label: "Heatmap", href: "#/" },
  { key: "projects", label: "Projects", href: "#/projects" },
  { key: "wipgo", label: "WIPGO", href: "#/wipgo" },
  { key: "ai-chat", label: "AI Chat", href: "#/ai-chat" },
];

export function DashboardShell({ activeRoute, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,236,244,0.95),_rgba(255,255,255,1)_40%),linear-gradient(180deg,_#fff9fb_0%,_#fdfcf8_55%,_#f6fbff_100%)] text-slate-700">
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top_left,_rgba(255,189,214,0.35),_transparent_50%),radial-gradient(circle_at_top_right,_rgba(189,232,255,0.32),_transparent_45%)]" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="rounded-[2rem] border border-white/70 px-5 py-6 shadow-[0_20px_60px_rgba(233,162,187,0.14)] backdrop-blur-md sm:px-8">
            <div className="flex flex-col">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl text-left z-10">
                  <h1 className="bg-gradient-to-r p-4 from-rose-400 via-pink-500 to-sky-400 bg-clip-text text-4xl leading-none text-transparent sm:text-6xl">
                    StitchLog
                  </h1>
                </div>

                <nav className="flex flex-nowrap z-10 items-center justify-center gap-2 overflow-x-auto p-1 sm:gap-3">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5",
                      activeRoute === item.key
                        ? "bg-white text-rose-500"
                        : "text-slate-500 hover:bg-white/70 hover:text-rose-400"
                    )}
                  >
                    {item.label}
                  </a>
                ))}
                </nav>
              </div>

              
            </div>
          </header>

          <main className="mt-8 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
