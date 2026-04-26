/**
 * Sync Manager
 * Handles synchronization between localStorage and Firebase
 */

import { doc, setDoc, writeBatch, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "../models/auth";
import { LocalShopItem, LocalPurchase } from "../types/localStorage";
import { saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from "./localStorage";

// Sync threshold: 20 minutes in milliseconds
const SYNC_THRESHOLD_MS = 20 * 60 * 1000; // 1200000ms

/**
 * Check if enough time has passed to trigger a sync
 */
export function shouldSync(): boolean {
  const lastSync = getLastSync();
  if (lastSync === null) {
    return true; // First time, should sync
  }
  const now = Date.now();
  return now - lastSync > SYNC_THRESHOLD_MS;
}

/**
 * Get the last sync timestamp
 */
export function getLastSync(): number | null {
  return loadFromLocalStorage<number>(STORAGE_KEYS.LAST_SYNC);
}

/**
 * Update the last sync timestamp to now
 */
export function updateLastSync(): void {
  saveToLocalStorage(STORAGE_KEYS.LAST_SYNC, Date.now());
}

/**
 * Sync user data to Firebase
 */
export async function syncUserToFirebase(userId: string, userData: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, userData, { merge: true });
    console.log("[SyncManager] User data synced to Firebase");
  } catch (error) {
    console.error("[SyncManager] Failed to sync user data:", error);
    throw error;
  }
}

/**
 * Sync shop items to Firebase (batch update)
 */
export async function syncShopItemsToFirebase(userId: string, items: LocalShopItem[]): Promise<void> {
  try {
    const unsyncedItems = items.filter((item) => !item.synced);

    if (unsyncedItems.length === 0) {
      console.log(`[SyncManager] No shop items to sync for user ${userId}`);
      return;
    }

    const batch = writeBatch(db);

    unsyncedItems.forEach((item) => {
      const itemRef = doc(db, "shopItems", item.id);
      const { synced, ...itemData } = item; // Remove sync flag
      batch.set(
        itemRef,
        {
          ...itemData,
          createdAt: Timestamp.fromDate(item.createdAt),
        },
        { merge: true },
      );
    });

    await batch.commit();

    // Mark items as synced in localStorage
    const updatedItems = items.map((item) => ({
      ...item,
      synced: true,
    }));
    saveToLocalStorage(STORAGE_KEYS.SHOP_ITEMS, updatedItems);

    console.log(`[SyncManager] Synced ${unsyncedItems.length} shop items to Firebase`);
  } catch (error) {
    console.error("[SyncManager] Failed to sync shop items:", error);
    throw error;
  }
}

/**
 * Sync purchases to Firebase (batch create)
 */
export async function syncPurchasesToFirebase(userId: string, purchases: LocalPurchase[]): Promise<void> {
  try {
    const unsyncedPurchases = purchases.filter((purchase) => !purchase.synced);

    if (unsyncedPurchases.length === 0) {
      console.log(`[SyncManager] No purchases to sync for user ${userId}`);
      return;
    }

    const batch = writeBatch(db);

    unsyncedPurchases.forEach((purchase) => {
      const purchaseRef = doc(db, "purchases", purchase.id);
      const { synced, ...purchaseData } = purchase; // Remove sync flag
      batch.set(purchaseRef, {
        ...purchaseData,
        purchasedAt: Timestamp.fromDate(purchase.purchasedAt),
      });
    });

    await batch.commit();

    // Mark purchases as synced in localStorage
    const updatedPurchases = purchases.map((purchase) => ({
      ...purchase,
      synced: true,
    }));
    saveToLocalStorage(STORAGE_KEYS.PURCHASE_HISTORY, {
      purchases: updatedPurchases,
      lastSync: Date.now(),
    });

    console.log(`[SyncManager] Synced ${unsyncedPurchases.length} purchases to Firebase`);
  } catch (error) {
    console.error("[SyncManager] Failed to sync purchases:", error);
    throw error;
  }
}

/**
 * Perform a full sync of all pending data
 */
export async function performFullSync(userId: string): Promise<void> {
  try {
    console.log("[SyncManager] Starting full sync...");

    // Load data from localStorage
    const userData = loadFromLocalStorage<User>(STORAGE_KEYS.USER_DATA);
    const shopItems = loadFromLocalStorage<LocalShopItem[]>(STORAGE_KEYS.SHOP_ITEMS) || [];
    const purchaseHistory = loadFromLocalStorage<{ purchases: LocalPurchase[] }>(STORAGE_KEYS.PURCHASE_HISTORY);

    // Sync user data
    if (userData) {
      await syncUserToFirebase(userId, userData);
    }

    // Sync shop items
    if (shopItems.length > 0) {
      await syncShopItemsToFirebase(userId, shopItems);
    }

    // Sync purchases
    if (purchaseHistory?.purchases && purchaseHistory.purchases.length > 0) {
      await syncPurchasesToFirebase(userId, purchaseHistory.purchases);
    }

    // Update last sync timestamp
    updateLastSync();

    console.log("[SyncManager] Full sync completed");
  } catch (error) {
    console.error("[SyncManager] Full sync failed:", error);
    throw error;
  }
}
