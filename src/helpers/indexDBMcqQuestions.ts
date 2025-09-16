export const openDB = () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('InterviewAppDB', 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('interviewData')) {
                db.createObjectStore('interviewData');
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveToIDB = async (key: string, data: any) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('interviewData', 'readwrite');
        const store = transaction.objectStore('interviewData');
        const request = store.put(data, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getFromIDB = async (key: string) => {
    const db = await openDB();
    return new Promise<any>((resolve, reject) => {
        const transaction = db.transaction('interviewData', 'readonly');
        const store = transaction.objectStore('interviewData');
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const deleteFromIDB = async (key: string) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('interviewData', 'readwrite');
        const store = transaction.objectStore('interviewData');
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};