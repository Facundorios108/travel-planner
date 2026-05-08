export const DB_NAME = 'StayFinderDocs';
export const STORE_NAME = 'documents';
export const DB_VERSION = 1;

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        // If not in a browser environment, return a mock or reject
        if (typeof window === 'undefined') {
            return reject(new Error("IndexedDB is not available on the server"));
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

export const saveDocumentToCache = async (id: string, data: string): Promise<void> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(data, id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("IndexedDB save error", e);
    }
};

export const getDocumentFromCache = async (id: string): Promise<string | null> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("IndexedDB get error", e);
        return null;
    }
};

export const deleteDocumentFromCache = async (id: string): Promise<void> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("IndexedDB delete error", e);
    }
};
