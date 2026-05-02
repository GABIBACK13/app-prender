import type { User } from "./auth";
import { applyStreakBonus } from "./streak";

// ─── Tipos exportados ────────────────────────────────────────────────────────

export type QuestionType = "ask_number" | "+" | "-" | "*" | "/";
export type MaxValue = 5 | 10 | 50 | 500;
export type ModifierType = "normal" | "negative";

export interface Question {
  type: QuestionType;
  /** Apenas ask_number — caminho para o áudio */
  audio?: string;
  /** Apenas aritmética — primeiro operando */
  a?: number;
  /** Apenas aritmética — segundo operando */
  b?: number;
  answer: number;
  /** 4 opções embaralhadas (correta + 3 erradas) */
  options: number[];
  questionRating: number;
  /** Metadados usados na geração (para debug e recálculo) */
  maxStr: string;
  modifier: ModifierType;
}

/** Metadados do processo de geração, úteis para debug. */
export interface QuestionMeta {
  score: number;
  minQR: number;
  maxQR: number;
  pool: Partial<Record<QuestionType, number>>;
  maxDist: Record<string, number>;
  modDist: Record<ModifierType, number>;
}

export type QuestionResult = Question & { meta: QuestionMeta };

// ─── Constantes de rating ────────────────────────────────────────────────────

const TYPE_RATING: Record<QuestionType, number> = {
  ask_number: 1000,
  "+": 1700,
  "-": 2000,
  "*": 3000,
  "/": 4000,
};

const MAX_RATING: Record<string, number> = {
  "5": 300,
  "10": 600,
  "50": 3000,
  "500": 8000,
};

const MODIFIER_RATING: Record<ModifierType, number> = {
  normal: 0,
  negative: 1250,
};

// ─── Utilitários internos ────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  if (min > max) [min, max] = [max, min];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalize(weights: Record<string, number>): Record<string, number> {
  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  if (total <= 0) return { ...weights };
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(weights)) result[k] = (v / total) * 100;
  return result;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function weightedRandom<T extends string>(weights: Record<T, number>): T {
  const keys = Object.keys(weights) as T[];
  const total = keys.reduce((s, k) => s + weights[k], 0);
  if (total <= 0) return keys[0];
  let r = Math.random() * total;
  for (const key of keys) {
    r -= weights[key];
    if (r <= 0) return key;
  }
  return keys[keys.length - 1];
}

/**
 * Gera `count` números errados únicos, diferentes de `correct`.
 * `rangeHint` é usado para calibrar o delta máximo.
 */
function generateWrongOptions(correct: number, rangeHint: number, count: number): number[] {
  const maxDelta = Math.max(5, Math.floor(Math.abs(rangeHint) * 0.5));
  const candidates: number[] = [];
  for (let delta = 1; delta <= maxDelta && candidates.length < count * 4; delta++) {
    candidates.push(correct + delta, correct - delta);
  }
  const unique = shuffle(candidates.filter((v, i, a) => a.indexOf(v) === i && v !== correct));
  return unique.slice(0, count);
}

// ─── Sistema de brackets ─────────────────────────────────────────────────────
//
// score = user.age × user.rating
//
// Cada bracket define pesos base no início da faixa e deltas opcionais
// aplicados a cada `per` pontos de score acima do início.
// Valores nunca ficam negativos. max e modifier são normalizados antes do sorteio.

interface BracketDelta {
  per: number;
  changes: Record<string, number>;
}

interface Bracket {
  scoreMin: number;
  pool: Partial<Record<QuestionType, number>>;
  poolDelta?: BracketDelta;
  maxDist: Record<string, number>;
  maxDelta?: BracketDelta;
  modifier: Record<ModifierType, number>;
  modifierDelta?: BracketDelta;
}

const BRACKETS: readonly Bracket[] = [
  // ── 0–649: somente números falados ────────────────────────────────────────
  {
    scoreMin: 0,
    pool: { ask_number: 10 },
    maxDist: { "5": 100 },
    modifier: { normal: 100, negative: 0 },
  },
  {
    scoreMin: 650,
    pool: { ask_number: 10, "+": 0 },
    poolDelta: { per: 100, changes: { ask_number: -1, "+": 1 } },
    maxDist: { "5": 100 },
    modifier: { normal: 100, negative: 0 },
  },
  {
    scoreMin: 1250,
    pool: { ask_number: 4, "+": 6, "-": 0 },
    poolDelta: { per: 100, changes: { ask_number: -1, "+": 1 } },
    maxDist: { "5": 100, "10": 0 },
    maxDelta: { per: 100, changes: { "5": -10, "10": 10 } },
    modifier: { normal: 100, negative: 0 },
  },
  {
    scoreMin: 1750,
    pool: { "+": 9, "-": 1 },
    poolDelta: { per: 100, changes: { "+": -1, "-": 1 } },
    maxDist: { "10": 100 },
    modifier: { normal: 100, negative: 0 },
  },
  {
    scoreMin: 2250,
    pool: { "+": 5, "-": 5, "*": 0 },
    poolDelta: { per: 200, changes: { "-": -1, "*": 1, "+": 1 } },
    maxDist: { "5": 30, "10": 70 },
    maxDelta: { per: 100, changes: { "5": -10, "10": 10 } },
    modifier: { normal: 95, negative: 5 },
    modifierDelta: { per: 100, changes: { normal: -5, negative: 5 } },
  },
  {
    scoreMin: 2750,
    pool: { "-": 2, "*": 3, "/": 1, "+": 4 },
    poolDelta: { per: 100, changes: { "/": 1, "+": 1 } },
    maxDist: { "10": 95, "50": 5 },
    maxDelta: { per: 100, changes: { "10": -5, "50": 5 } },
    modifier: { normal: 90, negative: 10 },
    modifierDelta: { per: 100, changes: { normal: -5, negative: 5 } },
  },
  {
    scoreMin: 3250,
    pool: { "-": 3, "*": 5, "/": 4, "+": 6 },
    poolDelta: { per: 100, changes: { "*": -1, "/": 1, "+": 1 } },
    maxDist: { "10": 95, "50": 5 },
    maxDelta: { per: 100, changes: { "10": -2, "50": 2 } },
    modifier: { normal: 80, negative: 20 },
    modifierDelta: { per: 100, changes: { normal: -5, negative: 5 } },
  },
  {
    scoreMin: 3950,
    pool: { "*": 6, "/": 3, "+": 5, "-": 2 },
    poolDelta: { per: 200, changes: { "*": 1, "/": 1, "+": 1, "-": 1 } },
    maxDist: { "10": 85, "50": 10, "500": 5 },
    maxDelta: { per: 250, changes: { "10": -5, "50": 5 } },
    modifier: { normal: 70, negative: 30 },
  },
];

function getBracket(score: number): { bracket: Bracket; above: number } {
  let bracket = BRACKETS[0];
  for (const b of BRACKETS) {
    if (score >= b.scoreMin) bracket = b;
    else break;
  }
  return { bracket, above: score - bracket.scoreMin };
}

/**
 * Aplica deltas às propriedades base, clampando valores em 0.
 * Inclui chaves que existem em changes mas não em base.
 */
function applyDelta(
  base: Record<string, number>,
  delta: BracketDelta | undefined,
  scoreAbove: number,
): Record<string, number> {
  if (!delta) return { ...base };
  const steps = Math.floor(scoreAbove / delta.per);
  const allKeys = new Set([...Object.keys(base), ...Object.keys(delta.changes)]);
  const result: Record<string, number> = {};
  for (const key of allKeys) {
    result[key] = Math.max(0, (base[key] ?? 0) + (delta.changes[key] ?? 0) * steps);
  }
  return result;
}

function getPool(score: number): Record<QuestionType, number> {
  const { bracket, above } = getBracket(score);
  return applyDelta(bracket.pool as Record<string, number>, bracket.poolDelta, above) as Record<QuestionType, number>;
}

function getMaxDistribution(score: number): Record<string, number> {
  const { bracket, above } = getBracket(score);
  return normalize(applyDelta(bracket.maxDist, bracket.maxDelta, above));
}

function getModifier(score: number): Record<ModifierType, number> {
  const { bracket, above } = getBracket(score);
  const raw = applyDelta(bracket.modifier as Record<string, number>, bracket.modifierDelta, above);
  // Garante que "negative" nunca ultrapasse 50%
  if ((raw.negative ?? 0) > 50) {
    const excess = (raw.negative ?? 0) - 50;
    raw.negative = 50;
    raw.normal = (raw.normal ?? 0) + excess;
  }
  return normalize(raw) as Record<ModifierType, number>;
}

// ─── Cálculo de rating da questão ────────────────────────────────────────────

function calculateQuestionRating(type: QuestionType, maxStr: string, modifier: ModifierType, age: number): number {
  return Math.round((TYPE_RATING[type] + (MAX_RATING[maxStr] ?? 500) + MODIFIER_RATING[modifier]) / age);
}

// ─── buildQuestion ───────────────────────────────────────────────────────────

function buildQuestion(type: QuestionType, maxStr: string, mod: ModifierType, age: number): Question {
  const max = Number(maxStr) as MaxValue;
  const questionRating = calculateQuestionRating(type, maxStr, mod, age);
  const isNegative = mod === "negative";

  if (type === "ask_number") {
    const n = randomInt(1, max);
    const wrongs = generateWrongOptions(n, max, 3);
    return {
      type,
      audio: `/audio/numbers/${n}.mp3`,
      answer: n,
      options: shuffle([n, ...wrongs]),
      questionRating,
      maxStr,
      modifier: mod,
    };
  }

  if (type === "/") {
    const b = randomInt(1, max);
    const answer = randomInt(1, Math.max(1, Math.floor(max / b)));
    const a = b * answer;
    const sign = isNegative ? -1 : 1;
    const wrongs = generateWrongOptions(answer * sign, max, 3);
    return {
      type,
      a: a * sign,
      b,
      answer: answer * sign,
      options: shuffle([answer * sign, ...wrongs]),
      questionRating,
      maxStr,
      modifier: mod,
    };
  }

  if (type === "*") {
    const aSign = isNegative ? -1 : 1;
    const a = randomInt(1, max) * aSign;
    const b = randomInt(1, max);
    const answer = a * b;
    const wrongs = generateWrongOptions(answer, Math.abs(a) * b, 3);
    return {
      type,
      a,
      b,
      answer,
      options: shuffle([answer, ...wrongs]),
      questionRating,
      maxStr,
      modifier: mod,
    };
  }

  if (type === "+") {
    const aSign = isNegative ? -1 : 1;
    const a = randomInt(0, max) * aSign;
    const b = randomInt(0, max);
    const answer = a + b;
    const wrongs = generateWrongOptions(answer, max, 3);
    return {
      type,
      a,
      b,
      answer,
      options: shuffle([answer, ...wrongs]),
      questionRating,
      maxStr,
      modifier: mod,
    };
  }

  // type === '-'
  const bSign = isNegative ? -1 : 1;
  const a = randomInt(0, max);
  const b = randomInt(0, max) * bSign;
  const answer = a - b;
  const wrongs = generateWrongOptions(answer, max, 3);
  return {
    type,
    a,
    b,
    answer,
    options: shuffle([answer, ...wrongs]),
    questionRating,
    maxStr,
    modifier: mod,
  };
}

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Retorna os pesos actuais do pool para o usuário (apenas tipos com peso > 0).
 * Útil para exibir o estado da pool na UI.
 */
export function getQuestionPool(user: User): Partial<Record<QuestionType, number>> {
  const score = user.age * user.rating;
  const raw = getPool(score);
  const result: Partial<Record<QuestionType, number>> = {};
  for (const [k, v] of Object.entries(raw) as [QuestionType, number][]) {
    if (v > 0) result[k] = v;
  }
  return result;
}

/**
 * Gera a fila de tipos para uma rodada: array embaralhado com um elemento
 * por unidade de peso de cada tipo no pool atual.
 */
export function generateRoundQueue(user: User): QuestionType[] {
  const score = user.age * user.rating;
  const pool = getPool(score);
  const queue: QuestionType[] = [];
  for (const [type, count] of Object.entries(pool) as [QuestionType, number][]) {
    for (let i = 0; i < Math.round(count); i++) queue.push(type);
  }
  return shuffle(queue);
}

/**
 * Gera uma questão do tipo forçado, respeitando a janela de rating.
 * Se após 30 tentativas nenhuma entrar na janela, retorna a última sem filtro.
 */
export function generateQuestion(user: User, forcedType: QuestionType): QuestionResult {
  const score = (user.age - 2) * user.rating;
  const pool = getPool(score);
  const maxDist = getMaxDistribution(score);
  const modDist = getModifier(score);

  const minQR = user.rating - 100;
  const maxQR = user.rating + 200;

  const meta: QuestionMeta = { score, minQR, maxQR, pool, maxDist, modDist };

  for (let i = 0; i < 30; i++) {
    const maxStr = weightedRandom(maxDist);
    const mod = weightedRandom(modDist) as ModifierType;
    const q = buildQuestion(forcedType, maxStr, mod, user.age);
    if (q.questionRating >= minQR && q.questionRating <= maxQR) return { ...q, meta };
  }

  // Fallback sem filtro de janela para não bloquear o jogo
  const q = buildQuestion(forcedType, weightedRandom(maxDist), weightedRandom(modDist) as ModifierType, user.age);
  return { ...q, meta };
}

/**
 * Calcula os novos valores de `rating` e `level` após o usuário responder.
 * Usa a diferença entre o rating da questão e o score atual para escalar o ajuste.
 *
 * Retorna `Pick<User, 'rating' | 'level'>` — aplique com setDoc merge + cacheUser.
 */
export function updateUserAfterAnswer(
  user: User,
  questionRating: number,
  correct: boolean,
  multiplier = 1,
): Pick<User, "rating" | "level" | "points"> {
  const diff = questionRating - user.rating;

  // Normaliza diff para [-1, +1] usando ±150 como referência (cobre a janela típica).
  // t > 0 → questão difícil: acertar vale mais, errar custa menos.
  // t < 0 → questão fácil: acertar vale menos, errar custa mais.
  const t = Math.max(-1, Math.min(1, diff / 150));

  const ratingGain = Math.max(1, Math.round((2 + t * 8) * multiplier));
  const ratingLoss = Math.max(1, Math.round((10 - t * 8) * multiplier));

  const rawRating = correct ? user.rating + ratingGain : user.rating - ratingLoss;

  // Level nunca diminui — apenas acertos o avançam.
  const baseLevelGain = correct ? Math.max(0.01, 3 * (1 + (diff / 100) * 0.02)) : 0;

  // Pontos base = XP ganho * 2 (arredondado para baixo)
  const basePointsGained = Math.floor(baseLevelGain * 2);

  // Aplica bônus de streak se houver offensive
  const { bonusPoints, bonusXP } = applyStreakBonus(basePointsGained, baseLevelGain, user.offensive ?? 0);

  return {
    rating: Math.max(1, Math.round(rawRating)),
    level: Math.round((user.level + bonusXP) * 100) / 100,
    points: user.points + bonusPoints,
  };
}
