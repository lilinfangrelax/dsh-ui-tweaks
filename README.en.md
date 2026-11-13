# dsh-ui-tweaks

[中文](README.md) | English

Two small usability tweaks for the default DeepSeek Harness Web UI, shipped as one bundle plugin.

The tweaks are independent: each has its own CSS and logic, and either can be removed without affecting the other.

## What it changes

### 1. Floating fullscreen handle

On phones, the browser chrome eats a large part of the viewport. The stock UI has no fullscreen entry, so you have to dig through browser menus.

This plugin places a thin handle on the right edge, vertically centered. Tap once to enter page fullscreen, tap again to exit.

- Supports `requestFullscreen` and the `webkit` / `ms` prefixed variants
- Button state tracks `fullscreenchange`, including fullscreen started by video or other external code
- If the browser rejects or does not support fullscreen, a short tip appears to the left of the handle for 3.8 seconds
- Browser-layer only: layout, input, and drawers are untouched

### 2. Always-visible workspace “new session” button

Each workspace row in the sidebar has a “new session” control, but upstream hides the whole action group with `display:none` until the row is hovered.

Keyboard-hint browsers such as Vimium only hint elements that are already rendered and visible, so “press f, pick a project, open a session under it” does not work. You fall back to the top-level “new session” and land in the current project instead.

This plugin:

- Keeps the “new session” button always visible (no hover required)
- Leaves the three-dot menu on the original hover behavior (`:hover`, `aria-expanded=true`, `:focus-visible`) so two buttons do not crowd the row

## Install

```sh
dsh plugin --profile web add github:lilinfangrelax/dsh-ui-tweaks
```

Package name and repository are both `dsh-ui-tweaks` (plugin id remains `ui-tweaks`).

Or clone first and install from a local path:

```sh
git clone https://github.com/lilinfangrelax/dsh-ui-tweaks.git
dsh plugin --profile web add file:/path/to/dsh-ui-tweaks
```

Restart the Web UI after install or upgrade.

Uninstall:

```sh
dsh plugin --profile web remove dsh-ui-tweaks
```

## How it works

Both tweaks run on the Client; host `index.js` is a no-op.

**Fullscreen handle** registers a React component on the `shell.overlay` slot via `ctx.slots.register`. Class names are prefixed with `dsh-fs-`; colors use `--dsw-alias-*` theme tokens so light/dark themes are followed.

**Row actions** inject a `<style>` element that:

- Targets rows with stable `data-row-key^="workspace:"`, action groups by the `_rowActions` class suffix, and the menu button by ARIA — no hashed upstream class names
- Uses `!important` because it overrides a published stylesheet
- Sets `data-dsh-plugin="dsh-ui-tweaks"` so the style is removed with the `ctx.effect` cleanup on uninstall

## Known limits

Row-action overrides live under `@media (hover: hover)` — they only apply on devices that can express hover; touch keeps upstream show/hide behavior.

Both tweaks depend on stable upstream identifiers (`shell.overlay`, `data-row-key`, `_rowActions`, `aria-haspopup="menu"`). If upstream changes those, the plugin fails quietly and needs a follow-up.

If upstream ships a proper accessible entry for row actions, that half of the plugin can be deleted.
