# Android port status

This branch is the Android migration workspace for Hydra. The original desktop
application is Electron + React + TypeScript + Rust; it is not an Android app
and cannot become one by merely adding an APK/Gradle file.

## Confirmed blockers before a usable Android build

- The renderer starts by calling `globalThis.electron` for version, staging,
  preferences, cookies, LevelDB, and event subscriptions.
- The preload bridge imports Electron IPC and Node crypto.
- The main process depends on Electron, native Rust addons, filesystem/process
  APIs, desktop window management, and platform-specific game launchers.
- The torrent bridge and other native dependencies need Android ARM64 builds
  and Android-compatible storage/network integration.
- PC game executables are not natively executable on Android. Supporting a
  particular runtime/compatibility layer is a separate project and must not be
  claimed as working without device tests.

## Migration order

1. Keep the desktop `main` branch unchanged; do Android work here.
2. Make the renderer responsive and touch-friendly while preserving Hydra's
   visual identity.
3. Define a typed platform adapter so UI code does not call Electron APIs
   directly.
4. Implement Android storage, preferences, file picker, notifications,
   downloads/torrent engine, authentication/deep links, and lifecycle services.
5. Build the Android shell and Gradle project only after the web renderer has
   an Android entry point that does not import Electron preload/main code.
6. Add CI checks and an Android build workflow; verify the generated artifact
   on a real Android device before calling it usable.

## Current foundation

- `src/renderer/src/mobile.scss` adds touch handling, text selection, input
  caret behavior, mobile text sizing, reduced-motion support, and a compact
  bottom route bar for narrow phone screens while preserving Hydra's labels
  and icons. Landscape phones receive a shorter navigation bar.
- `src/renderer/src/app.scss` loads the mobile stylesheet; the HTML viewport
  includes `viewport-fit=cover` for device safe areas.
- These are renderer adaptations only. They do not yet provide Android native
  services, an installable APK, functional game downloads, or PC-game execution.

## CI validation

The workflow `.github/workflows/android-renderer-validation.yml` runs on pushes
and pull requests to this migration branch. It installs the locked Yarn
dependencies, runs the repository TypeScript checks and builds the existing
renderer/Electron bundles. It uploads the renderer output as a short-lived
preview artifact.

This workflow is intentionally **not** an Android APK build. The renderer
still requires the Electron preload contract during startup and throughout
the application. Packaging it in a WebView before replacing those calls would
produce a broken app, not a mobile Hydra port.

## Native work still required before Gradle/APK packaging

- Introduce a typed platform contract and migrate renderer services away from
  direct `window.electron` calls.
- Implement Android equivalents for preferences/LevelDB, session identity,
  file selection and scoped storage, notifications, app lifecycle, and
  deep-link authentication.
- Port or replace native torrent and filesystem/process services for Android
  ARM64. Desktop Rust addons and executable launchers cannot be reused as-is.
- Decide and implement a supported Android game-runtime strategy. Windows and
  Linux desktop game binaries do not run natively on Android.
- Only after the renderer starts without Electron and the required services
  have real implementations should an Android Gradle host and device tests be
  added.
