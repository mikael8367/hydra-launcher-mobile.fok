type StoredEntry = {
  id: string;
  sublevel: string;
  key: string;
  value: unknown;
};

const DATABASE_NAME = "hydra-mobile-storage";
const STORE_NAME = "entries";
const DATABASE_VERSION = 1;
const SEPARATOR = "\u0000";

const makeId = (sublevel: string, key: string) =>
  `${sublevel}${SEPARATOR}${key}`;

class MobileStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MobileStorageError";
  }
}

class MobileStorageService {
  private database: Promise<IDBDatabase> | null = null;

  private openDatabase(): Promise<IDBDatabase> {
    if (!("indexedDB" in globalThis)) {
      return Promise.reject(
        new MobileStorageError("IndexedDB is unavailable in this browser.")
      );
    }

    if (this.database) return this.database;

    this.database = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          this.database = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        this.database = null;
        reject(
          new MobileStorageError("Could not open the mobile storage database.", {
            cause: request.error,
          })
        );
      };

      request.onblocked = () => {
        this.database = null;
        reject(
          new MobileStorageError(
            "The mobile storage database is blocked by another open version."
          )
        );
      };
    });

    return this.database;
  }

  private async transaction<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = operation(tx.objectStore(STORE_NAME));
      let result: T;

      request.onsuccess = () => {
        result = request.result;
      };
      request.onerror = () => reject(
        new MobileStorageError("Mobile storage request failed.", {
          cause: request.error,
        })
      );
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(
        new MobileStorageError("Mobile storage transaction failed.", {
          cause: tx.error,
        })
      );
      tx.onabort = () => reject(
        new MobileStorageError("Mobile storage transaction was aborted.", {
          cause: tx.error,
        })
      );
    });
  }

  async get(
    key: string,
    sublevelName?: string | null,
    valueEncoding?: "json" | "utf8"
  ): Promise<unknown> {
    const entry = await this.transaction<StoredEntry | undefined>(
      "readonly",
      (store) => store.get(makeId(sublevelName ?? "", key))
    );
    if (!entry) return undefined;
    if (valueEncoding === "utf8" && typeof entry.value !== "string") {
      return String(entry.value);
    }
    return entry.value;
  }

  async put(
    key: string,
    value: unknown,
    sublevelName?: string | null,
    _valueEncoding?: "json" | "utf8"
  ): Promise<void> {
    await this.transaction<IDBValidKey>("readwrite", (store) =>
      store.put({
        id: makeId(sublevelName ?? "", key),
        sublevel: sublevelName ?? "",
        key,
        value,
      } satisfies StoredEntry)
    );
  }

  async del(key: string, sublevelName?: string | null): Promise<void> {
    await this.transaction<undefined>("readwrite", (store) =>
      store.delete(makeId(sublevelName ?? "", key))
    );
  }

  async clear(sublevelName: string): Promise<void> {
    const entries = await this.getSublevelEntries(sublevelName);
    const db = await this.openDatabase();

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      for (const entry of entries) store.delete(entry.id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(
        new MobileStorageError("Could not clear the mobile storage sublevel.", {
          cause: tx.error,
        })
      );
      tx.onabort = () => reject(
        new MobileStorageError("Clearing the mobile storage sublevel was aborted.", {
          cause: tx.error,
        })
      );
    });
  }

  async values(sublevelName: string): Promise<unknown[]> {
    return (await this.getSublevelEntries(sublevelName)).map(
      (entry) => entry.value
    );
  }

  async iterator(sublevelName: string): Promise<[string, unknown][]> {
    return (await this.getSublevelEntries(sublevelName)).map(
      (entry) => [entry.key, entry.value]
    );
  }

  private async getSublevelEntries(
    sublevelName: string
  ): Promise<StoredEntry[]> {
    const entries = await this.transaction<StoredEntry[]>(
      "readonly",
      (store) => store.getAll()
    );
    return entries
      .filter((entry) => entry.sublevel === sublevelName)
      .sort((a, b) => a.key.localeCompare(b.key));
  }
}

export const mobileStorageService = new MobileStorageService();
