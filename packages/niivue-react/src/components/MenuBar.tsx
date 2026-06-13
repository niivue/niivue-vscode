import { ComponentChildren } from 'preact'
import { Signal, computed, useSignal } from '@preact/signals'
import { useLayoutEffect, useRef } from 'preact/hooks'
import { MenuButton, MenuEntry, MenuItem, MenuToggle, ToggleEntry, activeMenu } from './MenuElements'

// One top-level entry of the menu bar. The same descriptor renders either as a
// horizontal control in the bar (delegating to the existing menu primitives) or,
// when it doesn't fit, as a row inside the "More" overflow popover.
export type BarItem = {
  key: string
  type: 'button' | 'menu' | 'toggle'
  label: string
  visible: boolean
  onClick?: () => void
  shortcut?: string
  state?: Signal<boolean>
  children?: ComponentChildren
}

// activeMenu key reserved for the overflow popover.
const MORE_KEY = '__more__'

// Adaptive top bar. Shows as many top-level items as fit the available width and
// collapses the remainder into a trailing "More" menu (the "priority+" pattern).
// A hidden measurer holds a proxy of every visible item plus the More button so
// widths stay stable regardless of the current split, which avoids the
// show/hide oscillation a naive overflow detector would suffer from.
export const MenuBar = ({ items }: { items: BarItem[] }) => {
  const visible = items.filter((i) => i.visible)
  const rowRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  // How many leading items render in the bar. Starts optimistic (all of them);
  // the layout effect below corrects it before the browser paints.
  const count = useSignal(visible.length)

  // Re-measure whenever the set of visible items changes.
  const signature = visible.map((i) => i.key).join('|')

  useLayoutEffect(() => {
    const row = rowRef.current
    const measure = measureRef.current
    if (!row || !measure) return

    const recompute = () => {
      const avail = row.clientWidth
      // A zero-width container means the bar isn't laid out yet (hidden parent,
      // transient first paint). Don't collapse everything into "More" on a bogus
      // measurement; leave the current count (initially "show all") until a real
      // width arrives via the ResizeObserver.
      if (avail <= 0) return
      const proxies = Array.from(measure.querySelectorAll('[data-proxy]')) as HTMLElement[]
      const total = proxies.length
      if (total === 0) {
        count.value = 0
        return
      }
      // Right edge of each item within the measurer; includes inter-item gaps
      // because the measurer uses the same flex layout as the real row.
      const rights = proxies.map((p) => p.offsetLeft + p.offsetWidth)
      // Everything fits: no More button needed.
      if (rights[total - 1] <= avail) {
        count.value = total
        return
      }
      const gap = parseFloat(getComputedStyle(measure).columnGap || '0') || 0
      const moreW = (moreRef.current?.offsetWidth ?? 0) + gap
      let fit = 0
      for (let i = 0; i < total; i++) {
        // 1px buffer guards against sub-pixel rounding clipping the last item.
        if (rights[i] + moreW <= avail - 1) fit = i + 1
        else break
      }
      count.value = fit
    }

    recompute()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(recompute)
    ro.observe(row)
    return () => ro.disconnect()
  }, [signature])

  const shownCount = Math.min(count.value, visible.length)
  const shown = visible.slice(0, shownCount)
  const overflow = visible.slice(shownCount)

  return (
    <div className="nv-bar">
      {/* Hidden measurer: every visible item plus the More button, laid out at
          natural width so we can read each item's footprint. */}
      <div className="nv-bar-row nv-bar-measure" ref={measureRef} aria-hidden="true">
        {visible.map((it) => (
          <ProxyForm key={it.key} item={it} />
        ))}
        <div className="relative" data-more-proxy ref={moreRef}>
          <button className="nv-topbtn nv-more-toggle" tabIndex={-1}>
            <MoreIcon />
          </button>
        </div>
      </div>

      {/* Real, interactive row. */}
      <div className="nv-bar-row" ref={rowRef}>
        {shown.map((it) => (
          <BarForm key={it.key} item={it} />
        ))}
        {overflow.length > 0 && <OverflowMenu items={overflow} />}
      </div>
    </div>
  )
}

// In-bar rendering: delegate to the existing primitives so behaviour, testids
// and styling of visible items are untouched.
const BarForm = ({ item }: { item: BarItem }) => {
  if (item.type === 'button') {
    return <MenuButton label={item.label} onClick={item.onClick!} shortcut={item.shortcut} />
  }
  if (item.type === 'toggle') {
    return <MenuToggle label={item.label} state={item.state} shortcut={item.shortcut} />
  }
  return (
    <MenuItem label={item.label} onClick={item.onClick} shortcut={item.shortcut}>
      {item.children}
    </MenuItem>
  )
}

// Zero-behaviour clone used only for width measurement. Mirrors the footprint of
// BarForm (a menu is a label button + caret button; others a single button)
// without flyouts, handlers or testids.
const ProxyForm = ({ item }: { item: BarItem }) => {
  if (item.type === 'menu') {
    return (
      <div className="relative" data-proxy>
        <button className="nv-topbtn" tabIndex={-1}>
          {item.label}
        </button>
        <button className="nv-topbtn" tabIndex={-1}>
          <Caret />
        </button>
      </div>
    )
  }
  return (
    <div className="relative" data-proxy>
      <button className="nv-topbtn" tabIndex={-1}>
        {item.label}
      </button>
    </div>
  )
}

// The trailing "More" control. Opening it is wired through the shared activeMenu
// signal and the `.group` wrapper, so the existing click-outside / Escape
// handlers in MenuElements close it for free.
const OverflowMenu = ({ items }: { items: BarItem[] }) => {
  const open = computed(() => activeMenu.value === MORE_KEY)
  const expanded = useSignal<string | null>(null)

  return (
    <div className="relative group">
      <button
        className={`nv-topbtn nv-more-toggle${open.value ? ' is-active' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          const next = open.value ? null : MORE_KEY
          activeMenu.value = next
          if (!next) expanded.value = null
        }}
        title="More"
        aria-label="More tools"
        aria-haspopup="true"
        aria-expanded={open.value}
        data-testid="menu-overflow"
      >
        <MoreIcon />
      </button>
      {open.value && (
        <div className="nv-menu-panel nv-more-panel absolute right-0 z-50">
          {items.map((it) => (
            <OverflowRow key={it.key} item={it} expanded={expanded} />
          ))}
        </div>
      )}
    </div>
  )
}

// One row inside the More popover. Plain actions and toggles reuse the existing
// menu-entry primitives; a dropdown collapses to an inline accordion that
// expands its entries in place (robust on the narrow widths that trigger
// overflow, where a side flyout would clip).
const OverflowRow = ({ item, expanded }: { item: BarItem; expanded: Signal<string | null> }) => {
  if (item.type === 'toggle') {
    return <ToggleEntry label={item.label} state={item.state} shortcut={item.shortcut} />
  }
  if (item.type === 'button') {
    return <MenuEntry label={item.label} onClick={item.onClick} shortcut={item.shortcut} />
  }
  const isExpanded = computed(() => expanded.value === item.key)
  return (
    <div className="nv-more-group">
      <button
        className={`nv-menu-item nv-more-group-header${isExpanded.value ? ' is-active' : ''}`}
        onClick={() => (expanded.value = isExpanded.value ? null : item.key)}
        aria-expanded={isExpanded.value}
        data-testid={`menu-overflow-group-${item.label}`}
      >
        <span>{item.label}</span>
        <Caret className={`nv-more-caret${isExpanded.value ? ' is-open' : ''}`} />
      </button>
      {isExpanded.value && <div className="nv-more-sub">{item.children}</div>}
    </div>
  )
}

const MoreIcon = () => (
  <svg
    className="w-4 h-4"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="4" cy="10" r="1.7" />
    <circle cx="10" cy="10" r="1.7" />
    <circle cx="16" cy="10" r="1.7" />
  </svg>
)

const Caret = ({ className }: { className?: string }) => (
  <svg
    className={`w-2.5 h-2.5 ms-1 ${className ?? ''}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 10 6"
    aria-hidden="true"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="m1 1 4 4 4-4"
    />
  </svg>
)
