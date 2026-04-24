import Link from "next/link";
import type { ReactNode } from "react";
import { withSeason } from "../lib/season-links";
import SeasonSelector from "./SeasonSelector";

type StatsSection = "overview" | "players" | "tournaments";

type StatsPageShellProps = {
  title: ReactNode
  activeSection: StatsSection
  children: ReactNode
  season?: string
  subtitle?: ReactNode
  showSeasonSelector?: boolean
}

const SECTION_LINKS: Array<{ id: StatsSection; label: string; href: string }> = [
  { id: "overview", label: "Prehľad", href: "/" },
  { id: "players", label: "Hráči", href: "/players" },
  { id: "tournaments", label: "Turnaje", href: "/stats/tournaments" },
];

function linkClasses(active: boolean) {
  return active
    ? "rounded-md bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-300 ring-1 ring-sky-500/30"
    : "rounded-md px-3 py-2 text-sm font-semibold text-gray-400 transition-colors hover:bg-white/5 hover:text-sky-400";
}

export default function StatsPageShell({
  title,
  activeSection,
  children,
  season,
  subtitle,
  showSeasonSelector = Boolean(season),
}: StatsPageShellProps) {
  return (
    <div className="w-full min-h-screen bg-gray-900 text-gray-300">
      <header className="sticky top-0 z-40 w-full border-b border-gray-700 bg-gray-900/70 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                Relax Darts Cup
              </div>
              <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-gray-400">{subtitle}</p> : null}
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <nav className="text-sm leading-6">
                <ul className="flex flex-wrap gap-2">
                  {SECTION_LINKS.map((link) => (
                    <li key={link.id}>
                      <Link
                        className={linkClasses(activeSection === link.id)}
                        href={withSeason(link.href, season)}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {showSeasonSelector && season ? <SeasonSelector season={season} /> : null}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
