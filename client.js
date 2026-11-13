/* Usability tweaks for the default DeepSeek Harness Web UI.
 *
 * Two independent fixes live here because they are both "the shipped shell is
 * hard to reach in this browser" problems and each is a dozen lines of client
 * code with no host half:
 *
 *  1. Fullscreen handle — phones and tablets lose a large part of the viewport
 *     to browser chrome, so a slim handle on the right edge enters or leaves
 *     document fullscreen with one tap.
 *  2. Workspace row actions — the workspace browser renders a "new session"
 *     button on every project row but hides the whole action group until the
 *     row is hovered. Keyboard hint browsers only see rendered and visible
 *     elements, so with Vimium the button does not exist until the pointer
 *     lands on the row.
 *
 * Each fix owns its own CSS and its own apply step, so either can be dropped
 * without touching the other. Only React from the browser module table is
 * required: no Harness Client package is imported and every class name is
 * scoped (`dsh-fs-*` for the handle) or selector-anchored on the row's own
 * `data-row-key`.
 */

window.__ModuleLoader__.load({
  id: '@local/dsh-ui-tweaks',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useRef, useState } = React;

    const NS = 'ui-tweaks';

    const ZH = {
      enter: '进入全屏',
      exit: '退出全屏',
      unsupported: '这个浏览器不支持网页全屏，可以使用浏览器菜单里的全屏，或把 DSH 添加到主屏幕。',
      denied: '浏览器没有允许全屏，请再点一次，或使用浏览器菜单里的全屏。',
    };

    const EN = {
      enter: 'Enter fullscreen',
      exit: 'Exit fullscreen',
      unsupported:
        'This browser cannot make the page fullscreen. Use the browser menu, or add DSH to the home screen.',
      denied: 'The browser did not allow fullscreen. Try again, or use the browser menu.',
    };

    /* ---------------------------------------------------------------- *
     * 1. Fullscreen handle
     * ---------------------------------------------------------------- */

    const FS_CSS = `
.dsh-fs-handle{position:fixed;z-index:4;top:50%;right:env(safe-area-inset-right,0px);transform:translateY(-50%);box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:30px;height:56px;padding:0;border:1px solid var(--dsw-alias-border-l1);border-right:none;border-radius:12px 0 0 12px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-secondary);box-shadow:0 2px 12px rgba(0,0,0,.14);opacity:.62;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:opacity .16s ease,color .16s ease,background .16s ease}
.dsh-fs-handle:hover,.dsh-fs-handle:focus-visible,.dsh-fs-handle[data-active]{opacity:1;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1)}
.dsh-fs-handle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.dsh-fs-handle:active{opacity:1;transform:translateY(-50%) scale(.96)}
.dsh-fs-glyph{display:grid;place-items:center;width:18px;height:18px;pointer-events:none}
.dsh-fs-hint{position:fixed;z-index:4;top:50%;right:calc(44px + env(safe-area-inset-right,0px));transform:translateY(-50%);box-sizing:border-box;max-width:min(260px,64vw);padding:9px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);font-size:12px;line-height:1.55;box-shadow:0 10px 30px rgba(0,0,0,.18);pointer-events:none}
@media (prefers-reduced-motion:reduce){.dsh-fs-handle{transition:none}}
`;

    function fullscreenElement() {
      if (typeof document === 'undefined') return null;
      return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement ||
        null
      );
    }

    /** The enter call of whichever prefixed Fullscreen API this browser ships. */
    function requestFullscreen() {
      const element = document.documentElement;
      if (element === null || element === undefined) return null;
      const call = element.requestFullscreen || element.webkitRequestFullscreen || element.msRequestFullscreen;
      if (typeof call !== 'function') return null;
      return () => call.call(element, { navigationUI: 'hide' });
    }

    function exitFullscreenCall() {
      const call = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      return typeof call === 'function' ? call.bind(document) : null;
    }

    function glyph(active) {
      const corners = active
        ? ['M2.5 6.5h4v-4', 'M13.5 6.5h-4v-4', 'M2.5 9.5h4v4', 'M13.5 9.5h-4v4']
        : ['M2.5 6.5v-4h4', 'M13.5 6.5v-4h-4', 'M2.5 9.5v4h4', 'M13.5 9.5v4h-4'];
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: 16,
          height: 16,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        corners.map((d) => h('path', { key: d, d })),
      );
    }

    function FullscreenToggle(props) {
      const tr = typeof props.t === 'function' ? props.t : (key) => key;
      const [active, setActive] = useState(() => fullscreenElement() !== null);
      const [hint, setHint] = useState(null);
      const hintTimer = useRef(0);

      useEffect(() => {
        const sync = () => setActive(fullscreenElement() !== null);
        document.addEventListener('fullscreenchange', sync);
        document.addEventListener('webkitfullscreenchange', sync);
        document.addEventListener('MSFullscreenChange', sync);
        return () => {
          document.removeEventListener('fullscreenchange', sync);
          document.removeEventListener('webkitfullscreenchange', sync);
          document.removeEventListener('MSFullscreenChange', sync);
        };
      }, []);

      useEffect(
        () => () => {
          if (hintTimer.current) window.clearTimeout(hintTimer.current);
        },
        [],
      );

      const showHint = useCallback((message) => {
        if (!message) return;
        setHint(message);
        if (hintTimer.current) window.clearTimeout(hintTimer.current);
        hintTimer.current = window.setTimeout(() => {
          hintTimer.current = 0;
          setHint(null);
        }, 3800);
      }, []);

      const press = useCallback(() => {
        /* Already fullscreen (ours or a video's): this handle leaves it. */
        if (fullscreenElement() !== null) {
          const leave = exitFullscreenCall();
          if (leave === null) return;
          try {
            const result = leave();
            if (result && typeof result.catch === 'function') result.catch(() => {});
          } catch {
            /* The browser already left fullscreen; the change event syncs the icon. */
          }
          return;
        }
        const enter = requestFullscreen();
        if (enter === null) {
          showHint(tr('unsupported'));
          return;
        }
        try {
          const result = enter();
          if (result && typeof result.then === 'function') {
            result.then(
              () => setActive(fullscreenElement() !== null),
              () => {
                setActive(fullscreenElement() !== null);
                showHint(tr('denied'));
              },
            );
          }
        } catch {
          showHint(tr('denied'));
        }
      }, [showHint, tr]);

      const label = active ? tr('exit') : tr('enter');

      return h(
        React.Fragment,
        null,
        h('style', { key: 'styles' }, FS_CSS),
        h(
          'button',
          {
            key: 'handle',
            type: 'button',
            className: 'dsh-fs-handle',
            'data-active': active ? '' : undefined,
            'aria-label': label,
            title: label,
            onClick: press,
          },
          h('span', { className: 'dsh-fs-glyph' }, glyph(active)),
        ),
        hint === null ? null : h('div', { key: 'hint', className: 'dsh-fs-hint', role: 'status' }, hint),
      );
    }

    function applyFullscreen(ctx) {
      ctx.slots.inject('shell.overlay', () =>
        ctx.slots.register(
          {
            name: 'shell.overlay',
            id: 'ui-tweaks-fullscreen',
            order: 10,
            locale: NS,
          },
          FullscreenToggle,
        ),
      );
    }

    /* ---------------------------------------------------------------- *
     * 2. Workspace row actions
     * ---------------------------------------------------------------- */

    /* Selectors deliberately avoid the bundle's hashed class names: the row is
     * identified by its `data-row-key`, the action group by the stable
     * `_rowActions` class suffix, and the menu trigger by ARIA. The
     * declarations are `!important` because they override a shipped
     * stylesheet. The menu trigger keeps its hover behaviour so the row does
     * not turn into a row of two buttons. */
    const ROW_CSS = `
@media (hover: hover) {
  [data-row-key^="workspace:"] [class*="_rowActions"] { display: inline-flex !important; }
  [data-row-key^="workspace:"] [class*="_rowActions"] > button[aria-haspopup="menu"] { display: none !important; }
  [data-row-key^="workspace:"]:hover [class*="_rowActions"] > button[aria-haspopup="menu"],
  [data-row-key^="workspace:"] [class*="_rowActions"] > button[aria-haspopup="menu"][aria-expanded="true"],
  [data-row-key^="workspace:"] [class*="_rowActions"] > button[aria-haspopup="menu"]:focus-visible { display: inline-flex !important; }
}
`;

    function applyRowActions(ctx) {
      ctx.effect(() => {
        const style = document.createElement('style');
        style.dataset.dshPlugin = '@local/dsh-ui-tweaks';
        style.textContent = ROW_CSS;
        document.head.appendChild(style);
        return () => {
          style.remove();
        };
      }, 'ui-tweaks: workspace row actions');
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh: ZH, en: EN }), 'ui-tweaks: dictionaries');
        applyFullscreen(ctx);
        applyRowActions(ctx);
      },
    };
  },
});
