import { useEffect } from "react";
import { useAppDispatch } from "./redux";
import { updateGameNewDownloadOptions } from "@renderer/features";

export function useDownloadOptionsListener() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Electron IPC is unavailable in the Android WebView preview.
    // Keep this listener disabled there instead of invoking a missing bridge API.
    if (
      window.electron?.platform === "android" ||
      typeof window.electron?.onNewDownloadOptions !== "function"
    ) {
      return;
    }

    const unsubscribe = window.electron.onNewDownloadOptions(
      (gamesWithNewOptions) => {
        for (const { gameId, count } of gamesWithNewOptions) {
          dispatch(updateGameNewDownloadOptions({ gameId, count }));
        }
      }
    );

    return unsubscribe;
  }, [dispatch]);
}
