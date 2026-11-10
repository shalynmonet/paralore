import {
  IconAdjustmentsHorizontal,
  IconChartLine,
  IconUser,
  IconUsersGroup,
  type Icon,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router";

import { cn } from "@/lib/utils";

export const DISCLAIMER = "Fictional policy simulation. Illustrative assumptions, not an economic forecast.";

const VIEWS: { to: string; label: string; short: string; icon: Icon }[] = [
  { to: "/", label: "World Dashboard", short: "Dashboard", icon: IconChartLine },
  { to: "/policy-lab", label: "Policy Lab", short: "Policy", icon: IconAdjustmentsHorizontal },
  { to: "/assembly", label: "AI Assembly", short: "Assembly", icon: IconUsersGroup },
  { to: "/citizen", label: "Citizen View", short: "Citizen", icon: IconUser },
];

function linkClass(isActive: boolean, compact: boolean) {
  return cn(
    "flex items-center gap-3 rounded-md text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    compact ? "flex-1 flex-col justify-center px-1 py-2 text-[11px]" : "px-3 py-2.5",
    isActive
      ? "bg-accent text-foreground"
      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
  );
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <NavLink to="/" aria-label="Paralore home" className={cn("block overflow-hidden rounded-md bg-[#faf6eb] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring", compact ? "h-16 w-52" : "h-24 w-full")}>
    <img src="/brand/paralore-logo.jpg" alt="PARALORE" width={2752} height={1536} className="h-full w-full scale-[1.22] object-cover object-center" fetchPriority="high" />
  </NavLink>;
}

export function PostLaborShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full bg-background text-foreground">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-border px-5 py-8 md:flex">
        <div>
          <BrandLogo />
          <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Rebuild Society After Work
          </p>
          <nav aria-label="Views" className="mt-10 flex flex-col gap-1">
            {VIEWS.map((view) => (
              <NavLink key={view.to} to={view.to} end className={({ isActive }) => linkClass(isActive, false)}>
                {({ isActive }) => (
                  <>
                    <view.icon size={18} aria-hidden="true" className={isActive ? "text-primary" : undefined} />
                    <span>{view.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div aria-hidden="true" className="h-14 shrink-0 border-b border-border md:h-20" style={{ backgroundImage: "url('/brand/houndstooth-iridescent.png')", backgroundRepeat: "repeat", backgroundSize: "192px 192px", backgroundPosition: "center" }} />
        <div className="border-b border-border bg-card/60 px-5 py-2 text-center text-xs text-muted-foreground md:px-10">
          <span className="font-medium text-pl-amber">Commonwealth of Aurora.</span> {DISCLAIMER}
        </div>
        <header className="flex items-center justify-between border-b border-border px-5 py-4 md:hidden">
          <BrandLogo compact />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-28 pt-8 md:px-10 md:pb-16 md:pt-12">
          {children}
        </main>
      </div>

      <nav
        aria-label="Views"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {VIEWS.map((view) => (
          <NavLink key={view.to} to={view.to} end className={({ isActive }) => linkClass(isActive, true)}>
            {({ isActive }) => (
              <>
                <view.icon size={20} aria-hidden="true" className={isActive ? "text-primary" : undefined} />
                <span>{view.short}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
