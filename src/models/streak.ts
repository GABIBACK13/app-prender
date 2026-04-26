import { saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from "../lib/localStorage";
import type { User } from "./auth";
import streakMilestones from "../data/streakMilestones.json";

export interface StreakUpdate {
  offensive: number;
  last_day: string;
  offensive_guards: number;
  milestoneReached?: {
    streak: number;
    type: "points" | "guard" | "xp" | "badge";
    value: number | string;
    label: string;
  };
}

/**
 * Retorna a data de hoje no formato ISO (YYYY-MM-DD)
 */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Calcula a diferença em dias entre last_day e hoje
 * @returns número de dias (0 = hoje, 1 = ontem, 2+ = antes de ontem)
 */
function getDayDiff(lastDay: string | null | undefined): number {
  if (!lastDay) return -1;

  const last = new Date(lastDay + "T00:00:00");
  const today = new Date(todayISO() + "T00:00:00");

  const diffMs = today.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Atualiza a ofensiva do usuário com base na última atividade
 */
export function updateStreak(user: User): StreakUpdate {
  const diff = getDayDiff(user.last_day);

  // 🆕 primeiro acesso
  if (diff === -1) {
    return {
      offensive: 1,
      last_day: todayISO(),
      offensive_guards: user.offensive_guards ?? 0,
    };
  }

  // ✅ já jogou hoje
  if (diff === 0) {
    return {
      offensive: user.offensive ?? 1,
      last_day: user.last_day ?? todayISO(),
      offensive_guards: user.offensive_guards ?? 0,
    };
  }

  // 🔥 manteve streak (ontem)
  if (diff === 1) {
    const newOffensive = (user.offensive ?? 0) + 1;
    const milestone = checkMilestone(newOffensive);

    return {
      offensive: newOffensive,
      last_day: todayISO(),
      offensive_guards: user.offensive_guards ?? 0,
      milestoneReached: milestone,
    };
  }

  // ⚠️ perdeu dias
  const daysMissed = diff - 1;
  let guards = (user.offensive_guards ?? 0) - daysMissed;

  if (guards >= 0) {
    const newOffensive = (user.offensive ?? 0) + 1;
    const milestone = checkMilestone(newOffensive);

    return {
      offensive: newOffensive,
      offensive_guards: guards,
      last_day: todayISO(),
      milestoneReached: milestone,
    };
  }

  // 💀 streak quebrada
  return {
    offensive: 1,
    last_day: todayISO(),
    offensive_guards: 0,
  };
}

/**
 * Verifica se atingiu um milestone e retorna a recompensa
 */
function checkMilestone(newStreak: number) {
  const milestone = streakMilestones.find((m) => m.streak === newStreak);

  if (!milestone) return undefined;

  return {
    streak: milestone.streak,
    type: milestone.reward.type as "points" | "guard" | "xp" | "badge",
    value: milestone.reward.value,
    label: milestone.reward.label,
  };
}

/**
 * Calcula o bônus de pontos e XP baseado na ofensiva
 * Formula: base * (1 + offensive * 0.01)
 */
export function applyStreakBonus(
  basePoints: number,
  baseXP: number,
  offensive: number,
): { bonusPoints: number; bonusXP: number; multiplier: number } {
  const multiplier = 1 + offensive * 0.01;

  return {
    bonusPoints: Math.floor(basePoints * multiplier),
    bonusXP: baseXP * multiplier,
    multiplier,
  };
}

/**
 * Salva a atualização de streak no localStorage
 * NÃO atualiza Firebase aqui - isso será feito pela sincronização global
 */
export async function saveStreak(userId: string, streakData: StreakUpdate): Promise<void> {
  // Atualizar cache local
  const cachedUser = loadFromLocalStorage<User>(STORAGE_KEYS.USER_DATA);
  if (cachedUser && cachedUser.id === userId) {
    const updatedUser: User = {
      ...cachedUser,
      offensive: streakData.offensive,
      last_day: streakData.last_day,
      offensive_guards: streakData.offensive_guards,
    };
    saveToLocalStorage(STORAGE_KEYS.USER_DATA, updatedUser);
    console.log("[Streak] Dados de streak salvos no localStorage (sync pendente)");
  }
}

/**
 * Aplica recompensa de milestone no usuário (apenas localStorage)
 * A sincronização com Firebase acontecerá posteriormente
 */
export async function applyMilestoneReward(
  userId: string,
  user: User,
  milestone: NonNullable<StreakUpdate["milestoneReached"]>,
): Promise<Partial<User>> {
  const updates: Partial<User> = {};

  switch (milestone.type) {
    case "points":
      updates.points = (user.points ?? 0) + (milestone.value as number);
      break;

    case "guard":
      updates.offensive_guards = (user.offensive_guards ?? 0) + (milestone.value as number);
      break;

    case "xp":
      updates.level = (user.level ?? 1) + (milestone.value as number) / 100;
      break;

    case "badge":
      // TODO: implementar sistema de badges no futuro
      console.log(`🏆 Badge desbloqueado: ${milestone.value}`);
      break;
  }

  // Atualizar localStorage imediatamente
  if (Object.keys(updates).length > 0) {
    const cachedUser = loadFromLocalStorage<User>(STORAGE_KEYS.USER_DATA);
    if (cachedUser && cachedUser.id === userId) {
      const updatedUser: User = { ...cachedUser, ...updates };
      saveToLocalStorage(STORAGE_KEYS.USER_DATA, updatedUser);
      console.log("[Milestone] Recompensa aplicada no localStorage (sync pendente)");
    }
  }

  return updates;
}
