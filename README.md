# Kue Mobile

The Android client for **Kue**, an all-in-one entertainment tracking and social platform for movies, TV series, anime, manga, and video games.

Built with Expo and React Native. The app talks directly to the [Kue Backend API](https://github.com/CanDundarCSE/kue-backend) and is distributed as a sideloaded APK through GitHub Releases, with in-app update checks against the [web app](https://github.com/CanDundarCSE/kue-web).

---

## Key Features

### Onboarding and Accounts

- Signed-out tour introducing the library, formats, and social features.
- Native sign-in and registration sheets.
- Secure session storage: access token in memory, refresh token in `expo-secure-store`, automatic single-flight token refresh.

### Personal Library

- Track statuses: `watching`, `reading`, `playing`, `completed`, `on_hold`, `dropped`, `planned`.
- Format-aware progress, decimal ratings, favorites, and personal notes.
- Media search and detail sheets without leaving the current screen.

### Discovery and Social

- Home dashboard with continue-watching, spotlight, and friend activity.
- Discover and search across movies, series, anime, manga, and games.
- Friends, friend requests, and QR-code friend scanning.
- Public profiles with friend-gated libraries and activity.
- Reviews with spoiler-safe text.

### Lists, Stats, and Mini Games

- Ranked or themed custom lists with public or private visibility.
- Activity heatmap, streaks, time spent, genre breakdown, and rating stats.
- Four mini games: poster guess, higher-or-lower, media quiz, and genre sprint.

### Real-Time Notifications

- Persistent WebSocket connection to the backend notification hub.
- Push updates for friend requests, accepted friendships, and system events.
- Unread badge counters and mark-as-read actions.

### Themes and App Updates

- Light, dark, and system themes using the shared Kue palette.
- In-app APK updater: checks the published manifest shortly after launch, downloads the new build, and hands it to the Android package installer.
- Manual update check in Settings.

---

## Technology Stack

| Component            | Technology                                      |
| -------------------- | ----------------------------------------------- |
| Framework            | Expo SDK 58                                     |
| Runtime              | React Native 0.88, React 19, Hermes             |
| Language             | TypeScript 6                                    |
| Navigation           | Expo Router                                     |
| Data Fetching        | TanStack Query                                  |
| Animation            | React Native Reanimated                         |
| Real-Time            | Native WebSocket client                         |
| Storage              | Expo SecureStore                                |
| UI                   | Custom components, Expo UI, Lucide icons        |
| Builds               | EAS Build (APK, arm64-v8a)                      |
| Package Manager      | pnpm                                            |

---

## Project Structure

```
kue-mobile/
├── src/
│   ├── app/                 # Expo Router routes (home, library, discover, profile, settings, ...)
│   ├── features/            # Feature screens, sheets, landing tour, mini games
│   ├── components/          # Shared UI primitives
│   ├── lib/
│   │   ├── api/             # Backend client and typed endpoints
│   │   ├── auth/            # Session storage, refresh, auth context
│   │   ├── notifications/   # WebSocket hub client
│   │   └── updates/         # APK update manifest and installer
│   ├── constants/           # Theme tokens
│   └── theme/               # Palette and theme provider
├── assets/                  # Icons, splash screen, avatars
├── app.json                 # Expo config, Android package, version code
├── eas.json                 # Build profiles
└── .env.example             # API and web URLs
```

---

## Getting Started

### Prerequisites

- Node.js 20 or newer
- [pnpm](https://pnpm.io/installation)
- Android device with Expo Go, or an Android emulator with the Android SDK
- A running [Kue Backend API](https://github.com/CanDundarCSE/kue-backend)

### 1. Clone and Install

```bash
git clone https://github.com/CanDundarCSE/kue-mobile.git
cd kue-mobile
pnpm install
```

### 2. Configure the API

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_KUE_API_URL=https://kue-backend-e61h.onrender.com
EXPO_PUBLIC_KUE_WEB_URL=
```

`EXPO_PUBLIC_KUE_WEB_URL` is optional. Set it to the deployed web origin so legal pages and web-only flows open the real site. When empty, the app falls back to the deployed web origin.

### 3. Run on Android

```bash
pnpm android
```

Or start Metro and choose a target:

```bash
pnpm start
```

If Expo Go cannot reach Metro, forward the port:

```bash
adb reverse tcp:8081 tcp:8081
```

### 4. Checks

```bash
pnpm typecheck
pnpm lint
```

---

## Building an APK

Builds use EAS with local versioning. Bump `expo.version` and `expo.android.versionCode` in `app.json` before a release, then run:

```bash
npx eas-cli@latest build --platform android --profile production
```

The production profile outputs an APK. The build is limited to the `arm64-v8a` architecture through `expo-build-properties` to keep the download smaller.

### In-App Updates

Installed builds check:

```text
https://<web-origin>/app/latest.json
```

The manifest must advertise a higher `versionCode` than the installed build. New APKs are published as the `kue.apk` asset on GitHub Releases. Users get a native update sheet that downloads and installs the APK over the existing app; library data and the session are preserved.

The update manifest lives in the [kue-web](https://github.com/CanDundarCSE/kue-web) repository at `public/app/latest.json`.

---

## Related Repositories

| Repository                                                | Description                    |
| --------------------------------------------------------- | ------------------------------ |
| [kue-backend](https://github.com/CanDundarCSE/kue-backend) | .NET API, SignalR, PostgreSQL  |
| [kue-web](https://github.com/CanDundarCSE/kue-web)         | Next.js web client             |
| [kue-mobile](https://github.com/CanDundarCSE/kue-mobile)   | This repository                |

---

## License

Personal, non-commercial project. See the repository for details.
