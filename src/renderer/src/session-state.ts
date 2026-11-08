import type { UserPreferences } from "@types";
import { levelDBService } from "./services/leveldb.service";
import {
  getSessionScopedKeyPrefixesToClear,
  getSessionScopedKeysToClear,
} from "./session-state-keys";

export {
  SETTINGS_CATEGORY_STORAGE_KEY,
  SETTINGS_EMULATION_VIEW_STORAGE_KEY,
  SETTINGS_EMULATOR_TAB_STORAGE_KEY,
  SETTINGS_RETROARCH_TAB_STORAGE_KEY,
  LIBRARY_PLATFORMS_STORAGE_KEY,
  LIBRARY_SOURCES_STORAGE_KEY,
  LIBRARY_INSTALLED_ONLY_STORAGE_KEY,
  SIDEBAR_PLATFORMS_STORAGE_KEY,
  SIDEBAR_SOURCES_STORAGE_KEY,
  SIDEBAR_PLAYABLE_ONLY_STORAGE_KEY,
} from "./session-state-keys";

const APP_SESSION_ID_KEY = "app-session-id";

const getBrowserSessionId = (): string => {
  const existing = sessionStorage.getItem(APP_SESSION_ID_KEY);
  if (existing) return existing;

  const sessionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `browser-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  sessionStorage.setItem(APP_SESSION_ID_KEY, sessionId);
  return sessionId;
};

const shouldPersistFiltersAndSorting = async () => {
  try {
    const userPreferences = (await levelDBService.get(
      "userPreferences",
      null,
      "json"
    )) as UserPreferences | null;

    return userPreferences?.persistFiltersAndSorting === true;
  } catch (error) {
    console.error("Failed to read the filters persistence preference", error);
    return false;
  }
};

export const clearStateFromPreviousSession = async () => {
  try {
    const desktopBridge = (
      globalThis as typeof globalThis & { electron?: Electron }
    ).electron;
    const sessionId = desktopBridge?.getAppSessionId
      ? await desktopBridge.getAppSessionId()
      : getBrowserSessionId();
    if (localStorage.getItem(APP_SESSION_ID_KEY) === sessionId) return;

    const persistFiltersAndSorting = await shouldPersistFiltersAndSorting();

    for (const key of getSessionScopedKeysToClear(persistFiltersAndSorting)) {
      localStorage.removeItem(key);
    }

    const prefixesToClear = getSessionScopedKeyPrefixesToClear(
      persistFiltersAndSorting
    );
    for (const key of Object.keys(localStorage)) {
      if (prefixesToClear.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }

    localStorage.setItem(APP_SESSION_ID_KEY, sessionId);
  } catch (error) {
    console.error("Failed to reset per-session UI state", error);
  }
};
