# PS-ACCESS Member App: the web version

The web version of the PSMBFI Member App, where members sign in from a computer or a phone browser. The phone app itself (React Native) is at the [repository root](../README.md); both are built as a full UI on **sample data** for demos and share one sample-data model. There is no backend yet: everything runs in the browser and persists in `localStorage`.

Most PSMBFI members are older, so the app is built for them first: 17px base text with a Large and Extra large setting, big touch targets, plain English and Filipino, fingerprint sign-in, and a "call me back" help path on every flow. Art direction and rules are in [DESIGN.md](../DESIGN.md).

## Run it

From this folder:

```bash
cd webapp
```

```bash
npm install
```

```bash
npm run dev
```

Open http://127.0.0.1:5173. For a production build:

```bash
npm run build
```

```bash
npm run preview
```

The build is a static SPA; `public/_redirects` (Netlify) and `vercel.json` route every path to `index.html`.

## Demo account

| What | Value |
|---|---|
| Member | PMSg Rowena D. Bautista, PNP, Quezon City Police District |
| Member ID | `PSM-2012-004512` (or mobile `0917 482 1196`) |
| PIN | `123456` (changeable in My profile) |
| One-time code | `482913` |
| Fingerprint | turned on for the demo member; the prompt is simulated |

The sign-in screen shows these values and has a "Fill in for me" button. Any member page also opens directly with `?as=member`, for example `/member/loans?as=member`.

## What to show

1. **Welcome** (`/`): the PSMBFI service medal, rendered live in WebGL on wide screens and as a baked render on phones. Language and text size are on the first screen.
2. **Sign in:** with the fingerprint, or with PIN and one-time code. "I forgot my PIN" runs a three-step reset.
3. **Enrol** (`/enrol`), five steps:
   1. Membership form (MAF).
   2. Pay and the 3% ATD.
   3. ID check against a selfie.
   4. Beneficiaries.
   5. Sign on screen.
4. **Home:** Equity Value, cover, the active loan, the open claim, and notifications.
5. **Equity Value:** history chart, contributions, a downloadable statement.
6. **Loans:** the six PSMBFI products and eligibility. Apply with a live amortization and a one-time PIN, then track the loan.
7. **Claims:** file with photo uploads (AHB, IHB, WIA, KIA, death, disablement, dependent's insurance, experience refund), track the steps, and re-upload a returned document.
8. **Payouts:** bank and e-wallet accounts, and payout history.
9. **Legal & Travel Assistance:** requests in the same login.
10. **Branches, My profile and More:** text size, language, theme, fingerprint, PIN change, data download, call-back help.

**Presenter tools.** There is no back office in this prototype. To show a loan or claim moving through PSMBFI's steps (with the member's notification and, at the end, the payout):
1. Turn on **More, then Presenter tools**.
2. Use the amber **Presenter** button.

**Reset the sample data** is at the bottom of My profile.

Append `?demo=error` to a data screen to see its error state.

## Stack

- Vite, React 19 and TypeScript.
- Tailwind CSS v4, with design tokens in `src/styles/index.css`.
- Motion, Radix primitives, Phosphor icons and Zustand.
- React Three Fiber and drei for the welcome medal, lazy-loaded so phones never download three.js.

```
src/
  app/router.tsx           routes: welcome, sign-in, enrol, /member/*
  features/welcome/        welcome screen, auth layout, WebGL medal scene
  features/auth/           sign-in, one-time code
  features/enrol/          digital enrolment
  features/member/         Member App shell, pages, shared parts (Help, presenter tools)
  components/              design-system components (buttons, fields, sheets, charts, brand marks)
  data/                    domain types, reference data (agencies, loan products, benefits), sample generator
  store/                   Zustand stores: member data, session, preferences
```

`src/data` and `src/lib/{format,random}.ts` are also read by the phone app: after changing them, run `npm run sync:webapp` at the repository root.

## Sample data and facts

- **Facts used as-is** come from the PS-ACCESS proposal and PSMBFI's published material:
  - the 16 agencies;
  - 3% of base pay;
  - the six loan product names;
  - the benefit types;
  - the 1998 Insurance Commission licence;
  - the Legal & Travel Assistance Portal;
  - the head office's street.
- **Labelled sample values to confirm with PSMBFI:**
  - member records;
  - loan rates and ceilings;
  - benefit schedules;
  - the Equity Value model;
  - office addresses beyond the head office.
- The PSMBFI emblem is the client's own image from the proposal deck.
