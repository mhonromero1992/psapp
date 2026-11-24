# PS-ACCESS: the PSMBFI Member App

The phone app for members of PSMBFI (Public Safety Mutual Benefit Fund, Inc.), from the PS-ACCESS
proposal: the Members Equity Plan (MEP), loans, claims, payouts and Legal & Travel Assistance in one
app. This is the **full UI on sample data** for demos: there is no backend yet, and everything a member
does is kept on the phone.

React Native 0.78.3 (bare, React Native CLI 15.0.1, no Expo), React 19, TypeScript, React Navigation 7,
styled-components and Zustand, in the same layout as our other apps. The **web version** of the same
app, where members can also sign in, is in [`webapp/`](webapp/README.md). Design: [DESIGN.md](DESIGN.md).

Most PSMBFI members are older people, so the app is built for them first: 17 point body text with a
Large and Extra large setting on the first screen, buttons at least 52 points tall, plain English or
Filipino with every acronym explained in words, one decision per step, and "Ask us to call you" on every
screen.

## What it does

| Screen | What the member does there |
|---|---|
| Welcome | Chooses English or Filipino and the text size first, then Sign in or "I'm new: enrol as a member". The service medal swings in once (still when the phone asks for less motion) |
| Sign in | Fingerprint (simulated), or member ID or mobile number with a 6-number PIN, then a one-time code. "I forgot my PIN" resets it in three steps |
| Enrol | Five steps: about you (the MAF), pay and the 3% ATD (salary deduction), an ID photo checked against a selfie, beneficiaries with shares adding to 100% and the dependent's free insurance, then review with three plain consents and a finger signature. Cancel asks before clearing answers; Android back goes back one step |
| Home | Equity Value, cover, six big actions, what is happening (loan payments, claim steps, assistance), latest updates |
| Equity Value | The history chart, contributions, the statement sent through the phone's share sheet |
| Loans | The six PSMBFI loan products with eligibility; apply with a live monthly amount and a PIN to confirm; follow each step |
| Claims | File a claim with photos from the camera or gallery, follow its steps, send a returned document again |
| Payouts | Where PSMBFI sends money (bank or e-wallet) and every payout |
| Legal & Travel Assistance | Ask for legal or travel help in the same login |
| Notifications | Every update, newest first; tapping one opens the loan, claim or payout |
| Branches | Your branch first, search by city or region, directions in Maps, "Make this my branch" |
| My profile | The membership card to show at a branch counter, contact details, beneficiary shares, fingerprint and PIN, privacy and a copy of my data, text size, language and screen |
| More | Everything that is not a tab, how the app looks, presenter tools, sign out |

Every data screen has a loading, empty and error state, and tab screens refresh when pulled down.

## Run it

You need Node 18 or newer, JDK 17, and Android Studio with Android SDK Platform 35, Build-Tools 35.0.0
and NDK 27.1.12297006 (SDK Manager → SDK Tools). For iOS: a Mac with Xcode 16 and CocoaPods.

```bash
npm install
```

```bash
npm start
```

```bash
npm run android
```

`npm run android` builds a debug app, installs it on the phone or emulator that `adb devices` lists, and
loads the code from Metro (`npm start`).

iOS:

```bash
cd ios && bundle install && bundle exec pod install && cd ..
```

```bash
npm run ios
```

## Demo account

| What | Value |
|---|---|
| Member | PMSg Rowena D. Bautista, PNP, Quezon City Police District |
| Member ID | `PSM-2012-004512` (or mobile `0917 482 1196`) |
| PIN | `123456` (changeable in My profile) |
| One-time code | `482913` |
| Fingerprint | on for the demo member; the prompt is simulated |

The sign-in screen shows these values and has a "Fill in for me" button.

**Presenter tools.** There is no PSMBFI back office in this prototype. To show a loan or claim moving
through PSMBFI's steps (with the member's notification and, at the end, the payout), turn on **More →
Presenter tools** and use the amber **Presenter** button.

**Reset the sample data** is at the bottom of My profile.

## Debug build on a phone

```bash
cd android && ./gradlew assembleDebug
```

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

A debug build loads its code from Metro on your computer; for a phone away from your computer, build a
release (`cd android && ./gradlew assembleRelease`, signed with the debug key until PSMBFI's upload key
is set up).

## Tests

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm test
```

`npm test` (Jest) checks that:

- the app opens on the welcome screen with sign-in and enrolment;
- every text, button, band and status colour meets WCAG AA contrast in light and dark;
- the sample data holds together (beneficiary shares add to 100%, paid loans are fully paid, no history
  dated after today);
- the loan, enrolment, profile and reset actions do what the screens promise.

## Project structure

```
App.tsx                    theme (light, dark, text size), waits for stored data, then the navigator
src/
  app/                     screens by feature: welcome, auth, enrol, home, equity, loans, claims,
                           payouts, assist, notifications, branches, profile, more
    _layout.tsx            the stack: Welcome, Sign in, Verify, Enrol, or the member's tabs and screens
    shared/                Help and call back, presenter tools, status words, loan and claim logic
  components/ui/           Txt, Button, Screen, Card, fields, sheets, dialogs, steps, photo picker,
                           signature pad, chart, settings controls
  components/brand/        PSMBFI emblem, lockup, service ribbons, three-blade mark
  config/theme.ts          palette (from the emblem), Archivo type scale, spacing, touch size
  navigations/             tab bar, routes, links from notifications
  store/                   Zustand: sample data (db), session, preferences, toasts and help
  data/, lib/format.ts     the sample-data model, shared with the web version
  assets/                  Archivo fonts (OFL), the emblem and medal images
webapp/                    the web version (Vite + React), see webapp/README.md
```

## Sample data, fonts and icons

- **The sample-data model is shared with the web version.** `webapp/src/data` and
  `webapp/src/lib/{format,random}.ts` are the source; after changing them, copy them here and test:

  ```bash
  npm run sync:webapp
  ```

- **Facts used as-is** come from the PS-ACCESS proposal and PSMBFI's published material: the 16
  agencies, 3% of base pay, the six loan product names, the benefit types and the head office's street.
  **Labelled sample values to confirm with PSMBFI:** member records, loan rates and ceilings, benefit
  schedules, the Equity Value model and office addresses beyond the head office.
- **Fonts:** Archivo in six static cuts, made from the variable font by `npm run fonts` (Python with
  fontTools) and linked into Android and iOS with `npx react-native-asset`.
- **Icons:** the launcher icons are the PSMBFI emblem from the proposal deck on white.

## Before it goes to members

- Connect the PS-ACCESS backend in place of the sample data (`src/store/db.ts` is the one place the
  screens read and write).
- Real fingerprint and Face ID through the phone's keystore, real one-time codes by SMS, and push
  notifications.
- PSMBFI's upload key for Google Play and the Apple team for the App Store.
- Confirm the labelled sample values above with PSMBFI.
