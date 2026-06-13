---
"@niivue/react": patch
---

Visual refresh (stage 1): dark design-token palette wired through `tailwind.config.js`, restyled top menu bar and volume tile chrome. Adds `@fontsource/inter` and `@fontsource/jetbrains-mono`. Existing gray/blue Tailwind utilities continue to work; new utilities (`bg-bg-3`, `text-fg-1`, `text-accent`, `font-ui`, `font-mono`) are available for incremental adoption.

The top menu bar is now adaptive: instead of wrapping to a second line when horizontal space runs out, items that no longer fit collapse into a trailing "More" (overflow) menu. The bar measures the available width and keeps as many top-level menus visible as fit; a collapsed dropdown expands inline inside the overflow popover. This keeps the bar on a single row from wide desktops down to narrow VS Code and Streamlit embeds.

Component styles (design tokens, top-bar and tile chrome) are now imported directly by the components that use them instead of only through the package's `index.css` barrel. A bare side-effect import of that barrel was tree-shaken out of consumers' production bundles, so the refreshed chrome rendered in dev but not in production builds; co-locating the CSS with its component ships it reliably everywhere.
