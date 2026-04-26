/**
 * LocalStorage utility module
 * Provides type-safe save/load operations with error handling
 */

// Storage keys
export const STORAGE_KEYS = {
  USER_DATA: "apprender:user",
  SHOP_ITEMS: "apprender:shop_items",
  PURCHASE_HISTORY: "apprender:purchase_history",
  LAST_SYNC: "apprender:last_sync",
  PARENT_PASSWORD: "apprender:parent_password",
} as const;

/**
 * Save data to localStorage with error handling
 */
export function saveToLocalStorage<T>(key: string, data: T): boolean {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`[LocalStorage] Failed to save "${key}":`, error);
    return false;
  }
}

/**
 * Load data from localStorage with error handling
 */
export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return null;
    }
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error(`[LocalStorage] Failed to load "${key}":`, error);
    return null;
  }
}

/**
 * Remove data from localStorage
 */
export function clearLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`[LocalStorage] Failed to clear "${key}":`, error);
  }
}

/**
 * Clear all app-related data from localStorage
 */
export function clearAllAppData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    clearLocalStorage(key);
  });
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
