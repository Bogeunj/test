# Tetris UI/UX Single Design Spec (Round 1 Remediation)

## 1) Scope and Design Goal
- Objective: lock one implementable UI/UX spec for MVP Tetris that can be handed to development, QA/QC, and operations without further design ambiguity.
- In-scope: game screen IA, state UI (start/play/pause/game over/restart), input feedback motion/effects, color/type/component specs, responsive behavior (desktop/mobile), accessibility baseline (including color-vision deficiency support).
- Out-of-scope: backend, infra pipeline, security policy implementation.

## 2) Information Architecture (IA)

### Desktop (min width 1024)
- Left rail (`240px` fixed): hold panel, controls hint, pause button.
- Center stage (`320px` board + frame): 10x20 playfield as primary focus.
- Right rail (`240px` fixed): next queue (5), score, level, lines, speed meter.
- Top utility bar (`56px`): title, seed badge, sound toggle.

### Tablet (768-1023)
- Two-column layout: center board (`320px`) + right stack (`220px`).
- Hold moves under next queue in right stack.
- Utility actions collapse to icon row.

### Mobile (360-767)
- Vertical stack: utility bar -> board -> info cards -> touch controls.
- Board width is fluid (`min(92vw, 320px)`), fixed 1:2 aspect for 10x20 grid.
- Next queue shows 3 by default; expand button reveals full 5.
- Hold appears as compact chip next to score card.

## 3) State UI Specification

### A. Start State
- Full-screen hero card with title, "Press Enter / Tap Start" CTA, control preview.
- Secondary actions: toggle sound, open accessibility options.
- First focus target: start CTA.

### B. Playing State
- Board active with real-time HUD updates.
- Pause button visible and sticky.
- Next queue, hold, score/level/lines always visible.

### C. Paused State
- Dimmed playfield overlay (`rgba(7, 10, 18, 0.62)`), modal card with "Resume" primary CTA.
- Background animation frozen except subtle breathing glow at 4s cycle.
- Focus trap within pause modal.

### D. Game Over State
- Overlay card with final score, level reached, lines cleared, seed.
- Primary CTA: restart same seed.
- Secondary CTA: restart random seed.
- Tertiary text action: return to start.

### E. Restart Transition
- On restart, board performs 180ms wipe-down animation.
- HUD values reset after wipe completes.
- State returns to Playing with countdown `3-2-1` (900ms total).

## 4) Interaction and Motion/Effects

### Motion Principles
- Crisp and readable over flashy; total active effects under 3 concurrent layers.
- Default easing: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Global reduced-motion mode: disable non-essential transforms and particles.

### Input Feedback
- Move Left/Right: piece nudges `4px` then settles (`70ms`).
- Rotate: pivot flash ring (`90ms`) with subtle click scale (`1.0 -> 1.04 -> 1.0`).
- Soft Drop: continuous speed trail (alpha pulse every `120ms`).
- Hard Drop: vertical streak + landing burst (`140ms`).

### Event Feedback
- Line Clear (single): horizontal scan glow (`180ms`).
- Multi-line clear (2-4): stronger glow + combo text pop (`220ms`) and screen shake max `2px`.
- Level Up: HUD badge pulse + gold rim wave (`320ms`) + optional chime.

### Ghost / Hold Visual Behavior
- Ghost piece opacity `28%`, dashed edge for distinguishability.
- Hold swap: held piece card flips on Y-axis (`160ms`), disabled state visibly muted when swap unavailable.

## 5) Visual System (Color, Typography, Component Rules)

### Color Tokens
- `--bg-0: #0E111A` (main background)
- `--bg-1: #161B27` (surface)
- `--bg-2: #1F2635` (elevated panel)
- `--text-strong: #F3F6FF`
- `--text-muted: #B5BED3`
- `--accent-primary: #2CC9A7`
- `--accent-warning: #FFB020`
- `--accent-danger: #FF5A6A`
- Tetromino palette:
  - I `#35C2FF`
  - O `#FFD84D`
  - T `#B36CFF`
  - S `#45E06F`
  - Z `#FF6B6B`
  - J `#4D7CFF`
  - L `#FF9F43`

### Typography Tokens
- Display: `Space Grotesk` (700) for headings and key scores.
- UI body: `IBM Plex Sans` (400/500/600).
- Numeric mono (score/timer/seed): `IBM Plex Mono` (500/600).
- Type scale:
  - `display-lg: 40/44`
  - `title-md: 24/30`
  - `label-sm: 12/16`
  - `body-md: 14/20`

### Component Specifications
- Board cell size:
  - Desktop/tablet `32px`
  - Mobile `min(8.8vw, 28px)`
- Card radius `14px`, button radius `12px`, focus ring `2px`.
- Panel padding: desktop `16px`, mobile `12px`.
- Icon size: `18px` default, `22px` touch context.
- Shadows:
  - Surface: `0 8px 24px rgba(0,0,0,.24)`
  - Overlay: `0 20px 40px rgba(0,0,0,.35)`

## 6) Responsive Acceptance Criteria
- Desktop (1440x900): all IA zones visible without overlap; board remains central.
- Tablet (834x1194): no clipping in next queue/hold cards; pause modal fully visible.
- Mobile (390x844): touch controls reachable within thumb zone; restart CTA visible without scroll in game-over card.
- Orientation change: state and HUD persist through portrait/landscape swap.

## 7) Accessibility Criteria (including color-vision deficiency)
- Contrast: normal text `>= 4.5:1`, large text and essential icons `>= 3:1`.
- Non-color cues required for piece differentiation in accessibility mode:
  - pattern overlays (dot/stripe/grid variants),
  - shape tags in next/hold cards (single letter),
  - ghost retains dashed contour.
- Focus visibility: all interactive elements have clear ring and keyboard order.
- Keyboard/touch parity: start, pause, resume, restart must be operable by both.
- Motion safety: reduced-motion toggle disables shake/particle effects.
- Audio safety: all game feedback sounds independently toggleable.

## 8) Design QA Checklist (handoff-ready)
- IA files include desktop/tablet/mobile frames with identical naming convention.
- State screens complete: Start, Playing, Paused, Game Over, Restart transition.
- Motion annotations include trigger, duration, easing, and reduced-motion fallback.
- Token sheet includes color/type/spacing/radius/elevation with usage examples.
- Accessibility mode frame set includes color-vision safe variants and contrast notes.

## 9) Ownership, Schedule, Dependencies, Risks

### Owner and Deliverables
- Owner: Design Lead "Pixel" (design team), delegate execution: Luna.
- Deliverable 1: this single source of truth spec (`docs/tetris-design-spec-round1-remediation.md`).
- Deliverable 2: frame naming contract for dev/QA mapping (same IDs as section headers).

### Timeline (Round 1 remediation)
- D0 (today): spec freeze and review circulation.
- D+1: dev token hookup and screen skeleton mapping.
- D+2: motion/accessibility review sign-off with QA.

### Upstream/Downstream Dependencies
- Upstream: confirmed gameplay requirements (10x20, 7-bag, SRS, hold/ghost states).
- Downstream: development implementation, QA acceptance test authoring, operations monitor copy/text mapping.

### Blocking Risks and Release Conditions
- Risk 1: missing accessibility mode parity in implementation.
  - Unblock condition: accessibility mode screenshots for all five states approved by design + QA.
- Risk 2: animation impacts readability/performance.
  - Unblock condition: reduced-motion fallback and effect budget adhered in implementation review.
- Risk 3: responsive HUD overflow on small screens.
  - Unblock condition: pass mobile frame checks at 360x640 and 390x844.

## 10) Final Approval Gate (Design Team)
- Approval status: Conditional Approve (ready once implementation conforms to this spec without variance).
- Re-open trigger: any deviation in IA/state/motion/accessibility tokens without design sign-off.
