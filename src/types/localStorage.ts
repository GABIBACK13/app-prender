import { type User } from "../models/auth";
import { type ShopItem, type Purchase } from "./shop";

export type SyncStatus = "synced" | "pending" | "error";

/**
 * User data stored in localStorage with sync metadata
 */
export interface LocalUserData extends User {
  syncStatus: SyncStatus;
  lastModified: number; // timestamp
}

/**
 * ShopItem stored in localStorage with sync flag
 */
export interface LocalShopItem extends ShopItem {
  synced: boolean;
}

/**
 * Purchase stored in localStorage with sync flag
 */
export interface LocalPurchase extends Purchase {
  synced: boolean;
}

/**
 * Purchase history metadata
 */
export interface PurchaseHistoryData {
  purchases: LocalPurchase[];
  lastSync: number; // timestamp
}
