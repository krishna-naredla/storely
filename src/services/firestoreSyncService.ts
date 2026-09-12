import { useEffect, useState } from 'react';

export type FirestoreSyncStatus = 'synced' | 'syncing' | 'offline';

type SyncListener = (status: FirestoreSyncStatus) => void;

class FirestoreSyncManager {
  private status: FirestoreSyncStatus = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced';
  private listeners: Set<SyncListener> = new Set();
  private activeOperations = 0;
  private syncResetTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleOnline = () => {
    if (this.activeOperations > 0) {
      this.setStatus('syncing');
    } else {
      this.setStatus('synced');
    }
  };

  private handleOffline = () => {
    this.setStatus('offline');
  };

  public getStatus(): FirestoreSyncStatus {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'offline';
    }
    return this.status;
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(newStatus: FirestoreSyncStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.notify();
  }

  private notify() {
    const current = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(current);
      } catch (err) {
        console.warn('Sync status listener error:', err);
      }
    });
  }

  /**
   * Track an active Firestore operation (read/write).
   * Returns a completion callback.
   */
  public startOperation(): () => void {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return () => {};
    }

    if (this.syncResetTimeout) {
      clearTimeout(this.syncResetTimeout);
      this.syncResetTimeout = null;
    }

    this.activeOperations += 1;
    this.setStatus('syncing');

    let completed = false;
    return () => {
      if (completed) return;
      completed = true;
      this.activeOperations = Math.max(0, this.activeOperations - 1);

      if (this.activeOperations === 0) {
        // Hold 'syncing' briefly (400ms) to provide clear visual feedback to user
        if (this.syncResetTimeout) clearTimeout(this.syncResetTimeout);
        this.syncResetTimeout = setTimeout(() => {
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            this.setStatus('offline');
          } else {
            this.setStatus('synced');
          }
        }, 400);
      }
    };
  }

  /**
   * Helper to wrap a promise in a tracked sync operation
   */
  public async wrapSync<T>(promise: Promise<T>): Promise<T> {
    const finish = this.startOperation();
    try {
      const result = await promise;
      return result;
    } finally {
      finish();
    }
  }

  /**
   * Manually signal a sync event (e.g. debounced auto-save started)
   */
  public markSyncing() {
    return this.startOperation();
  }
}

export const firestoreSyncManager = new FirestoreSyncManager();

/**
 * React hook to observe real-time Firestore sync status
 */
export function useFirestoreSyncStatus(): FirestoreSyncStatus {
  const [status, setStatus] = useState<FirestoreSyncStatus>(() => firestoreSyncManager.getStatus());

  useEffect(() => {
    const unsubscribe = firestoreSyncManager.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  return status;
}
