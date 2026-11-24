# PS-ACCESS · Design direction

This repository is the **PS-ACCESS Member App** for **PSMBFI** (Public Safety Mutual Benefit Fund, Inc.). It ships as a phone app (React Native, at the repository root) and as the same app on the web (`webapp/`), where members sign in too. The full UI runs on sample data for demos (there is no backend yet). Sections 0 to 12 hold for both; section 13 is what differs on the phone.

**Most members are older people.** Ease of use outranks density, novelty and decoration on every screen (section 0).

> **Design read.** A member app for a mutual benefit fund that insures uniformed and civilian personnel of 16 public safety agencies, in a *civic-premium* language: the gravity of a service medal, the plain speech of a counter clerk who knows your name.
>
> Dials:
> - **ENERGY 2 / RHYTHM 2 / MOTION 2** on the welcome screen.
> - **ENERGY 1 / RHYTHM 2 / MOTION 1** inside the app, where reading and deciding come first.

## 0. Designing for older members (binding)

1. **Bigger by default.**
   - The root text size is 17px. Members can choose Large (19px) or Extra large (21px) on the welcome screen, in My profile and in More.
   - The choice scales every rem in the app: type, spacing and touch targets together.
2. **Readable text.**
   - Never below 0.875rem; sentences are 1rem or more.
   - Sentences use `ink` or `ink-2`, never the muted grey.
3. **Big targets.** Touch targets are at least 3rem (about 51px), and list rows at least 3.75rem.
4. **Plain words.**
   - Short sentences.
   - Acronyms explained in words on each screen: "ATD (salary deduction)", "IHB (illness hospitalization benefit)".
   - Filipino and English throughout.
5. **One obvious primary action per screen.**
6. **Flows are calm.**
   - One decision per step, with "Step 2 of 5" written out.
   - Big Back and Continue buttons fixed at the bottom; values kept when going back.
   - No time pressure: one-time codes can be re-sent, and nothing times out mid-flow.
7. **Every submission ends on a success screen** with the reference number, what happens next and when, and a way home.
8. **Help is always one tap away.**
   - A labelled Help button in the top bar.
   - "Need help? Ask us to call you" at the end of flows and on empty and error states.
   - A person calls back, and the member's own branch is shown with directions.
9. **No password typing if avoidable.** Fingerprint sign-in comes first; the 6-number PIN can be shown while typing.
10. **Labels over icons.** Icons always carry a text label (icon-only only for close and back, with an `aria-label`). No hover-only information.
11. **Gentle motion.** Nothing essential lives inside an animation; reduced motion is respected everywhere.

Anti-slop runs in **during** mode for this project. Hard-gate rules are absolute: no em dashes in UI copy, no invented statistics or testimonials, AA contrast everywhere, every control works, every data view has empty, loading and error states, visible keyboard focus.

---

## 1. Brand source

Everything comes from the client's own emblem (supplied in the proposal deck): three curved, tapered blades in **green, blue and red**, each with a dark outline, like enamel set in metal (cloisonné).

| Token | Hex | Use | Reason |
|---|---|---|---|
| PSMBFI blue | `#1054A4` | the action colour: primary buttons, links, focus, chart series 1 | the emblem's blue reads as "uniform" and "trust"; 7.4:1 with white |
| PSMBFI green | `#009444` | Equity Value, positive money movement, chart series 2, brand artwork | the colour of growth in the emblem; **not for white text** (3.95:1). Text and filled buttons use `#007A38` |
| PSMBFI red | `#EC1C24` | brand artwork only, plus errors and destructive actions | red means danger in a money app, so it never decorates UI; filled buttons use `#C4141B` |
| Night | `#050F22` | hero band, footer, dark theme ground | the deepest step of the brand blue; dress-uniform navy |
| Slate ramp | `#F3F5F9` … `#0A1628` | canvas, surfaces, ink | cool neutrals tinted toward the brand blue so greys never read beige |

Palette rule: 2 core colours (blue, green) + 1 accent (red, rare). Gold `#C9A227` appears **only** inside ribbon insignia and the 3D metal, never as a UI colour.

**Never** violet, lavender, magenta or blue-to-purple gradients. (The iBITS magenta belongs to the vendor deck, not to this product.)

Contrast (computed): ink on canvas 17:1, `ink-2` 6.4:1, `ink-3` (muted, labels only) 4.95:1 on canvas and 5.4:1 on white. Dark theme `ink-3` 5.7:1.

## 2. Identity motifs

1. **Service ribbon bars.** Uniformed members wear ribbon racks whose stripe patterns encode honours.
   - Each loan product and app area has its own stripe pattern (`<Ribbon name="loans" />`).
   - The welcome medal hangs from a satin ribbon in brand stripes.
   - Ribbons are used as a *marker* beside a label or title, never as a decorative edge stripe on a card.
2. **The three blades.** An original crescent form drawn from the emblem's blades. It appears as the enamel on the welcome medal (3D), the loading spinner, the empty-state mark and the sign-in wipe. It is *not* a redraw of the PSMBFI logo; the real emblem is always the supplied image.
3. **Typographic voice.** Semi-condensed Archivo headlines with Filipino phrases set as accent lines ("Mas sigurado. Mas protektado.").

## 3. Typography

| Role | Face | Reason |
|---|---|---|
| Display, headings, big figures | **Archivo** variable (`wght` 100–900, `wdth` 62–125) | a grotesque with a width axis: condensed, it reads like uniform name tapes and service signage; the axis also powers kinetic type in the hero |
| Text and UI | **Public Sans** variable | designed for government digital services; plain, legible on low-end Android, tabular figures for peso columns |

- Public Sans has no ₱ glyph; the stack falls back to Archivo's latin-ext ₱, so the peso sign always renders in-brand.
- Headings: weight 650–800, `font-stretch` 80–92%, tracking −1.5% to −2%, `text-wrap: balance`.
- Body 16px / 1.55; never under 13px. Muted grey only for labels, dates, meta.
- Tabular figures (`tnum`) in tables, axes and money columns. Hero numbers use proportional figures.
- Sentence case everywhere. No wide-tracked uppercase eyebrows; a ribbon + sentence-case label replaces them.

## 4. Space, shape, depth

- Spacing scale (px): 4 8 12 16 20 24 32 40 48 64 80 96 128 160. Screens vary their vertical rhythm on purpose (a hero card, then lists), never a uniform grid of identical cards.
- Wrap: 1240px content, gutter `clamp(16px, 4vw, 48px)`.
- Radius: 6 (badges, chips) · 10 (small buttons) · 12 (buttons) · 14 (menus, inputs) · 20 (cards) · 28 (hero glass, sheets). Pills only for switches and avatars.
- **Depth over borders.** Surfaces separate by material and elevation:
  - `e1` resting card on canvas, `e2` raised (popover, hovered linked card), `e3` dialog or device.
  - Shadows are navy-tinted, never black.
  - A 1px inset ring is allowed on inputs (affordance), not on cards.

## 5. Liquid glass (with restraint)

Dose cap: **at most two glass elements per view.**

| Where | Why |
|---|---|
| Member app bottom tab bar | thumb-reach navigation floating over content on phones |
| Top bars (blur only) | content stays visible as it scrolls beneath; text sits on a near-opaque tint for contrast |

Recipe: `.glass` = translucent surface + `backdrop-filter: blur(18px) saturate(1.7)` + inset top highlight + inset rim + `e2`. Pointer-following specular light via `.sheen`. Fallbacks: solid surface under `prefers-reduced-transparency` and when `backdrop-filter` is unsupported. Text on glass keeps AA contrast against the worst case beneath.

## 6. Buttons

One family, eight variants: `primary` (blue), `positive` (approve, release), `negative` (reject, delete), `tonal` (secondary), `quiet` (neutral raised), `ghost` (tertiary), `light` and `glass` (on night grounds).

- **Hover:** a radial light follows the pointer across the surface (`--mx/--my`), and the fill steps a shade. No translateY, no bounce. Only on `(hover: hover) and (pointer: fine)`.
- **Press:** `scale(0.982)` in 90ms.
- **Focus:** a soft double halo (surface gap + 78% blue), shown instantly, never animated.
- **Loading:** the label holds its width and the three-blade spinner sits on top; `aria-busy`.
- **Disabled:** 50% opacity, desaturated, `cursor: not-allowed`.
- **Sizing and arrows:** heights 36/44/52px; on coarse pointers small buttons grow to 44px. Arrows appear only on forward steps in a flow (Next, Continue), never as decoration.

## 7. Motion

Purpose first; every animation answers "what does this tell the user?"

| Token | Value |
|---|---|
| ease-out (entrances) | `cubic-bezier(0.22, 1, 0.36, 1)` |
| ease-in-out (travel) | `cubic-bezier(0.65, 0, 0.35, 1)` |
| press / hover / UI / panel / page | 90 / 180 / 240 / 360 / 500 ms |
| springs | stiffness 380, damping 34, no overshoot |

- **Hero entrance (once):**
  - Headline lines rise from word masks (700ms, 80ms stagger).
  - Supporting text and CTAs follow (520ms, 60ms stagger).
  - The sculpture assembles from 0.98 scale.
  - Words never wait for the canvas.
- **Welcome:** the service medal assembles once and turns slowly with the pointer (wide screens only; phones get the baked render of the same medal).
- **Flows:** steps slide in the direction of travel; success screens draw their check once.
- **Inside the app:** cards and rows never fade in one by one.
- **Page transitions:**
  - Signing in and out: a three-blade wipe (green, blue, red) of about 650ms.
  - Inside the app: a 240ms crossfade with a 6px rise.
- **Tabs and toggles:** indicators slide with a shared layout spring.
- **Reduced motion:** everything rests at its final state. The 3D medal becomes a still render and the wipe is skipped. Nothing stays hidden.
- **Never:** card tilt, endless pulses, carousels, timed tabs, scroll hijacking, smooth-scroll libraries, or animation that delays a member's next tap.

## 8. Layout by surface

**Welcome, sign-in, one-time code** share one frame (`AuthLayout`):
- **Phones:** a single column. The welcome screen leads with language and text size, then two big choices: Sign in, or enrol as a new member.
- **Wide screens:** a split, with a night-blue panel carrying the live WebGL service medal and PSMBFI's tagline beside the same column. The medal never reloads between these screens.

**Digital enrolment** (`/enrol`) has five steps:
1. About you (the MAF).
2. Pay and the 3% ATD.
3. ID check with a selfie.
4. Beneficiaries, with shares adding to 100%.
5. Review and sign, with three plain consents and a finger signature.

**Member App** (`/member/*`):
- **Phones:** a top bar (lockup, language, Help, notifications, profile), the content, and a floating glass tab bar (Home, Equity, Loans, Claims, More).
- **From 1024px:** the web version, with a left rail of every destination and wider two-column compositions.

## 9. Copy voice

- Plain, specific, warm.
- **English and Filipino** throughout the app (full toggle on every screen, including sign-in and enrolment), plus PSMBFI's tagline in Filipino.
- **Buttons:** a verb plus an object ("Apply for a loan", "File a claim", "Upload ATD file", "Approve release").
- **Banned:** Get started, Learn more, Explore, Discover, seamless, empower, unlock, journey, hub, at your fingertips, world-class, powerful, robust, and em dashes.
- **Facts in the app come only from the proposal and PSMBFI's published material:**
  - 16 agencies
  - 3% of base pay
  - 6 loan products
  - licensed by the Insurance Commission as an MBA in 1998
  - the Legal & Travel Assistance Portal launched 29 Sept 2026
  - the head office on Santolan Road, West Crame, San Juan City
- **Sample data:** the app shows a "Sample data" marker, the sign-in screen shows the sample account, PIN and code, and product terms are labelled as sample values to confirm with PSMBFI.

## 10. Data visualisation

- Validated chart palette (dataviz `validate_palette.js`, all checks PASS):
  - **Light:** series 1 `#1054A4`, series 2 `#009444`, reference `#B9C2D0`.
  - **Dark:** series 1 `#4A82D0`, series 2 `#1FA35F`, reference `#4B5A72`.
- **Marks and axes:** 2px lines, 10% area wash, bars ≤ 24px with 4px rounded data-ends, hairline solid grids, no dual axes.
- **Interaction:** a crosshair tooltip on time series; per-mark tooltips on columns; keyboard focus gives the same readout. A screen-reader table backs every chart.
- **Labels and titles:** text never wears the series colour. A chart's title asks its question ("Which agencies remitted late this month?").

## 11. Accessibility & resilience

- WCAG 2.2 AA throughout.
- **Controls and labels:** every control is a native `button` or `a` with a name, and every icon-only button has an `aria-label`. Every field has a visible label, and its error sits under the field with an icon.
- **Keyboard:**
  - Tab order follows the visual order.
  - Dialogs and sheets trap focus and close on Escape.
  - A skip link comes first.
- **Touch:** targets are at least 44px on touch.
- **No zoom block:** the viewport never disables zoom.
- **States:** empty, loading (skeletons) and error (retry). Append `?demo=error` to any data view to see its error state.
- **Theme:** the light/dark toggle covers every component in both modes.

## 12. Do / don't

| Do | Don't |
|---|---|
| Write for a 60-year-old reading on a budget phone | Tiny grey meta text, icon-only buttons, dense tables |
| Vary section compositions | Centered title + subtitle + three identical cards, repeated |
| Use the ribbon as a marker | Coloured left-edge stripes on cards |
| Separate with depth and space | Borders around every card |
| One focal point per screen | Glow on cards, buttons, badges and icons at once |
| Initials avatars | Invented profile photos or testimonial faces |

## 13. The phone app (React Native)

The same rules, in native terms. Tokens live in `src/config/theme.ts`; every screen reads them with `useTheme()`.

- **Type:** Archivo only, in six static cuts named by their PostScript names (Regular, Medium, SemiBold, Bold, and SemiCondensed Bold and ExtraBold for headings and big figures). Never set `fontWeight` on them. The scale starts at 17 for body text; `small` (15) is the floor for anything a member must read. The member's Text size (Large 1.12x, Extra large 1.25x) multiplies the whole scale, on top of the phone's own font size (capped at 1.6x).
- **Text colours:** `text`, `soft` for sentences under a heading, `muted` for short labels and dates only. Every pair is tested for WCAG AA in light and dark (`__tests__/theme.test.ts`).
- **Touch:** 52 points minimum for controls, 68 for list rows. The bar's Back, Help, bell and avatar are 48.
- **Buttons:** seven variants (`primary`, `positive`, `negative`, `secondary` as tonal, `quiet`, `ghost`, `light` on the night band). Press: scale 0.97 and a deeper fill; busy: a spinner beside the label; labels wrap rather than clip.
- **Choices:** no native dropdowns. A choice opens a bottom sheet of big rows; dates are three choices (month, day, year). At Large and Extra large text, side-by-side choices (text size, screen) stack into rows so no word breaks.
- **Flows:** `StepHeader` with the step in words, one decision per step, Back and Continue in a sticky footer, Cancel in the top bar that asks before clearing answers, Android back stepping back inside the flow, and Continue scrolling to the first problem. Money actions confirm in a dialog that repeats the amount large.
- **Depth:** cards separate by shadow in light and by a hairline edge in dark. No glass on the phone: the tab bar floats on a solid panel.
- **Motion:** the welcome medal swings in once on a spring and settles; under the phone's reduce-motion setting it is still. Screens slide in from the side (stack). Nothing else animates in on its own.
- **Phone abilities:** photos come from the camera or gallery (`react-native-image-picker`), statements and "a copy of my data" go out through the share sheet, directions open Maps, and the fingerprint prompt is simulated until the backend exists.

