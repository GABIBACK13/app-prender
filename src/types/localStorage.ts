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

/**
 * Progresso diário do jogador — persiste entre recargas
 */
export interface DailyProgress {
  date: string;          // "YYYY-MM-DD" — invalida dados de outros dias
  questionsCount: number;
  correctCount: number;
  completed: boolean;
}

/**
 * Registro de cada resposta dada no modo Play
 */
export interface AnswerRecord {
  id: string;
  user_id: string;
  question: string;       // e.g. "5 + 5" ou "Número: 7"
  answer: number;         // alternativa escolhida pelo usuário
  alternatives: number[];
  is_correct: boolean;
  reward_xp: number;      // pontos ganhos/perdidos
  question_rating: number;
  user_rating: number;    // rating do usuário APÓS a resposta
  bonus: number;          // % da barra de timer (0-100)
  current_stack: number;  // streak em acertos seguidos no momento
  data_registro: string;  // ISO datetime
  synced: boolean;
}
