/**
 * Storage Abstraction Layer
 * 
 * This service provides a clean abstraction over client-side storage (localStorage/IndexedDB)
 * that can be easily swapped for PostgreSQL/Supabase later.
 * 
 * TO MIGRATE TO POSTGRESQL:
 * 1. Replace the implementation of each method with Supabase client calls
 * 2. Change async signatures to use actual async operations
 * 3. Update error handling for network failures
 * 4. The interface and usage throughout the app remains the same
 */

const STORAGE_PREFIX = 'vw_portal_';

export interface StorageService<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(item: T): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  query(predicate: (item: T) => boolean): Promise<T[]>;
}

export function createStorageService<T extends { id: string }>(key: string): StorageService<T> {
  const storageKey = `${STORAGE_PREFIX}${key}`;

  const getItems = (): T[] => {
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  };

  const setItems = (items: T[]): void => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  };

  return {
    async getAll(): Promise<T[]> {
      return getItems();
    },

    async getById(id: string): Promise<T | null> {
      const items = getItems();
      return items.find(item => item.id === id) || null;
    },

    async create(item: T): Promise<T> {
      const items = getItems();
      items.push(item);
      setItems(items);
      return item;
    },

    async update(id: string, updates: Partial<T>): Promise<T | null> {
      const items = getItems();
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return null;
      
      items[index] = { ...items[index], ...updates };
      setItems(items);
      return items[index];
    },

    async delete(id: string): Promise<boolean> {
      const items = getItems();
      const newItems = items.filter(item => item.id !== id);
      if (newItems.length === items.length) return false;
      
      setItems(newItems);
      return true;
    },

    async query(predicate: (item: T) => boolean): Promise<T[]> {
      const items = getItems();
      return items.filter(predicate);
    }
  };
}

// Storage instances for different entities
export const userStorage = createStorageService<any>('users');
export const dealerStorage = createStorageService<any>('dealers');
export const pccStorage = createStorageService<any>('pcc_submissions');
export const accessRequestStorage = createStorageService<any>('access_requests');
export const auditStorage = createStorageService<any>('audit_logs');
export const apiRegistrationStorage = createStorageService<any>('api_registrations');

// Generic key-value storage for config
export const configStorage = {
  get<T>(key: string): T | null {
    const data = localStorage.getItem(`${STORAGE_PREFIX}config_${key}`);
    return data ? JSON.parse(data) : null;
  },

  set<T>(key: string, value: T): void {
    localStorage.setItem(`${STORAGE_PREFIX}config_${key}`, JSON.stringify(value));
  },

  remove(key: string): void {
    localStorage.removeItem(`${STORAGE_PREFIX}config_${key}`);
  }
};
