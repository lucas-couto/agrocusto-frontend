# Sidebar + Bottom Nav — Design Doc

**Date:** 2026-04-24
**Status:** Approved, ready for implementation
**Branch:** `main` (no `develop` in this repo)

## Context

Navigation currently lives inline inside `app/page.tsx` (lines ~425-528, within a 1721-line monolith). On mobile it's a left drawer toggled by a hamburger; on desktop it's always visible, gated by an `isDesktop` state computed via a resize `useEffect`.

Goals:
1. Extract navigation into proper components under `components/navigation/`.
2. Replace the mobile drawer with a bottom nav — thumb-reachable primary actions.
3. Preserve the current visual language (agro-green palette, rounded cards, motion animations).

## Scope

**In**
- Extract navigation to `components/navigation/*`.
- Desktop/tablet sidebar (≥768px) — visually identical to current.
- Mobile bottom nav (<768px) with 5 slots: Dashboard, Talhões, Lançar (elevated), Cotações, Mais.
- Mobile "Mais" bottom sheet with Histórico, Relatórios, fazenda selector, trial/subscription, user block.
- Add **Relatórios** as a first-class nav item (previously only reachable by clicking StatCards).
- Keep mobile header (logo only, no hamburger).

**Out**
- Visual redesign (palette, iconography, typography unchanged).
- Collapsible/rail mode on desktop.
- Test infrastructure (deferred to a separate PR — option B).
- Decomposing the rest of the 1721-line `app/page.tsx`.

## Existing contracts preserved (Rule Zero)

- `activeTab` values: `'dashboard' | 'launch' | 'fields' | 'quotes' | 'history' | 'reports'`.
- Trial banner click → `setShowSubscription(true)`.
- Fazenda selector → `setActiveFazendaId(id: number)`.
- Public interfaces in `types.ts` (`Fazenda`, `Usuario`, `Talhao`, etc.).

Internal rename (not exported, safe): `isSidebarOpen` → `isMoreSheetOpen`.

## Architecture

```
components/navigation/
├── nav-config.ts     # NavItem type + 6-item array, single source of truth
├── nav-item.tsx      # Shared button, variants: 'sidebar' | 'bottom'
├── user-footer.tsx   # Trial banner + user block + fazenda dropdown (shared)
├── sidebar.tsx       # Desktop/tablet ≥768px; hidden on mobile via Tailwind
├── bottom-nav.tsx    # Mobile <768px; hidden on desktop via Tailwind
├── more-sheet.tsx    # Mobile bottom sheet triggered by the "Mais" button
└── index.ts          # Barrel export (public surface)
```

CSS handles breakpoint visibility. No more `isDesktop` state or resize effect in `app/page.tsx`.

## Components

### `nav-config.ts` — contract

```ts
import type { LucideIcon } from 'lucide-react';

export type NavSurface = 'sidebar' | 'bottom' | 'more';
export type NavTab = 'dashboard' | 'launch' | 'fields' | 'quotes' | 'history' | 'reports';

export type NavItem = {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly tab: NavTab;
  readonly surfaces: readonly NavSurface[];
};

export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard, tab: 'dashboard', surfaces: ['sidebar', 'bottom'] },
  { id: 'launch',    label: 'Lançar',     icon: PlusCircle,      tab: 'launch',    surfaces: ['sidebar', 'bottom'] },
  { id: 'fields',    label: 'Talhões',    icon: Layers,          tab: 'fields',    surfaces: ['sidebar', 'bottom'] },
  { id: 'quotes',    label: 'Cotações',   icon: TrendingUp,      tab: 'quotes',    surfaces: ['sidebar', 'bottom'] },
  { id: 'history',   label: 'Histórico',  icon: History,         tab: 'history',   surfaces: ['sidebar', 'more'] },
  { id: 'reports',   label: 'Relatórios', icon: BarChart3,       tab: 'reports',   surfaces: ['sidebar', 'more'] },
];
```

### Props contracts

```ts
type NavItemProps = {
  item: NavItem;
  isActive: boolean;
  variant: 'sidebar' | 'bottom';
  onClick: () => void;
};

type SidebarProps = {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  // UserFooter data
  fazendas: Fazenda[];
  activeFazendaId: number;
  onFazendaChange: (id: number) => void;
  isTrial: boolean;
  daysLeft: number;
  onShowSubscription: () => void;
  userName: string; // "João Produtor"
};

type BottomNavProps = {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onMoreClick: () => void;
};

type MoreSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  // UserFooter data (same as Sidebar)
  fazendas: Fazenda[];
  activeFazendaId: number;
  onFazendaChange: (id: number) => void;
  isTrial: boolean;
  daysLeft: number;
  onShowSubscription: () => void;
  userName: string;
};

type UserFooterProps = {
  fazendas: Fazenda[];
  activeFazendaId: number;
  onFazendaChange: (id: number) => void;
  isTrial: boolean;
  daysLeft: number;
  onShowSubscription: () => void;
  userName: string;
};
```

## Visual specs

- **Bottom nav:** fixed bottom-0, h-16, bg-white, border-top slate-100, `pb-[env(safe-area-inset-bottom)]`. 5 slots evenly distributed.
- **Lançar button (center slot):** 56px circle, `bg-agro-green`, `-translate-y-3` (elevated above bar), shadow-xl `shadow-agro-green/40`, white `PlusCircle` icon 28px. Always green (regardless of `activeTab`). Label "Lançar" below in slate-900.
- **Bottom nav active state:** icon + label `agro-green`, font-bold. Inactive: `slate-400`, font-medium.
- **Mais active state:** active whenever `activeTab === 'history' || activeTab === 'reports'`.
- **Label:** 10-11px, tracking-tight, line-height tight.
- **Mobile header:** kept, simplified. Logo + title only, no hamburger. `h-14 bg-agro-green sticky top-0 z-50 md:hidden`.
- **Main content:** `pb-20 md:pb-8` to clear the bottom nav.
- **Desktop sidebar:** pixel-identical to current sidebar. Same colors, same active treatment, same `UserFooter` block. Just adds Relatórios (6th item).
- **MoreSheet:** bottom sheet. `rounded-t-3xl`, backdrop `slate-900/60 backdrop-blur-sm`, slide-up motion via framer-motion. Contains: Histórico link, Relatórios link, `<UserFooter/>` (which includes trial + fazenda + user).

## Data flow

`app/page.tsx` retains ownership:
- `activeTab`, `setActiveTab`
- `activeFazendaId`, `setActiveFazendaId`, `fazendas`
- `isTrial`, `daysLeft`
- `setShowSubscription`
- **New:** `isMoreSheetOpen`, `setIsMoreSheetOpen` (replaces `isSidebarOpen`)

Removed from `app/page.tsx`:
- `isDesktop` state and its resize `useEffect`
- Inline sidebar JSX (~100 lines)
- Mobile hamburger button in the `<header>` (header kept, hamburger removed)

All state flows down via props. No Context, no Zustand.

## Decomposition — Nano Modules (sequential)

| NM | File | Depends on | Acceptance gate |
|----|------|------------|-----------------|
| NM-1 | `components/navigation/nav-config.ts` | — | Type + array compile; icons imported from `lucide-react` |
| NM-2 | `components/navigation/nav-item.tsx` | NM-1 | Both `variant` values render; active state classes correct |
| NM-3 | `components/navigation/user-footer.tsx` | `types.ts` | Renders trial banner, user block, fazenda dropdown; click handlers fire |
| NM-4 | `components/navigation/sidebar.tsx` | NM-1, NM-2, NM-3 | Pixel-identical to current desktop sidebar + adds Relatórios item |
| NM-5 | `components/navigation/bottom-nav.tsx` | NM-1, NM-2 | 5 slots, elevated Lançar, Mais highlights when `activeTab` is history/reports |
| NM-6 | `components/navigation/more-sheet.tsx` | NM-1, NM-2, NM-3 | Sheet opens/closes; lists Histórico + Relatórios; reuses `UserFooter` |
| NM-7 | `app/page.tsx` | NM-4, NM-5, NM-6 | Inline nav removed; new components wired; `pb-20 md:pb-8` on main; hamburger removed from header |
| NM-8 | `components/navigation/index.ts` | all | Barrel export: `Sidebar`, `BottomNav`, `MoreSheet`, `NavItem`, `NAV_ITEMS`, `NavItem` type, `NavTab` type |

## Testing

Deferred to a separate PR (user decision: option B — don't mix infra setup with feature work).

Acceptance for this PR:
- `npm run build` passes.
- `npm run lint` (= `tsc --noEmit`) passes.
- Manual smoke test: all 6 tabs reachable from desktop sidebar; all 4 primary tabs reachable from bottom nav; Mais opens sheet; Histórico/Relatórios reachable from sheet; trial banner opens subscription modal; fazenda selector updates `activeFazendaId` everywhere.

## Implementation notes

- **Branch:** commits go directly to `main`.
- **Commits:** one per NM, Conventional Commits in English (e.g., `feat(nav): add NavItem component`).
- **Final step:** push to `origin/main`; verify `npm run build` before pushing.

## Open questions

None — all decisions locked in above.
