# NEXUS — Dark Neural Theme · Implementation Plan

> Build system: Vite + React. Build command: `npm run build` (inside `client/`).
> Dev command: `npm run dev` (inside `client/`).
> No automated test suite — verification is visual build + browser check.

---

## Design Token Reference (used throughout this plan)

```
--nx-bg:      #050508   (root background)
--nx-s1:      #0d0d14   (sidebar / card surface)
--nx-s2:      #12121a   (panels / topbar)
--nx-s3:      #1a1a28   (inputs / hover)
--nx-s4:      #22223a   (deeper hover)
--nx-border:  rgba(255,255,255,0.05)
--nx-border2: rgba(255,255,255,0.10)
--nx-ac:      #6366f1   (primary indigo)
--nx-ac2:     #8b5cf6   (secondary violet)
--nx-pink:    #ec4899
--nx-cyan:    #06b6d4
--nx-green:   #22c55e
--nx-amber:   #f59e0b
--nx-text:    #f1f0ff
--nx-text2:   #7c7a9e
--nx-text3:   #3d3b5c
--nx-grad:    linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)
--nx-glow:    rgba(99,102,241,0.30)
--nx-user-msg:#13133a
--nx-ai-msg:  #0d0d14
--nx-scroll:  #1a1a28
```

Light theme counterparts use white/off-white surfaces with indigo accents — every token is re-declared inside `.theme-light`.

---

## Plan Items

- [ ] 1. **Rewrite CSS variables in `index.css`**
      Replace the current `body { background: #080b12 }` block with NEXUS root tokens.
      Define `--nx-*` custom properties on `:root` (dark defaults).
      Keep `*`, `html/body/#root` reset and `font-family: Inter` rule unchanged.
      Files: `client/src/index.css`
      Verify: `cd client && npm run build` — exits 0, no CSS parse errors.

- [ ] 2. **Rewrite all theme tokens in `App.css` (.theme-dark / .theme-light)**
      Map every existing `--sb`, `--bg`, `--bg2 … --bg4`, `--border`, `--border2`, `--text`, `--text2`, `--text3`, `--ac`, `--ac2`, `--pink`, `--cyan`, `--green`, `--gold`, `--grad`, `--glow`, `--scrollbar`, `--user-msg`, `--ai-msg` to NEXUS values.
      Dark mapping:
        `--sb: #0a0a12`, `--bg: #050508`, `--bg2: #0d0d14`, `--bg3: #12121a`, `--bg4: #1a1a28`
        `--border: rgba(255,255,255,0.05)`, `--border2: rgba(255,255,255,0.10)`
        `--text: #f1f0ff`, `--text2: #7c7a9e`, `--text3: #3d3b5c`
        `--ac: #6366f1`, `--ac2: #8b5cf6`
        `--pink: #ec4899`, `--cyan: #06b6d4`, `--green: #22c55e`, `--gold: #f59e0b`
        `--grad: linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)`
        `--glow: rgba(99,102,241,0.30)`, `--scrollbar: #1a1a28`
        `--user-msg: #13133a`, `--ai-msg: #0d0d14`
      Light mapping:
        `--sb: #ffffff`, `--bg: #f8f7ff`, `--bg2: #ffffff`, `--bg3: #f0effe`, `--bg4: #e8e5fc`
        `--border: rgba(99,102,241,0.07)`, `--border2: rgba(99,102,241,0.15)`
        `--text: #0f0e1a`, `--text2: #5a5880`, `--text3: #b0aec8`
        `--ac: #6366f1`, `--ac2: #8b5cf6`
        `--grad: linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)`
        `--glow: rgba(99,102,241,0.15)`, `--scrollbar: #ddd6f5`
        `--user-msg: #ede9fe`, `--ai-msg: #ffffff`
      Keep ALL existing class names (`.shell`, `.sidebar`, `.main`, `.topbar`, etc.).
      Only change the color/shadow/blur values inside each rule — do not add or remove selectors.
      Files: `client/src/App.css`
      Verify: `npm run build` exits 0; in browser the sidebar/topbar/chat area render with deep-dark navy background and indigo accents.

- [ ] 3. **NEXUS Sidebar reskin in `App.css`**
      Apply these targeted style changes (no class-name changes in JSX needed):

      `.sidebar`:
        `background: #0a0a12`
        `border-right: 1px solid rgba(99,102,241,0.08)`

      `.sidebar::before` (left glow bar):
        `background: linear-gradient(180deg, transparent, rgba(99,102,241,0.9) 30%, rgba(139,92,246,0.7) 60%, transparent)`

      `.sidebar::after` (radial bg glow):
        `background: radial-gradient(ellipse, rgba(99,102,241,0.07), transparent 70%)`

      `.gpt-sb-header`, `.gpt-collapsed-header`:
        `border-bottom: 1px solid rgba(255,255,255,0.04)`

      `.gpt-logo-name b` (gradient text):
        `background: linear-gradient(90deg,#a5b4fc,#c4b5fd,#f472b6)`

      `.gpt-new-chat-btn`:
        `background: linear-gradient(135deg,#6366f1,#8b5cf6)`
        `box-shadow: 0 4px 18px rgba(99,102,241,0.40)`
        `border-radius: 12px`

      `.gpt-nav-item`:
        `color: rgba(124,122,158,0.6)`
        `height: 42px`, `border-radius: 10px`

      `.gpt-nav-active`:
        `background: rgba(99,102,241,0.12) !important`
        `color: #a5b4fc !important`
        `border-left: 3px solid #6366f1`
        `box-shadow: inset 0 0 20px rgba(99,102,241,0.08)`
        Remove the `::after` pill indicator; replace with the left-border glow.

      `.gpt-user-avatar`:
        `background: linear-gradient(135deg,#6366f1,#8b5cf6)`
        `box-shadow: 0 0 0 2px rgba(99,102,241,0.35), 0 3px 12px rgba(99,102,241,0.35)`

      `.theme-light .sidebar`: `background: #fdfdff`

      Files: `client/src/App.css`
      Verify: `npm run build` exits 0.

- [ ] 4. **NEXUS Topbar reskin in `App.css`**
      `.topbar`:
        `background: rgba(10,10,18,0.85)`
        `backdrop-filter: blur(12px)`
        `-webkit-backdrop-filter: blur(12px)`
        `border-bottom: 1px solid rgba(255,255,255,0.05)`
        `height: 56px`

      `.topbar-title > span`:
        `letter-spacing: -0.02em`
        `font-weight: 800`

      `.status-dot`:
        `background: #22c55e`
        `box-shadow: 0 0 6px #22c55e`

      `.topbar-avatar`:
        `background: linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)`
        `border-radius: 10px`
        `box-shadow: 0 2px 10px rgba(99,102,241,0.35)`

      `.topbar-btn:hover`, `.topbar-toggle:hover`:
        `background: rgba(99,102,241,0.1)`
        `color: #a5b4fc`

      Files: `client/src/App.css`
      Verify: `npm run build` exits 0.

- [ ] 5. **NEXUS Chat / Input area reskin in `App.css`**
      Chat message bubbles:
        `.msg-bubble-user`:
          `background: #13133a`
          `border: 1px solid rgba(99,102,241,0.2)`
          `border-radius: 18px 4px 18px 18px`

        `.msg-bubble-ai`:
          `background: rgba(13,13,20,0.9)`
          `border: 1px solid rgba(255,255,255,0.06)`
          `backdrop-filter: blur(10px)`
          Top shimmer `::before`: `background: linear-gradient(90deg,#6366f1,#8b5cf6)`

        `.msg-avatar-user`: `background: var(--grad)`
        `.msg-avatar-ai`: `background: #0d0d14; border: 1px solid rgba(255,255,255,0.08)`

      Typing indicator:
        `.ai-typing span`: `background: #6366f1`

      Input bar (floating glass card):
        `.input-area`:
          `background: transparent`
          `border-top: none`
          `padding: 0 20px 20px`

        `.input-wrap`: `max-width: 860px`

        `.input-bar`:
          `background: rgba(13,13,20,0.8)`
          `backdrop-filter: blur(20px)`
          `border: 1px solid rgba(255,255,255,0.07)`
          `border-radius: 20px`
          `box-shadow: 0 8px 32px rgba(0,0,0,0.3)`

        `.input-bar:focus-within`:
          `border-color: rgba(99,102,241,0.4)`
          `box-shadow: 0 0 0 2px rgba(99,102,241,0.12), 0 8px 32px rgba(0,0,0,0.3)`

        `.send-btn`:
          `background: linear-gradient(135deg,#6366f1,#8b5cf6)`
          `border-radius: 12px`
          `box-shadow: 0 2px 14px rgba(99,102,241,0.45)`

        `.attach-btn:hover`:
          `background: rgba(99,102,241,0.1)`
          `color: #a5b4fc`

        `.attach-menu`:
          `background: rgba(13,13,20,0.95)`
          `backdrop-filter: blur(20px)`
          `border: 1px solid rgba(255,255,255,0.08)`
          `border-radius: 14px`

      AI Loading row:
        `.ai-loading-badge`:
          `background: rgba(99,102,241,0.1)`
          `border: 1px solid rgba(99,102,241,0.2)`
          `color: #a5b4fc`

        `.ai-loading-dots span`: `background: #6366f1`

      Files: `client/src/App.css`
      Verify: `npm run build` exits 0; chat messages visible with correct bubble styling.

- [ ] 6. **NEXUS utility classes + generic card pattern in `App.css`**
      `.card` (generic):
        `background: rgba(255,255,255,0.02)`
        `border: 1px solid rgba(255,255,255,0.06)`
        `border-radius: 16px`
        `backdrop-filter: blur(10px)`

      `.badge-purple`: use `rgba(99,102,241,0.12)` + `rgba(99,102,241,0.28)` + `#a5b4fc`
      `.badge-green`:  use `rgba(34,197,94,0.10)`  + `rgba(34,197,94,0.25)`  + `#86efac`
      `.badge-pink`:   use `rgba(236,72,153,0.10)` + `rgba(236,72,153,0.28)` + `#f9a8d4`
      `.badge-gold`:   use `rgba(245,158,11,0.10)` + `rgba(245,158,11,0.28)` + `#fde68a`

      Profile card (`.profile-card`):
        `background: rgba(255,255,255,0.02)`
        `border: 1px solid rgba(255,255,255,0.06)`
        `backdrop-filter: blur(10px)`

      Files: `client/src/App.css`
      Verify: `npm run build` exits 0.

- [ ] 7. **NEXUS HomeScreen reskin in `HomeScreen.css`**
      Keep ALL existing class names (`.hs-root`, `.hs-aurora`, `.hs-grid-bg`, `.hs-inner`, `.hs-toprow`, `.hs-greeting-card`, `.hs-greeting-pill`, `.hs-live-dot`, `.hs-title`, `.hs-name-grad`, `.hs-subtitle`, `.hs-time-row`, `.hs-clock`, `.hs-date-txt`, `.hs-featured`, `.hs-feat-btn`, `.hs-feat-icon`, `.hs-feat-arrow`, `.hs-tools-hd`, `.hs-hd-icon`, `.hs-badge`, `.hs-tools-grid`, `.hs-tool-card`, `.hs-card-glow`, `.hs-card-icon`, `.hs-card-label`, `.hs-card-desc`, `.hs-card-line`, `.hs-hint-row`, `.hs-hint-inner`, `.hs-kbd-group`).

      Targeted changes:
        `.hs-greeting-card`:
          `background: rgba(255,255,255,0.02)`
          `border: 1px solid rgba(255,255,255,0.06)`
          `backdrop-filter: blur(20px)`
          Decorative `::before` radial: `rgba(99,102,241,0.08)` → `rgba(99,102,241,0.10)`

        `.hs-greeting-pill`:
          `background: rgba(34,197,94,0.08)`
          `border: 1px solid rgba(34,197,94,0.2)`
          `color: #86efac`

        `.hs-name-grad`:
          `background: linear-gradient(90deg,#a5b4fc,#c4b5fd,#f9a8d4)`

        `.hs-clock`:
          `background: linear-gradient(135deg,#a5b4fc,#f472b6)`

        `.hs-feat-btn`:
          `background: rgba(255,255,255,0.02)`
          `border: 1px solid rgba(255,255,255,0.06)`
          `backdrop-filter: blur(10px)`
          Hover: `border-color: color-mix(in srgb,var(--fc,#8b5cf6) 40%,transparent)`

        `.hs-hd-icon`:
          `background: rgba(99,102,241,0.10)`
          `border: 1px solid rgba(99,102,241,0.18)`
          `color: #a5b4fc`

        `.hs-badge`:
          `background: rgba(99,102,241,0.10)`
          `border: 1px solid rgba(99,102,241,0.20)`
          `color: #a5b4fc`

        `.hs-tool-card`:
          `background: rgba(255,255,255,0.02)`
          `border: 1px solid rgba(255,255,255,0.05)`
          `backdrop-filter: blur(10px)`
          Hover: `transform: translateY(-4px)`
          Hover `box-shadow`: `0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px color-mix(in srgb,var(--tc,#8b5cf6) 20%,transparent)`

        `.hs-hint-inner`:
          `background: rgba(99,102,241,0.04)`
          `border: 1px dashed rgba(255,255,255,0.08)`

        `.hs-hint-row kbd`:
          `background: #12121a`
          `border: 1px solid rgba(255,255,255,0.09)`

        Aurora colors: update radial-gradient stops to use `rgba(99,102,241,0.15)`, `rgba(139,92,246,0.10)`, `rgba(6,182,212,0.05)`.

      Files: `client/src/components/HomeScreen.css`
      Verify: `npm run build` exits 0; HomeScreen renders glassmorphism cards, animated gradient name.

- [ ] 8. **NEXUS MessageBubble reskin in `MessageBubble.css`**
      Keep ALL existing class names (`.mb-row`, `.mb-user`, `.mb-ai`, `.mb-avatar`, `.mb-avatar-user`, `.mb-avatar-ai`, `.mb-body`, `.mb-body-user`, `.mb-body-ai`, `.mb-name-row`, `.mb-name`, `.mb-name-ai`, `.mb-ai-badge`, `.mb-time`, `.mb-tokens`, `.mb-copy-msg-btn`, `.mb-bubble`, `.mb-bubble-user`, `.mb-bubble-ai`, `.mb-plain`, `.mb-p`, `.mb-h1`, `.mb-h2`, `.mb-h3`, `.mb-ul`, `.mb-ol`, `.mb-li`, `.mb-strong`, `.mb-em`, `.mb-blockquote`, `.mb-hr`, `.mb-link`, `.mb-inline-code`, `.mb-code-wrap`, `.mb-code-header`, `.mb-code-lang`, `.mb-copy-btn`, `.mb-table-wrap`, `.mb-table`, `.mb-th`, `.mb-td`, `.mb-logo-img`).

      Targeted changes:
        `.mb-bubble-user`:
          `background: #13133a`
          `border: 1px solid rgba(99,102,241,0.22)`
          `box-shadow: 0 4px 20px rgba(99,102,241,0.12)`

        `.mb-bubble-ai`:
          `background: rgba(13,13,20,0.9)`
          `border: 1px solid rgba(255,255,255,0.06)`
          `backdrop-filter: blur(10px)`
          Top shimmer `::before`: color `linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)`, `opacity: 0.6`

        `.mb-avatar-user`:
          `background: linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)`
          `box-shadow: 0 4px 14px rgba(99,102,241,0.30)`

        `.mb-ai-badge`:
          `background: linear-gradient(135deg,#6366f1,#8b5cf6)`

        `.mb-name-ai`: `color: #a5b4fc`

        `.mb-copy-msg-btn:hover`:
          `background: rgba(99,102,241,0.10)`
          `border-color: rgba(99,102,241,0.30)`
          `color: #a5b4fc`

        `.mb-h1`:
          gradient: `linear-gradient(135deg,#6366f1,#8b5cf6)`

        `.mb-h3`: `color: #a5b4fc`

        `.mb-inline-code`:
          `background: rgba(99,102,241,0.12)`
          `border: 1px solid rgba(99,102,241,0.22)`
          `color: #a5b4fc`

        `.mb-li::marker`: `color: #a5b4fc`

        `.mb-blockquote`: `border-left: 3px solid #6366f1`

        `.mb-link`: `color: #a5b4fc`

        `.mb-th`:
          `background: rgba(99,102,241,0.08)`
          `color: #a5b4fc`

        Light theme: keep existing `.theme-light` overrides, update border/bg values to use indigo-tinted whites.

      Files: `client/src/components/MessageBubble.css`
      Verify: `npm run build` exits 0.

- [ ] 9. **NEXUS ChatPopup reskin in `ChatPopup.css`**
      Keep ALL existing class names.
      Primary accent swap: `#6d5dfc` → `#6366f1`, `#00c8ff` → `#06b6d4`.

      Targeted changes:
        `.chat-popup-toggle`:
          `background: linear-gradient(135deg,#6366f1,#8b5cf6)`
          `box-shadow: 0 0 0 4px rgba(99,102,241,0.20), 0 8px 32px rgba(99,102,241,0.45)`

        `.chat-popup-panel`:
          `background: rgba(10,10,18,0.92)`
          `backdrop-filter: blur(24px)`
          `border: 1px solid rgba(99,102,241,0.20)`
          `box-shadow: 0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(99,102,241,0.08)`

        `::before` top accent line:
          `background: linear-gradient(90deg,transparent,#6366f1 30%,#06b6d4 70%,transparent)`

        `.popup-header`:
          `background: linear-gradient(135deg,rgba(99,102,241,0.08),rgba(6,182,212,0.04))`

        `.popup-ai-avatar`:
          `background: linear-gradient(135deg,#6366f1,#8b5cf6)`
          Conic ring: `rgba(99,102,241,0.55)` + `rgba(6,182,212,0.55)`

        `.popup-messages`: `background: rgba(8,8,14,0.95)`

        `.popup-msg-user .popup-msg-bubble`:
          `background: linear-gradient(135deg,#13133a,#0e0e2e)`
          `border: 1px solid rgba(99,102,241,0.30)`

        `.popup-msg-ai .popup-msg-bubble`:
          `background: rgba(13,13,20,0.9)`
          `backdrop-filter: blur(10px)`
          `border-top: 1px solid rgba(99,102,241,0.30)`

        `.popup-input-wrap`:
          `background: rgba(13,13,20,0.9)`
          `backdrop-filter: blur(10px)`
          Focus gradient border: `linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)`

        `.popup-send-btn`:
          `background: linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)`
          `box-shadow: 0 4px 14px rgba(99,102,241,0.42)`

        `.popup-chip`:
          `border: 1px solid rgba(99,102,241,0.28)`
          `background: rgba(99,102,241,0.08)`
          `color: #a5b4fc`

        `.md-inline-code`:
          `background: rgba(99,102,241,0.16)`, `border: rgba(99,102,241,0.26)`, `color: #a5b4fc`

        `.md-code-lang`: `color: #6366f1`
        `.md-ol li::marker`: `color: #a5b4fc`
        `.md-ul li::marker`: `color: #06b6d4`

        `.popup-typing span`:
          `background: linear-gradient(135deg,#6366f1,#8b5cf6)`
          `box-shadow: 0 0 5px rgba(99,102,241,0.45)`

      Light theme overrides: update `#6d5dfc` → `#6366f1`, `#00c8ff` → `#06b6d4` in all light-theme rules.

      Files: `client/src/components/ChatPopup.css`
      Verify: `npm run build` exits 0; popup opens with NEXUS glass styling.

- [ ] 10. **NEXUS Auth page reskin in `Auth.css`**
       Keep ALL existing class names (`.nv-root`, `.nv-bg`, `.nv-shell`, `.nv-left`, `.nv-right`, `.nv-form-card`, `.nv-accent-bar`, `.nv-inp-wrap`, `.nv-btn`, `.nv-tab`, `.nv-role`, etc.).

       Token swap: old `#7c3aed` → `#6366f1`, `#ec4899` → `#ec4899` (same), `#f97316` → `#8b5cf6`.
       Gradient updates:
         `--v-blue: #6366f1`
         `--v-violet: #8b5cf6`
         `--v-grad: linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)`

       Targeted changes:
         `.nv-root { background: #050508 }`

         `.nv-bg`: update radial stops to use `rgba(99,102,241,0.30)`, `rgba(139,92,246,0.20)`, `rgba(6,182,212,0.08)`

         `.nv-shell`:
           `background: rgba(8,8,14,0.85)`
           `backdrop-filter: blur(24px)`
           `border: 1px solid rgba(99,102,241,0.18)`
           `box-shadow: 0 0 0 1px rgba(99,102,241,0.05), 0 40px 100px rgba(0,0,0,0.7), 0 0 80px rgba(99,102,241,0.08)`

         `.nv-left::before`: update to use `rgba(99,102,241,0.35)`, `rgba(139,92,246,0.25)`
         `.nv-hero-img`:
           `border: 1px solid rgba(99,102,241,0.35)`
           `box-shadow: 0 0 0 1px rgba(99,102,241,0.15), 0 0 30px rgba(99,102,241,0.4), 0 0 60px rgba(139,92,246,0.2)`

         `.nv-ring1/2/3`: use `rgba(99,102,241,0.4)`, `rgba(139,92,246,0.25)`, `rgba(6,182,212,0.15)` respectively

         `.nv-hero-title span`: `background: linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)`

         `.nv-form-card`:
           `background: rgba(8,8,14,0.5)`
           `border: 1px solid rgba(99,102,241,0.15)`

         `.nv-inp-wrap input`:
           `border: 1px solid rgba(99,102,241,0.20)`
           `background: rgba(0,0,0,0.3)`
           Focus: `border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12)`

         `.nv-btn`:
           `background: linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)`
           `box-shadow: 0 6px 28px rgba(99,102,241,0.45)`
           Shine sweep: `rgba(255,255,255,0.2)`

         `.nv-tab-on`:
           `background: linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.18)) !important`

         `.nv-role-on`:
           `border-color: rgba(99,102,241,0.55) !important`
           `box-shadow: 0 0 0 2px rgba(99,102,241,0.12)`

         `.nv-stats-row`: `border: 1px solid rgba(99,102,241,0.12)`

         `.nv-chip`: `background: rgba(99,102,241,0.08); border: rgba(99,102,241,0.20); color: rgba(165,180,252,0.7)`

       Files: `client/src/pages/Auth.css`
       Verify: `npm run build` exits 0; login/register pages render with NEXUS indigo palette and glass card.

- [ ] 11. **NEXUS all page-level tool CSS files (shared pattern)**
       These 8 files share the same glass-card pattern and need identical token-only updates. Preserve every class name exactly.

       Files to update:
         - `client/src/pages/AIToolsPage.css` (prefixes: `.at-`)
         - `client/src/pages/ProjectGeneratorPage.css` (prefixes: `.pg-`)
         - `client/src/pages/DocsGeneratorPage.css` (prefixes: `.dg-`)
         - `client/src/pages/CodeRefactorPage.css` (prefixes: `.cr-`)
         - `client/src/pages/SQLAssistantPage.css` (prefixes: `.sql-`)
         - `client/src/pages/ExecutionPage.css` (prefixes: `.ex-`)
         - `client/src/pages/SecurityPage.css` (prefixes: `.sec-`)
         - `client/src/pages/PreviewPage.css` (prefixes: `.pv-`)

       For each file apply the following global pattern changes:
         a) Root background: any `background:var(--bg,#0a0a0f)` → keep (var already updated in step 2).
         b) Panel/card backgrounds (`-root`, `-panel`, `-config`, `-result-panel`, `-quick-panel`, etc.):
            `background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); backdrop-filter: blur(10px)`
         c) Panel header backgrounds (`-panel-head`, `-editor-head`, etc.):
            `background: rgba(255,255,255,0.015); backdrop-filter: blur(8px)`
         d) Primary accent `#7c3aed` → `#6366f1` everywhere in the file.
         e) Secondary violet `#ec4899` stays, `#c084fc` → `#a5b4fc`.
         f) Header icon gradient → `linear-gradient(135deg,#6366f1,#8b5cf6)`.
         g) Primary action buttons (`.at-run-btn`, `.pg-generate-btn`, `.dg-generate-btn`, `.cr-refactor-btn`, `.sql-run-btn`, `.ex-run-btn`):
            `background: linear-gradient(135deg,#6366f1,#8b5cf6)`
            `box-shadow: 0 4px 20px rgba(99,102,241,0.35)`
         h) Input focus rings: `border-color: rgba(99,102,241,0.45)`
         i) Code block headers (`#161b22`): leave as-is (terminal dark is fine).
         j) Glow orb background radials: update `rgba(124,58,237,…)` → `rgba(99,102,241,…)`.
         k) Active/selected states: update purple tints from `rgba(124,58,237,…)` → `rgba(99,102,241,…)`.
         l) Section labels / h3 accent colors: `#c084fc` → `#a5b4fc`.
         m) For `SQLAssistantPage.css` the cyan accent `#06b6d4` stays (it's already in NEXUS palette).
         n) For `ExecutionPage.css` the active tab indicator: `border-bottom-color: #6366f1`.

       Files: all 8 listed above.
       Verify: `npm run build` exits 0.

- [ ] 12. **NEXUS ProfilePage and HistoryPage reskin**
       Same glass-card pattern as step 11.

       `ProfilePage.css` (prefix `.pp-`):
         Hero card `.pp-hero`: glass pattern + `background: rgba(255,255,255,0.02)`.
         `::before` animated border: `linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899,#6366f1)`.
         `.pp-avatar`: `background: linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)`.
         `.pp-tab-active`:
           `background: linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.10)) !important`
           `color: #a5b4fc !important`
           `border: 1px solid rgba(99,102,241,0.28) !important`
         `.pp-save-btn`: `background: linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)`.
         `.pp-role-user`: use `rgba(99,102,241,0.12)` + `rgba(99,102,241,0.25)` + `#a5b4fc`.
         `#7c3aed` → `#6366f1` throughout.
         `#c084fc` → `#a5b4fc` throughout.
         `.pp-card`: glass pattern (`rgba(255,255,255,0.02)`, `backdrop-filter: blur(10px)`).

       `HistoryPage.css` (prefix `.hp-`):
         `.hp-sidebar`, `.hp-main`: `background: var(--bg2)` → `rgba(255,255,255,0.02)` + backdrop-filter.
         `.hp-session-active`:
           `background: rgba(99,102,241,0.10) !important`
           `border-color: rgba(99,102,241,0.28) !important`
         `.hp-bubble-user`: `background: #13133a; border-color: rgba(99,102,241,0.22)`.
         `.hp-bubble-ai`: glass pattern.
         `::before` shimmer: `linear-gradient(90deg,#6366f1,#8b5cf6)`.
         `#7c3aed` → `#6366f1`, `#9f5cf7`/`#c084fc` → `#a5b4fc` throughout.
         `.hp-empty-stat strong` gradient: `linear-gradient(135deg,#6366f1,#8b5cf6)`.

       Files: `client/src/pages/ProfilePage.css`, `client/src/pages/HistoryPage.css`
       Verify: `npm run build` exits 0.

- [ ] 13. **NEXUS AdminDashboard and AdminLogin reskin**
       Keep ALL class names.

       `AdminDashboard.css` (prefix `.ad-`):
         `.ad-header-avatar`:
           `background: linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)`
         `.ad-stat-card::before` accent: `var(--sc,#6366f1)` (update default).
         `.ad-tab-active`:
           `background: rgba(99,102,241,0.12) !important`
           `color: #a5b4fc !important`
           `border-color: rgba(99,102,241,0.28) !important`
         `.ad-bar` (chart):
           `background: linear-gradient(to top,#6366f1,#a5b4fc)`
           `box-shadow: 0 0 12px rgba(99,102,241,0.25)`
         `.ad-progress-fill`:
           `background: linear-gradient(90deg,#6366f1,#8b5cf6)`
         `.ad-panel` glass:
           `background: rgba(255,255,255,0.02)`
           `border: 1px solid rgba(255,255,255,0.05)`
           `backdrop-filter: blur(10px)`
         `.ad-modal`:
           `background: rgba(13,13,20,0.95)`
           `backdrop-filter: blur(20px)`
         `.ad-r-user`: use `rgba(99,102,241,0.10)` + `rgba(99,102,241,0.20)` + `#a5b4fc`.
         `#7c3aed` → `#6366f1`, `#c084fc` → `#a5b4fc` throughout.

       `AdminLogin.css` (prefix `.admin-login-`, `.al-`, `.login-`):
         `.admin-login-page`:
           `background: radial-gradient(circle at 50% 0%,rgba(99,102,241,0.15),transparent 45%), #050508`
         `.al-glow-1`:
           `background: radial-gradient(circle,#6366f1,transparent 70%)`
         `.al-glow-2`:
           `background: radial-gradient(circle,#8b5cf6,transparent 70%)`
         `.admin-login-card`:
           `background: rgba(10,10,18,0.9)`
           `backdrop-filter: blur(20px)`
           `border: 1px solid rgba(99,102,241,0.15)`
           `box-shadow: 0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset`
         `.login-logo`:
           `background: linear-gradient(135deg,#6366f1,#8b5cf6)`
           `box-shadow: 0 0 32px rgba(99,102,241,0.30)`
         `.al-input-wrap input:focus`:
           `border-color: #6366f1`
           `box-shadow: 0 0 0 3px rgba(99,102,241,0.12)`
         `.al-submit-btn`:
           `background: linear-gradient(135deg,#6366f1,#8b5cf6)`
           `box-shadow: 0 4px 20px rgba(99,102,241,0.35)`

       Files: `client/src/components/AdminDashboard.css`, `client/src/components/AdminLogin.css`
       Verify: `npm run build` exits 0.

- [ ] 14. **No JSX changes required**
       All class names are preserved as-is. The only structural element that might need a JSX adjustment is adding the NEXUS glass glow to the `input-bar` wrapper — but since the CSS targets the existing `.input-bar` class directly, no JSX edits are needed.
       If during implementation any new wrapper element is added (e.g., a gradient border ring), the corresponding JSX `className` must be added without removing any existing ones, and without changing any event handlers or logic.
       Files: none (unless a structural wrapper is added — see note above).
       Verify: no JSX diff required.

- [ ] 15. **Final build verification**
       Run `cd client && npm run build`.
       Expected: exits 0 with no CSS errors.
       Then run `npm run dev` and visually inspect:
         - Sidebar: `#0a0a12` background, indigo left glow bar, gradient "ALOXADGPT" logo text, active nav items with left border + indigo tint.
         - Topbar: glass blur effect, status dot green glow, breadcrumb title.
         - HomeScreen: glassmorphism greeting card, animated gradient name text, glassmorphism tool cards with hover lift.
         - Chat: user bubbles navy `#13133a` with indigo border, AI bubbles glass dark with gradient shimmer line at top.
         - Input bar: floating glass card, gradient border on focus, gradient send button.
         - Auth pages: glass card form, gradient button with shine sweep.
         - All tool pages: consistent glass-card panels, indigo action buttons.
       Files: none (verification only)
       Verify: `npm run build` exits 0, browser shows NEXUS Dark Neural Theme.

---

## Key Decisions Made

1. **Accent primary: `#6366f1` (indigo) instead of existing `#7c3aed` (purple)** — the NEXUS spec explicitly calls for `#6366f1`. All existing purple-accent values map to either `#6366f1` (primary) or `#8b5cf6` (secondary violet). This keeps visual cohesion while strictly following the spec.

2. **Glassmorphism via `backdrop-filter: blur(10–20px)` + `rgba(255,255,255,0.02–0.03)` backgrounds** — applied to cards, panels, topbar, input bar, and popup. The existing CSS `var(--bg2)` token already serves this role; we add `backdrop-filter` on top of it so no structural JSX changes are needed.

3. **No class-name removal** — every existing CSS class is preserved. New NEXUS styles replace only property values, not selectors. This ensures zero risk of broken JSX references.

4. **Tool pages updated as one batch (step 11)** — they all share identical structure (`*-root`, `*-panel`, `*-panel-head`, `*-run-btn`, `*-code-input`, `*-result-area`). Batching them avoids repetitive individual items while keeping each file's unique accent color (e.g., SQL keeps cyan, execution keeps green) unless overridden by the spec.

5. **Light theme tokens updated to indigo accents** — the existing light theme uses purple (`#7c3aed`). NEXUS specifies "white/off-white surfaces, indigo accents" — so `#7c3aed` → `#6366f1` in all light-theme overrides. White/off-white background tokens stay as-is.
