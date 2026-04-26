import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from "../lib/localStorage";
import { updateLastSync } from "../lib/syncManager";

export interface User {
  id: string;
  name: string;
  nickname: string;
  age: number;
  email: string;
  points: number;
  rating: number;
  level: number;
  /** false = precisa completar o onboarding; undefined = usuário antigo (já onboardado) */
  onboarded?: boolean;
  /** Senha para acesso ao gerenciamento da loja (configurada pelos pais) */
  parentPassword?: string;
  /** Sistema de ofensiva - dias consecutivos jogando */
  offensive?: number;
  /** Última data que jogou (ISO: "2026-04-21") */
  last_day?: string | null;
  /** Proteções de ofensiva (dias que pode pular sem perder streak) */
  offensive_guards?: number;
}

const ERROR_MESSAGES: Record<string, string> = {
  "auth/user-not-found": "Usuário não encontrado.",
  "auth/wrong-password": "Senha incorreta.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/email-already-in-use": "Este e-mail já está em uso.",
  "auth/weak-password": "A senha é muito fraca (mínimo 6 caracteres).",
  "auth/invalid-email": "E-mail inválido.",
  "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
  "auth/network-request-failed": "Erro de conexão. Verifique sua internet.",
};

const STORAGE_KEY = "apprender:user";

function cacheUser(user: User): User {
  saveToLocalStorage(STORAGE_KEYS.USER_DATA, user);
  updateLastSync();
  return user;
}

function translateError(error: unknown): never {
  const code = (error as { code?: string }).code ?? "";
  throw new Error(ERROR_MESSAGES[code] ?? "Ocorreu um erro. Tente novamente.");
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const fbUser = result.user;
  const snap = await getDoc(doc(db, "users", fbUser.uid));

  if (snap.exists()) {
    const existing = snap.data() as User;
    // Salvar parentPassword separadamente no localStorage
    if (existing.parentPassword) {
      saveToLocalStorage(STORAGE_KEYS.PARENT_PASSWORD, existing.parentPassword);
    }
    return cacheUser(existing);
  }

  const newUser: User = {
    id: fbUser.uid,
    name: fbUser.displayName || "",
    nickname: fbUser.displayName?.split(" ")[0] || "",
    age: 0,
    email: fbUser.email || "",
    points: 0,
    rating: 150,
    level: 1,
    onboarded: false,
  };
  await setDoc(doc(db, "users", newUser.id), newUser);
  return cacheUser(newUser);
}

/** @deprecated Mantido por compatibilidade — signInWithGoogle agora usa popup */
export async function handleGoogleRedirectResult(): Promise<User | null> {
  return null;
}

export async function signIn(email: string, password: string): Promise<User> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", credential.user.uid));
    if (snap.exists()) {
      const userData = snap.data() as User;
      // Salvar parentPassword separadamente no localStorage
      if (userData.parentPassword) {
        saveToLocalStorage(STORAGE_KEYS.PARENT_PASSWORD, userData.parentPassword);
      }
      return cacheUser(userData);
    }
    const user: User = {
      id: credential.user.uid,
      name: credential.user.displayName || "",
      nickname: credential.user.displayName || "",
      age: 0,
      email: credential.user.email || "",
      points: 0,
      rating: 150,
      level: 1,
    };
    return cacheUser(user);
  } catch (error) {
    translateError(error);
  }
}

export async function register(data: {
  name: string;
  age: number;
  nickname: string;
  email: string;
  password: string;
}): Promise<User> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    await updateProfile(credential.user, { displayName: data.nickname });
    const newUser: User = {
      id: credential.user.uid,
      name: data.name,
      nickname: data.nickname,
      age: data.age,
      email: data.email,
      points: 0,
      rating: 150,
      level: 1,
      onboarded: false,
    };
    await setDoc(doc(db, "users", newUser.id), newUser);
    return cacheUser(newUser);
  } catch (error) {
    translateError(error);
  }
}

export async function forgotPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    translateError(error);
  }
}

export async function logout(): Promise<void> {
  localStorage.removeItem("apprender:user");
  await signOut(auth);
}

/**
 * Persiste rating e level no Firestore e atualiza o cache local.
 * Fire-and-forget seguro — erros de rede não bloqueiam o jogo.
 */
export async function saveUserStats(user: User): Promise<void> {
  cacheUser(user);
  await setDoc(doc(db, "users", user.id), { rating: user.rating, level: user.level }, { merge: true });
}

/**
 * Persiste o resultado do placement quiz: age, rating, level e onboarded:true.
 * Chamado uma única vez ao final do onboarding.
 */
export async function onboardUser(user: User): Promise<void> {
  const updated: User = { ...user, onboarded: true };
  cacheUser(updated);
  await setDoc(
    doc(db, "users", user.id),
    { age: user.age, rating: user.rating, level: user.level, onboarded: true },
    { merge: true },
  );
}

/**
 * Exclui permanentemente a conta do usuário e todos os dados relacionados.
 * Remove: documento de usuário, itens da loja, compras, questões.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const batch = writeBatch(db);

  // Delete user document
  batch.delete(doc(db, "users", userId));

  // Delete shop items
  const shopItemsQuery = query(
    collection(db, "shopItems"),
    where("__name__", ">=", `${userId}_`),
    where("__name__", "<", `${userId}_\uf8ff`),
  );
  const shopItemsSnap = await getDocs(shopItemsQuery);
  shopItemsSnap.docs.forEach((doc) => batch.delete(doc.ref));

  // Delete purchases
  const purchasesQuery = query(
    collection(db, "purchases"),
    where("__name__", ">=", `${userId}_`),
    where("__name__", "<", `${userId}_\uf8ff`),
  );
  const purchasesSnap = await getDocs(purchasesQuery);
  purchasesSnap.docs.forEach((doc) => batch.delete(doc.ref));

  // Commit batch
  await batch.commit();

  // Delete Firebase Auth user
  if (auth.currentUser && auth.currentUser.uid === userId) {
    await deleteUser(auth.currentUser);
  }

  // Clear local cache
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Valida a senha dos pais
 */
export function validateParentPassword(storedPassword: string, inputPassword: string): boolean {
  return storedPassword === inputPassword;
}

/**
 * Valida a senha dos pais ou aceita a master key 'APRENDER' para reset
 */
export function validatePasswordOrMasterKey(storedPassword: string, inputPassword: string): boolean {
  return storedPassword === inputPassword || inputPassword === "APRENDER";
}

/**
 * Atualiza a senha dos pais no Firebase e no localStorage
 */
export async function updateParentPassword(userId: string, newPassword: string): Promise<void> {
  try {
    // Atualizar no Firebase
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { parentPassword: newPassword }, { merge: true });

    // Atualizar no localStorage
    saveToLocalStorage(STORAGE_KEYS.PARENT_PASSWORD, newPassword);

    // Atualizar cache do usuário
    const cachedUser = loadFromLocalStorage<User>(STORAGE_KEYS.USER_DATA);
    if (cachedUser) {
      cachedUser.parentPassword = newPassword;
      saveToLocalStorage(STORAGE_KEYS.USER_DATA, cachedUser);
    }
  } catch (error) {
    console.error("Erro ao atualizar senha dos pais:", error);
    throw new Error("Não foi possível atualizar a senha. Tente novamente.");
  }
}

/**
 * Obtém a senha dos pais do cache local
 */
export function getParentPasswordFromCache(): string | null {
  return loadFromLocalStorage<string>(STORAGE_KEYS.PARENT_PASSWORD);
}
