/**
 * Sync Manager
 * Handles synchronization between localStorage and Firebase
 */

import { doc, setDoc, getDoc, writeBatch, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "../models/auth";
import { LocalShopItem, LocalPurchase, PurchaseHistoryData, AnswerRecord } from "../types/localStorage";
import { saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from "./localStorage";

// Sync threshold: 20 minutes in milliseconds
const SYNC_THRESHOLD_MS = 20 * 60 * 1000; // 1200000ms

// Flag para prevenir múltiplas sincronizações simultâneas
let isSyncing = false;

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
 * Sincronização principal: user + histórico de compras → Firestore.
 * Deve ser chamada em todo ponto que antes atualizava apprender:last_sync.
 */
export async function syncFirestore(userId: string): Promise<void> {
  // 1. Sincroniza campos do usuário
  const userData = loadFromLocalStorage<User>(STORAGE_KEYS.USER_DATA);
  if (userData && userData.id === userId) {
    let offensiveGuards = userData.offensive_guards ?? 0;
    let offensive = userData.offensive ?? 0;
    const lastDay = userData.last_day ?? null;

    // Valida ofensiva: se last_day < hoje, desconta dias perdidos dos guards
    if (lastDay) {
      const last = new Date(lastDay + "T00:00:00");
      const today = new Date(new Date().toISOString().split("T")[0] + "T00:00:00");
      const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        const missedDays = diffDays - 1; // dias entre last_day+1 e ontem
        offensiveGuards -= missedDays;

        if (offensiveGuards < 0) {
          offensive = 0;
          offensiveGuards = 2;
        }

        // Persiste os valores corrigidos no localStorage antes de enviar ao Firestore
        saveToLocalStorage(STORAGE_KEYS.USER_DATA, {
          ...userData,
          offensive,
          offensive_guards: offensiveGuards,
        });
        console.log(
          `[SyncFirestore] Ofensiva ajustada: ${missedDays} dias perdidos. Guards: ${offensiveGuards}, Offensive: ${offensive}`,
        );
      }
    }

    const userUpdate: Record<string, unknown> = {
      level: userData.level,
      nickname: userData.nickname,
      offensive_guards: offensiveGuards,
      offensive: offensive,
      last_day: lastDay,
      points: userData.points,
      rating: userData.rating,
    };
    if (userData.parentPassword !== undefined) {
      userUpdate.parentPassword = userData.parentPassword;
    }
    await setDoc(doc(db, "users", userId), userUpdate, { merge: true });
    console.log("[SyncFirestore] Dados do usuário sincronizados");
  }

  // 2. Sincroniza compras: cria registros no Firestore e decrementa quantities
  const historyData = loadFromLocalStorage<PurchaseHistoryData>(STORAGE_KEYS.PURCHASE_HISTORY);
  if (historyData?.purchases?.length) {
    const lastSyncTime = getLastSync() ?? 0;

    // Cria no Firestore: compras não sincronizadas OU mais recentes que o último sync
    const toCreate = historyData.purchases.filter((p) => !p.synced || new Date(p.purchasedAt).getTime() > lastSyncTime);

    for (const p of toCreate) {
      const { synced, ...purchaseData } = p;
      await setDoc(
        doc(db, "purchases", p.id),
        { ...purchaseData, purchasedAt: Timestamp.fromDate(new Date(p.purchasedAt)) },
        { merge: true },
      );
    }

    // Decrementa quantity nos shopItems apenas para compras ainda não sincronizadas
    const unsynced = historyData.purchases.filter((p) => !p.synced);
    if (unsynced.length > 0) {
      const countByItem: Record<string, number> = {};
      for (const p of unsynced) {
        countByItem[p.itemId] = (countByItem[p.itemId] ?? 0) + 1;
      }
      for (const [itemId, count] of Object.entries(countByItem)) {
        const itemRef = doc(db, "shopItems", itemId);
        const snap = await getDoc(itemRef);
        if (snap.exists()) {
          const currentQty: number = (snap.data().quantity as number) ?? 0;
          await setDoc(itemRef, { quantity: Math.max(0, currentQty - count) }, { merge: true });
        }
      }
    }

    if (toCreate.length > 0 || unsynced.length > 0) {
      const updatedPurchases = historyData.purchases.map((p) => ({ ...p, synced: true }));
      saveToLocalStorage(STORAGE_KEYS.PURCHASE_HISTORY, { ...historyData, purchases: updatedPurchases });
      console.log(
        `[SyncFirestore] ${toCreate.length} compras criadas no Firestore, ${unsynced.length} quantities decrementadas`,
      );
    }
  }

  // 3. Sincroniza respostas do histórico de play (somente escrita, sem leitura)
  const answerHistory = loadFromLocalStorage<AnswerRecord[]>(STORAGE_KEYS.ANSWER_HISTORY);
  if (answerHistory?.length) {
    const unsynced = answerHistory.filter((a) => !a.synced);
    if (unsynced.length > 0) {
      const batch = writeBatch(db);
      for (const answer of unsynced) {
        const { synced, ...answerData } = answer;
        // set sem merge evita leitura implícita do Firestore (respostas são imutáveis)
        batch.set(doc(db, "answers", answer.id), {
          ...answerData,
          data_registro: Timestamp.fromDate(new Date(answer.data_registro)),
        });
      }
      await batch.commit();
      const updatedAnswers = answerHistory.map((a) => ({ ...a, synced: true }));
      saveToLocalStorage(STORAGE_KEYS.ANSWER_HISTORY, updatedAnswers);
      console.log(`[SyncFirestore] ${unsynced.length} respostas enviadas para o Firestore`);
    }
  }

  // 4. Atualiza timestamp de última sincronização
  updateLastSync();
  console.log("[SyncFirestore] Sincronização concluída");
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
  // Prevenir múltiplas sincronizações simultâneas
  if (isSyncing) {
    console.log("[SyncManager] Sync already in progress, skipping...");
    return;
  }

  try {
    isSyncing = true;
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
  } finally {
    isSyncing = false;
  }
}
