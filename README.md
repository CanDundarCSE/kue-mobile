# Kue Mobile

Android-only Expo client for Kue. It talks directly to the deployed API at
`https://kue-backend-e61h.onrender.com`.

## Prerequisites

The Android toolchain is installed user-local under `~/Android` (no sudo):

- JDK 17: `~/Android/jdk-17`
- Android SDK: `~/Android/Sdk`
- AVD: `KuePixel` (Pixel 8, API 36, x86_64)

Fish loads the environment from `~/.config/fish/conf.d/android.fish`. Open a new
terminal after changing it. To check:

```fish
echo $ANDROID_HOME
adb version
emulator -version
```

## Run on the emulator

```fish
cd ~/Desktop/kue-app/kue-mobile
pnpm install
pnpm android
```

`pnpm android` starts Metro and opens Expo Go on `KuePixel`. If the emulator is
not running:

```fish
emulator -avd KuePixel -gpu host -no-snapshot-load -no-boot-anim -no-audio
```

If Expo Go cannot reach Metro, forward the port and open the project manually:

```fish
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW -d 'exp://127.0.0.1:8081' host.exp.exponent
```

Clear Metro's cache if a new file is not resolving:

```fish
pnpm android:clear
```

## Checks

```fish
pnpm typecheck
pnpm lint
```

## API configuration

`EXPO_PUBLIC_KUE_API_URL` lives in `.env` (ignored by git). Copy the example when
setting up a fresh checkout:

```fish
cp .env.example .env
```

`EXPO_PUBLIC_KUE_WEB_URL` is optional. Set it to the deployed web app origin to
make the landing page's legal links open the real Privacy, Cookie and Terms
pages. When it is empty, those links explain that the documents live on the web.

Auth tokens are handled in `src/lib/auth/session.ts`:

- access token stays in memory
- refresh token and last profile are stored with `expo-secure-store`
- a 401 triggers one single-flight refresh and retries the request

Render's free tier sleeps after inactivity, so the first request can take
30–60 seconds.

## Screens

Signed-out users get a native-style landing experience: a compact top app bar,
system typography, format chips, an interactive library preview, a swipeable
format carousel, feature cards with live demos, an activity heatmap and a native
FAQ list. "Sign in" opens a bottom sheet over the landing rather than navigating
to a separate page; Android's back button dismisses the sheet.

Signed-in users get the Home/Explore tab shell. Home currently shows the account
card and the Render API health check; the real Kue navigation (Library, Discover,
Lists, Profile) is the next step.

## Layout

- `src/app/_layout.tsx` — fonts, providers, auth gate
- `src/app/index.tsx` — signed-in home
- `src/app/explore.tsx` — template placeholder
- `src/features/landing/` — public landing page, sign-in sheet, sections and demos
- `src/lib/responsive.ts` — breakpoints, gutters and fluid type helpers
- `src/lib/api/` — base URL and response types
- `src/lib/auth/` — session storage, refresh, React context
- `src/lib/query/` — TanStack Query provider
- `src/constants/kue-theme.ts` — color, font and spacing tokens

The landing page is responsive from compact phones (under 390dp) through
foldables and tablets. It reads as a single native app column capped at 620dp,
with full-bleed horizontal carousels, and reacts to `useWindowDimensions` so
rotation and split-screen resizing reflow the layout. To exercise the
breakpoints on an emulator:

```fish
adb shell wm size 720x1600
adb shell wm density 320
# ...test at 360dp...
adb shell wm size reset
adb shell wm density reset
```

