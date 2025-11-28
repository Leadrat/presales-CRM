# TailAdmin Next.js Theme Notes

This document summarizes the key theme, layout, and component conventions from the **TailAdmin Next.js** template so we can keep the Pre-Sales app visually consistent.

---

## 1. Foundations

- **Framework**: Next.js App Router + Tailwind CSS v4.
- **Font**: `Outfit, sans-serif` via CSS variable `--font-outfit`.
- **Body base style** (see `globals.css`):
  - `font-outfit`, `font-normal`
  - Light mode background: `bg-gray-50` (from custom gray scale).
  - Dark mode background: `dark:bg-gray-900` in various wrappers.
- **Breakpoints** (CSS vars):
  - `2xsm: 375px`, `xsm: 425px`, `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`, `3xl: 2000px`.

### Color System (CSS Variables)

Defined under `@theme` in `src/app/globals.css`:

- **Brand** (`--color-brand-*`): primary blues.
  - `brand-500: #465FFF` (main primary)
  - Lighter/darker: 25–950 used for backgrounds, borders, states.
- **Grays** (`--color-gray-*`):
  - `gray-50: #F9FAFB` (surface background)
  - `gray-100–900`: text and borders
  - `gray-dark: #1A2231` for dark-mode panels.
- **Semantic scales**: `success-*`, `error-*`, `warning-*`, `orange-*`.
- **Accent**: `theme-pink-500`, `theme-purple-500` for chips/badges.

### Shadows

- `--shadow-theme-xs | sm | md | lg | xl` used for cards, tooltips, modals.
- Generally subtle, multi-layer shadows (e.g. md: 0 4px 8px -2px, 0 2px 4px -2px).

> **Implication for Pre-Sales app**: We should use `brand-500` for primary CTAs and keep text primarily on `gray-700`/`gray-800` with backgrounds in `gray-50`/`gray-100`. Our `globals.css` in the project already mirrors these tokens.

---

## 2. Layout Patterns

### App Shell

- **Body / Page background**: `bg-gray-50`.
- **Main content container**: `mx-auto w-full max-w-6xl` or larger for full dashboards.
- **Spacing**: `px-4/6` + `py-6/8` on page-level wrappers.
- Uses Tailwind grid/flex for layout rather than deeply nested cards.

### Sidebar & Navigation

Utility classes defined in `globals.css`:

- `menu-item`: base for sidebar items.
- `menu-item-active` / `menu-item-inactive`: active state vs hover.
- `menu-item-icon` / `menu-item-icon-active`: icon color.

> **Pattern**: Vertical navigation on the left, light background in light mode, dark overlay in dark mode. Active item uses brand color highlight.

### Auth Layouts (Full-Width Variant)

From `(full-width-pages)/(auth)/layout.tsx` in our app (derived from TailAdmin):

- Two-column auth page:
  - Left: branding panel with logo, tagline, grid shape background.
  - Right: form content (login/signup).
- Classes: `flex lg:flex-row w-full h-screen justify-center flex-col`, with a background shape and dark-mode support.

> For the Pre-Sales app we simplified to a **single centered card on dark background**, but the core typography and color tokens still come from TailAdmin.

---

## 3. Components & Utilities

### Typography

- Titles use custom text scales via CSS vars:
  - `text-title-lg` etc. though in practice Tailwind utilities like `text-2xl`, `text-3xl` are used.
- Supporting text:
  - `text-theme-sm` (14px) and `text-theme-xs` (12px) for metadata and helper copy.

### Common Utilities (from `globals.css`)

- **`menu-*`**: sidebar / dropdown nav items.
- **`no-scrollbar` / `custom-scrollbar`**: hide or customize scrollbars.
- **Third-party integrations**: custom styles for
  - ApexCharts
  - Flatpickr
  - FullCalendar (`.fc-` classes)
  - JSVectormap
- **Tasks / checkboxes**: classes to style custom checkboxes and drag/drop tasks.

> For our Pre-Sales app we mainly reuse:
> - `font-outfit`
> - brand & gray color variables
> - card shadows (`shadow-theme-sm|md|lg`)
> - `custom-scrollbar` and nav utilities where appropriate.

---

## 4. Auth Screens – Design Cues

From TailAdmin’s demos (and mirrored layout in our project):

- Dark background auth variant:
  - Page bg: dark navy (`#050816` / `gray-dark`).
  - Centered card with slightly lighter panel, rounded corners, subtle shadow.
  - Logo + product name (e.g., `Sales Flow CRM Dashboard`) at top.
  - Primary CTA in `brand-500` blue.
- Typography:
  - Small uppercase label for product name.
  - Large `Welcome Back` or `Create Account` headline.
  - Very short one-line subheading.

> We applied this for **Leadrat CRM**:
> - Top label: `Leadrat CRM` (uppercase, tracking).
> - Headline: `Welcome back` / `Create your account`.
> - Subheading: one concise line.

---

## 5. How to Reuse in Pre-Sales App

When building or updating screens:

1. **Font & Base**
   - Always ensure `body` uses `font-outfit` (already configured).
   - Default light pages: `bg-gray-50`; dark variants can use `bg-[#050816]` or `bg-gray-dark`.

2. **Primary Actions**
   - Use `bg-brand-500 hover:bg-brand-600 text-white` for main buttons.
   - Use `border-gray-200 bg-white` for secondary buttons in light mode; `border-gray-700 bg-gray-900` in dark.

3. **Cards**
   - Card container: `rounded-2xl border border-gray-100 bg-white p-6 shadow-theme-sm` (or `md`/`lg` for more depth).

4. **Text Hierarchy**
   - Page title: `text-2xl md:text-3xl font-semibold text-gray-900`.
   - Section titles: `text-base font-semibold text-gray-900`.
   - Helper text: `text-sm text-gray-500`.

5. **Sidebar / Nav**
   - Apply `menu-item` for clickable rows.
   - Use `menu-item-active` for current route, `menu-item-inactive` for others.

6. **Tables**
   - Tables generally use:
     - `min-w-full divide-y divide-gray-200 text-sm`
     - `thead` with `bg-gray-50` and gray-500 headings.
     - `tbody` with `divide-y divide-gray-100 bg-white`.

---

## 6. Summary

- TailAdmin’s theme is defined almost entirely in `src/app/globals.css` via CSS variables and utility layers.
- Our Pre-Sales app already imports this file and therefore inherits **fonts, colors, and many utilities**.
- To keep consistency:
  - Use the **brand/gray color tokens** and **shadow-theme-* utilities**.
  - Structure pages with a **simple container + cards** using TailAdmin’s border/shadow/rounded conventions.
  - For auth and dashboard screens, follow the **dark/light variants and typography hierarchy** shown above.
