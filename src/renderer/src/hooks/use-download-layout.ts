import type { DownloadLayoutState } from "@types";
import { DEFAULT_DOWNLOAD_LAYOUT_STATE } from "../../../types";
import { useCallback, useEffect, useState } from "react";

export function useDownloadLayout() {
  const [layoutState, setLayoutState] = useState<DownloadLayoutState>(
    DEFAULT_DOWNLOAD_LAYOUT_STATE
  );

  const updateLayoutState = useCallback(async () => {
    // Android WebView does not provide Electron IPC. Keep the renderer's
    // default layout state instead of calling an unavailable native method.
    if (
      window.electron?.platform === "android" ||
      typeof window.electron?.getDownloadLayoutState !== "function"
    ) {
      setLayoutState(DEFAULT_DOWNLOAD_LAYOUT_STATE);
      return DEFAULT_DOWNLOAD_LAYOUT_STATE;
    }

    const nextLayoutState = await window.electron.getDownloadLayoutState();
    setLayoutState(nextLayoutState);
    return nextLayoutState;
  }, []);

  useEffect(() => {
    void updateLayoutState();

    if (
      window.electron?.platform === "android" ||
      typeof window.electron?.onDownloadsUpdated !== "function"
    ) {
      return;
    }

    const unsubscribeDownloadsUpdated = window.electron.onDownloadsUpdated(
      () => {
        void updateLayoutState();
      }
    );

    return () => {
      unsubscribeDownloadsUpdated();
    };
  }, [updateLayoutState]);

  return { layoutState, updateLayoutState };
}
