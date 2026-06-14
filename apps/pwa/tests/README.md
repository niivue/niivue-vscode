# PWA end-to-end tests (Playwright)

These specs are a **thin smoke layer** over wiring and DOM geometry. Exhaustive
correctness (layout/tile math, utilities, reducers) lives in the package unit
tests (`packages/niivue-react/src/test/**`, Vitest) - keep it there. An e2e test
should assert that things are *wired up* (a load reaches a canvas, a setting
drives a computed style, a shortcut flips a signal), never re-prove math and
never read pixels.

## What belongs in an e2e test (vs a unit test)

**Default to a unit test. Reach for e2e only when the integration *is* the thing
under test** - something a unit test cannot exercise without mocking away the very
part that could break. e2e is the slowest, flakiest, most expensive layer (real
browser, software WebGL, serial); spend it only where it earns its keep.

Keep in **e2e** (real browser genuinely required):

- A real image/DICOM/mesh load decodes and reaches a `<canvas>` (the load
  pipeline + GL attach).
- DOM geometry that depends on real layout/CSS - tiles fit their container, menus
  overflow at a real viewport width.
- Cross-component wiring through the real `postMessage` bus + signals - e.g. 4D
  frame sync across two real niivue instances.

Push to a **unit test** (`packages/niivue-react/src/test/**`):

- Pure functions / math - layout sizing (already there), DICOM magic-byte
  sniffing, filename classification, URL-param parsing.
- A handler/reducer mapping an input to a state change - e.g. "key `v` advances
  `sliceType`" is logic on the keydown handler, not something that needs a real
  GPU load to verify.
- Settings reducers, image reordering, document round-trip serialization.

**Smell test:** if a spec loads a real image only to then assert a *pure-logic*
outcome (a key flips a signal, a filename is classified, a count is computed), the
logic belongs in a unit test - only the "a real load reaches a canvas" part, if
any, stays in e2e. (Today `keyboard-shortcuts.spec.ts` is the clearest example: it
pays for a real WebGL load per test to assert handler logic that a component test
could cover far faster.)

## Why the suite is built the way it is

The suite used to fail on CI under load - on **timeouts, not assertions**. Two
things caused that, and both are now designed out:

1. **Time was the correctness signal.** A 5 s `actionTimeout` / 30 s test
   timeout / 5 min suite-wide `globalTimeout` decided pass/fail. On CI the e2e
   job runs on **software WebGL** (ANGLE/SwiftShader, CPU-bound, synchronous
   `gl.finish()`); with two parallel workers, a heavy render in one worker
   starves the other, and a *correct* test times out.
2. **Fixed sleeps.** ~29 `page.waitForTimeout(...)` calls waited a guessed number
   of ms and hoped state had settled.

> **Myth, busted:** niivue does **not** run a continuous `requestAnimationFrame`
> render loop. The installed `@niivue/niivue@0.68.2` bundle has exactly three
> `requestAnimationFrame` calls - two coalesce resize events, one yields a frame
> during volume-chunk streaming. Rendering is **on-demand** (`drawScene()` gated
> by `isBusy`/`needsRefresh`); an **idle canvas burns ~0 CPU**. So there is no
> idle loop to "quiet" under a test flag - don't add one. The cost is per
> *render* (load, resize, settings change, interaction) on software WebGL, not a
> background loop.

## The two design rules

### 1. Pass/fail must be time-independent

- **Wait on app state, never on a clock.** Use web-first assertions
  (`expect(locator).toHaveText(...)`, `.toBeVisible()`) and `expect.poll(...)`
  for non-DOM state (e.g. reading a signal via `page.evaluate`). They retry until
  true or until a *generous* failsafe fires.
- **`waitForTimeout` is banned**, with one documented exception: verifying the
  *absence* of a change in a timer-driven feature (4D cine "paused" - see
  `4d-navigation.spec.ts`), which no state wait can express.
- Timeouts in `playwright.config.ts` are **failsafes, set generously** (60 s
  test, 15 s action, 30 s nav, no `globalTimeout`). They bound a genuine hang;
  they are not happy-path budgets. Image loads wait on
  `window.__niivue.loadedCount` via `waitForImageLoad` (`utils.ts`).
- CSS transitions/animations are force-disabled and `prefers-reduced-motion` is
  emulated in `fixtures.ts`, so visibility/layout assertions never race
  animation timing.

Because correctness no longer depends on timing, contention affects only
*speed*, not pass/fail. (At extreme oversubscription on software WebGL - say
`--workers=4` - a single real load can still exceed even a generous failsafe;
that is a *throughput* limit, not a correctness one, and is exactly what the
serial heavy lane below prevents on CI.)

### 2. The heavy lane is bounded (defense in depth)

Almost every spec loads WebGL content, so we route by **`@dom` default-deny**:

- Tag a test `{ tag: '@dom' }` **only if it does no WebGL/image load** (pure DOM,
  e.g. menu overflow geometry). Today that's three tests in `Menu.spec.ts` /
  `MenuOverflow.spec.ts`.
- **Everything else is WebGL by default.** A new or untagged spec is therefore
  fail-safe: it runs in the serial lane, not the flaky parallel one. New heavy
  specs (e.g. the layout smoke test from the tile-spacing PR) need no tag.

Two lanes share **one** build:

| Lane  | Command (`apps/pwa`)                                     | Concurrency |
| ----- | ------------------------------------------------------- | ----------- |
| fast  | `pnpm test:e2e:fast`  → `playwright test --grep @dom`    | parallel    |
| webgl | `pnpm test:e2e:webgl` → `--grep-invert @dom --workers=1`| **serial**  |

`--workers=1` is the only hard serialization knob in Playwright (worker count is
global; `fullyParallel: false` only serializes *within* a file). The webServer
runs `vite preview` only; `pnpm test:e2e:build` builds once with `--base /` so
both invocations reuse it.

## Running locally

```bash
cd apps/pwa
pnpm test:e2e          # build once, then fast lane + serial webgl lane
pnpm test:e2e:build    # vite build --base / (needed before the lanes below)
pnpm test:e2e:fast     # @dom specs only
pnpm test:e2e:webgl    # everything else, serial
pnpm test:e2e:ui       # Playwright UI (reuses a running `pnpm dev` on :4000)
```

A run with no server first builds, then `vite preview` serves `build/`. If
`pnpm dev` is already on :4000 it is reused (`reuseExistingServer`), so no build
is needed for the UI runner.

## Tuning

If the serial webgl lane's wall-clock ever crowds the CI job's `timeout-minutes`,
raise its concurrency - `playwright test --grep-invert @dom --workers=2`. This is
**safe**: there is no idle render loop, so two on-demand software-WebGL contexts
contend only while actually rendering, and the generous failsafes absorb it. Keep
`--workers=1` as the default for maximum determinism.
