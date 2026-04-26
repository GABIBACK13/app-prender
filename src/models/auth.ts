import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, writeBatch, orderBy, limit, Timestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from "../lib/localStorage";
import { updateLastSync, syncFirestore } from "../lib/syncManager";

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

async function fetchAndCacheLoginData(userId: string): Promise<void> {
  // Shop items
  const shopSnap = await getDocs(query(collection(db, "shopItems"), where("userId", "==", userId)));
  const shopItems = shopSnap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt ?? 0),
      synced: true,
    };
  });
  saveToLocalStorage(STORAGE_KEYS.SHOP_ITEMS, shopItems);

  // Purchase history (últimas 50 compras)
  try {
    const purchasesSnap = await getDocs(
      query(collection(db, "purchases"), where("userId", "==", userId), orderBy("purchasedAt", "desc"), limit(50)),
    );
    const purchases = purchasesSnap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        purchasedAt: data.purchasedAt instanceof Timestamp ? data.purchasedAt.toDate() : new Date(data.purchasedAt ?? 0),
        synced: true,
      };
    });
    saveToLocalStorage(STORAGE_KEYS.PURCHASE_HISTORY, { purchases, lastSync: Date.now() });
  } catch {
    // Regras do Firestore podem bloquear a query de purchases — ignorar silenciosamente
  }
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

  let user: User;
  if (snap.exists()) {
    user = snap.data() as User;
    if (user.parentPassword) {
      saveToLocalStorage(STORAGE_KEYS.PARENT_PASSWORD, user.parentPassword);
    }
  } else {
    user = {
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
    await setDoc(doc(db, "users", user.id), user);
  }
  cacheUser(user);
  await fetchAndCacheLoginData(fbUser.uid);
  return user;
}

/** @deprecated Mantido por compatibilidade — signInWithGoogle agora usa popup */
export async function handleGoogleRedirectResult(): Promise<User | null> {
  return null;
}

export async function signIn(email: string, password: string): Promise<User> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", credential.user.uid));
    let user: User;
    if (snap.exists()) {
      user = snap.data() as User;
      if (user.parentPassword) {
        saveToLocalStorage(STORAGE_KEYS.PARENT_PASSWORD, user.parentPassword);
      }
    } else {
      user = {
        id: credential.user.uid,
        name: credential.user.displayName || "",
        nickname: credential.user.displayName || "",
        age: 0,
        email: credential.user.email || "",
        points: 0,
        rating: 150,
        level: 1,
      };
    }
    cacheUser(user);
    await fetchAndCacheLoginData(credential.user.uid);
    return user;
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
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      await syncFirestore(currentUser.uid);
    } catch {
      // ignorar erros de sync — prosseguir com logout de qualquer forma
    }
  }
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(STORAGE_KEY);
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
 * Deve ser chamado APÓS reautenticação bem-sucedida.
 * Remove: documento de usuário, itens da loja, sessão Auth e cache local.
 * Compras não podem ser deletadas client-side (regra Firestore: delete: if false).
 */
export async function deleteAccount(userId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, "users", userId));

  const shopItemsSnap = await getDocs(
    query(collection(db, "shopItems"), where("userId", "==", userId)),
  );
  shopItemsSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  const currentUser = auth.currentUser;
  if (currentUser && currentUser.uid === userId) {
    await deleteUser(currentUser);
  }

  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(STORAGE_KEY);
  await signOut(auth);
}

/** Reautentica o usuário atual com e-mail e senha. */
export async function reauthenticateUser(email: string, password: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Usuário não autenticado.");
  const credential = EmailAuthProvider.credential(email, password);
  try {
    await reauthenticateWithCredential(currentUser, credential);
  } catch (error) {
    translateError(error);
  }
}

/** Reautentica o usuário atual via popup do Google. */
export async function reauthenticateGoogle(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Usuário não autenticado.");
  try {
    await reauthenticateWithPopup(currentUser, new GoogleAuthProvider());
  } catch (error) {
    translateError(error);
  }
}

/** Retorna true se o usuário atual fez login via Google. */
export function isGoogleUser(): boolean {
  return auth.currentUser?.providerData.some((p) => p.providerId === "google.com") ?? false;
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
