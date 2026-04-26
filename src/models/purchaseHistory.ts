/**
 * Purchase History Module
 * Manages local purchase history with sync status
 */

import { saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from "../lib/localStorage";
import { LocalPurchase, PurchaseHistoryData } from "../types/localStorage";
import { Purchase } from "../types/shop";

/**
 * Deserializa uma compra do localStorage, convertendo datas de string para Date
 */
function deserializePurchase(purchase: any): LocalPurchase {
  return {
    ...purchase,
    purchasedAt: typeof purchase.purchasedAt === "string" ? new Date(purchase.purchasedAt) : purchase.purchasedAt,
  };
}

/**
 * Add a purchase to the local history
 */
export function addPurchaseToHistory(purchase: Purchase): void {
  const historyData = loadFromLocalStorage<PurchaseHistoryData>(STORAGE_KEYS.PURCHASE_HISTORY) || {
    purchases: [],
    lastSync: 0,
  };

  const localPurchase: LocalPurchase = {
    ...purchase,
    synced: false,
  };

  historyData.purchases.unshift(localPurchase); // Add to beginning (most recent first)

  saveToLocalStorage(STORAGE_KEYS.PURCHASE_HISTORY, historyData);
}

/**
 * Get purchase history from localStorage
 */
export function getPurchaseHistory(): LocalPurchase[] {
  const historyData = loadFromLocalStorage<PurchaseHistoryData>(STORAGE_KEYS.PURCHASE_HISTORY);
  if (!historyData) return [];

  // Deserializar datas antes de retornar
  return historyData.purchases.map(deserializePurchase);
}

/**
 * Mark purchases as synced
 */
export function markPurchasesAsSynced(purchaseIds: string[]): void {
  const historyData = loadFromLocalStorage<PurchaseHistoryData>(STORAGE_KEYS.PURCHASE_HISTORY);

  if (!historyData) return;

  const updatedPurchases = historyData.purchases.map((purchase) => {
    if (purchaseIds.includes(purchase.id)) {
      return { ...purchase, synced: true };
    }
    return purchase;
  });

  historyData.purchases = updatedPurchases;
  historyData.lastSync = Date.now();

  saveToLocalStorage(STORAGE_KEYS.PURCHASE_HISTORY, historyData);
}

/**
 * Get unsynced purchases
 */
export function getUnsyncedPurchases(): LocalPurchase[] {
  const history = getPurchaseHistory(); // Já retorna com datas deserializadas
  return history.filter((purchase) => !purchase.synced);
}

/**
 * Clear all purchase history (use with caution)
 */
export function clearPurchaseHistory(): void {
  saveToLocalStorage(STORAGE_KEYS.PURCHASE_HISTORY, {
    purchases: [],
    lastSync: 0,
  });
}
