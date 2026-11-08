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
  caret behavior, mobile text sizing, and reduced-motion support.
- The renderer viewport uses the device safe area.
- This is groundwork only. It does not yet provide Android native services,
  an installable APK, or working PC-game execution.
