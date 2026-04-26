import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from "../lib/localStorage";
import { shouldSync, updateLastSync } from "../lib/syncManager";
import { LocalShopItem } from "../types/localStorage";
import { addPurchaseToHistory } from "./purchaseHistory";

import type { IconType, ShopItem, Purchase } from "../types/shop";
export type { IconType, ShopItem, Purchase };

/**
 * Deserializa um item do localStorage, convertendo datas de string para Date
 */
function deserializeShopItem(item: any): ShopItem {
  return {
    ...item,
    createdAt: typeof item.createdAt === "string" ? new Date(item.createdAt) : item.createdAt,
  };
}

/**
 * Converte dados do Firestore para ShopItem
 */
function firestoreToShopItem(id: string, data: any): ShopItem {
  return {
    id,
    userId: data.userId,
    name: data.name,
    description: data.description,
    iconType: data.iconType,
    iconValue: data.iconValue,
    price: data.price,
    quantity: data.quantity,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}

/**
 * Converte dados do Firestore para Purchase
 */
function firestoreToPurchase(id: string, data: any): Purchase {
  return {
    id,
    userId: data.userId,
    itemId: data.itemId,
    itemName: data.itemName,
    iconType: data.iconType,
    iconValue: data.iconValue,
    purchasedAt: data.purchasedAt?.toDate() || new Date(),
    pointsSpent: data.pointsSpent,
  };
}

/**
 * Cria um novo item na loja
 */
export async function createShopItem(
  userId: string,
  itemData: Omit<ShopItem, "id" | "userId" | "createdAt">,
): Promise<ShopItem> {
  try {
    const itemId = `${userId}_${Date.now()}`;
    const itemRef = doc(db, "shopItems", itemId);

    const newItem: ShopItem = {
      id: itemId,
      userId,
      ...itemData,
      createdAt: new Date(),
    };

    // Salvar no Firebase
    await setDoc(itemRef, {
      ...newItem,
      createdAt: Timestamp.fromDate(newItem.createdAt),
    });
    console.log("[Shop] Item criado no Firebase:", itemId);

    // Salvar no localStorage
    const localItems = loadFromLocalStorage<LocalShopItem[]>(STORAGE_KEYS.SHOP_ITEMS) || [];
    const localItem: LocalShopItem = { ...newItem, synced: true };
    localItems.push(localItem);
    const saved = saveToLocalStorage(STORAGE_KEYS.SHOP_ITEMS, localItems);
    console.log("[Shop] Item salvo no localStorage:", saved, "Total items:", localItems.length);

    return newItem;
  } catch (error) {
    console.error("Erro ao criar item da loja:", error);
    throw new Error("Não foi possível criar o item. Tente novamente.");
  }
}

/**
 * Atualiza um item existente da loja
 */
export async function updateShopItem(
  itemId: string,
  updates: Partial<Omit<ShopItem, "id" | "userId" | "createdAt">>,
): Promise<void> {
  try {
    // Atualizar no Firebase
    const itemRef = doc(db, "shopItems", itemId);
    await setDoc(itemRef, updates, { merge: true });
    console.log("[Shop] Item atualizado no Firebase:", itemId);

    // Atualizar no localStorage
    const localItems = loadFromLocalStorage<LocalShopItem[]>(STORAGE_KEYS.SHOP_ITEMS) || [];
    const updatedItems = localItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, ...updates, synced: true };
      }
      return item;
    });
    const saved = saveToLocalStorage(STORAGE_KEYS.SHOP_ITEMS, updatedItems);
    console.log("[Shop] Item atualizado no localStorage:", saved);
  } catch (error) {
    console.error("Erro ao atualizar item da loja:", error);
    throw new Error("Não foi possível atualizar o item. Tente novamente.");
  }
}

/**
 * Deleta um item da loja
 */
export async function deleteShopItem(itemId: string): Promise<void> {
  try {
    // Deletar do Firebase
    const itemRef = doc(db, "shopItems", itemId);
    await deleteDoc(itemRef);
    console.log("[Shop] Item deletado do Firebase:", itemId);

    // Deletar do localStorage
    const localItems = loadFromLocalStorage<LocalShopItem[]>(STORAGE_KEYS.SHOP_ITEMS) || [];
    const filteredItems = localItems.filter((item) => item.id !== itemId);
    const saved = saveToLocalStorage(STORAGE_KEYS.SHOP_ITEMS, filteredItems);
    console.log("[Shop] Item deletado do localStorage:", saved, "Total items:", filteredItems.length);
  } catch (error) {
    console.error("Erro ao deletar item da loja:", error);
    throw new Error("Não foi possível deletar o item. Tente novamente.");
  }
}

/**
 * Busca todos os itens da loja de um usuário
 */
export async function getUserShopItems(userId: string): Promise<ShopItem[]> {
  try {
    // Verificar se deve sincronizar com Firebase
    if (!shouldSync()) {
      console.log("[Shop] Usando itens do cache (lastSync < 20min)");
      const localItems = loadFromLocalStorage<LocalShopItem[]>(STORAGE_KEYS.SHOP_ITEMS) || [];
      // Deserializar datas e remover a flag synced antes de retornar
      return localItems
        .filter((item) => item.userId === userId && item.quantity > 0)
        .map(({ synced, ...item }) => deserializeShopItem(item))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    console.log("[Shop] Sincronizando itens com Firebase (lastSync > 20min)");
    const itemsRef = collection(db, "shopItems");
    const q = query(itemsRef, where("userId", "==", userId));

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((doc) => firestoreToShopItem(doc.id, doc.data()));

    // Salvar no localStorage
    const localItems: LocalShopItem[] = items.map((item) => ({ ...item, synced: true }));
    saveToLocalStorage(STORAGE_KEYS.SHOP_ITEMS, localItems);
    updateLastSync();

    // Ordena no cliente para evitar necessidade de índice composto
    return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Erro ao buscar itens da loja:", error);
    // Em caso de erro, tenta carregar do localStorage
    const localItems = loadFromLocalStorage<LocalShopItem[]>(STORAGE_KEYS.SHOP_ITEMS) || [];
    return localItems
      .filter((item) => item.userId === userId)
      .map(({ synced, ...item }) => deserializeShopItem(item))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

/**
 * Busca um item específico da loja
 */
export async function getShopItem(itemId: string): Promise<ShopItem | null> {
  try {
    const itemRef = doc(db, "shopItems", itemId);
    const snapshot = await getDoc(itemRef);

    if (!snapshot.exists()) {
      return null;
    }

    return firestoreToShopItem(snapshot.id, snapshot.data());
  } catch (error) {
    console.error("Erro ao buscar item da loja:", error);
    return null;
  }
}

/**
 * Realiza a compra de um item
 * Decrementa a quantidade do item e registra a compra
 * Retorna o novo saldo de pontos do usuário
 * OFFLINE-FIRST: Opera apenas no localStorage, sincroniza depois
 */
export async function purchaseItem(userId: string, itemId: string, currentPoints: number): Promise<number> {
  try {
    // Carregar itens do localStorage
    const localItems = loadFromLocalStorage<LocalShopItem[]>(STORAGE_KEYS.SHOP_ITEMS) || [];
    const item = localItems.find((i) => i.id === itemId);

    if (!item) {
      throw new Error("Item não encontrado.");
    }

    // Validações
    if (item.quantity <= 0) {
      throw new Error("Item esgotado.");
    }

    if (currentPoints < item.price) {
      throw new Error("Pontos insuficientes.");
    }

    // Decrementa a quantidade do item no localStorage
    const updatedItems = localItems.map((i) => {
      if (i.id === itemId) {
        return { ...i, quantity: i.quantity - 1, synced: false };
      }
      return i;
    });
    saveToLocalStorage(STORAGE_KEYS.SHOP_ITEMS, updatedItems);

    // Registra a compra no histórico local
    const purchase: Purchase = {
      id: `${userId}_${Date.now()}`,
      userId,
      itemId,
      itemName: item.name,
      iconType: item.iconType,
      iconValue: item.iconValue,
      purchasedAt: new Date(),
      pointsSpent: item.price,
    };
    addPurchaseToHistory(purchase);

    // Calcula novos pontos (não atualiza Firebase aqui)
    const newPoints = currentPoints - item.price;

    console.log("[Shop] Compra registrada offline. Sync pendente.");
    return newPoints;
  } catch (error) {
    console.error("Erro ao comprar item:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Não foi possível completar a compra. Tente novamente.");
  }
}

/**
 * Busca o histórico de compras de um usuário
 */
export async function getUserPurchases(userId: string, limitCount: number = 50): Promise<Purchase[]> {
  try {
    const purchasesRef = collection(db, "purchases");
    const q = query(purchasesRef, where("userId", "==", userId), orderBy("purchasedAt", "desc"), limit(limitCount));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => firestoreToPurchase(doc.id, doc.data()));
  } catch (error) {
    console.error("Erro ao buscar histórico de compras:", error);
    return [];
  }
}

/**
 * Define a senha do pai no Firestore
 */
export async function setParentPassword(userId: string, password: string): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { parentPassword: password });
  } catch (error) {
    console.error("Erro ao salvar senha do pai:", error);
    throw new Error("Não foi possível salvar a senha. Tente novamente.");
  }
}

/**
 * Valida a senha do pai
 */
export function validateParentPassword(storedPassword: string, inputPassword: string): boolean {
  return storedPassword === inputPassword;
}
