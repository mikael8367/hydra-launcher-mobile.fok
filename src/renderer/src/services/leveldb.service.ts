import { mobileStorageService } from "./mobile-storage.service";

class LevelDBService {
  private getDesktopBridge() {
    return (window as Window & { electron?: Electron }).electron?.leveldb;
  }

  get(
    key: string,
    sublevelName?: string | null,
    valueEncoding?: "json" | "utf8"
  ): Promise<unknown> {
    const desktop = this.getDesktopBridge();
    return desktop
      ? desktop.get(key, sublevelName, valueEncoding)
      : mobileStorageService.get(key, sublevelName, valueEncoding);
  }

  put(
    key: string,
    value: unknown,
    sublevelName?: string | null,
    valueEncoding?: "json" | "utf8"
  ): Promise<void> {
    const desktop = this.getDesktopBridge();
    return desktop
      ? desktop.put(key, value, sublevelName, valueEncoding)
      : mobileStorageService.put(key, value, sublevelName, valueEncoding);
  }

  del(key: string, sublevelName?: string | null): Promise<void> {
    const desktop = this.getDesktopBridge();
    return desktop
      ? desktop.del(key, sublevelName)
      : mobileStorageService.del(key, sublevelName);
  }

  clear(sublevelName: string): Promise<void> {
    const desktop = this.getDesktopBridge();
    return desktop
      ? desktop.clear(sublevelName)
      : mobileStorageService.clear(sublevelName);
  }

  values(sublevelName: string): Promise<unknown[]> {
    const desktop = this.getDesktopBridge();
    return desktop
      ? desktop.values(sublevelName)
      : mobileStorageService.values(sublevelName);
  }

  iterator(sublevelName: string): Promise<[string, unknown][]> {
    const desktop = this.getDesktopBridge();
    return desktop
      ? desktop.iterator(sublevelName)
      : mobileStorageService.iterator(sublevelName);
  }
}

export const levelDBService = new LevelDBService();
