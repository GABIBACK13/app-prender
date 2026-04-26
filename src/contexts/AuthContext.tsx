import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { type User } from "../models/auth";
import { shouldSync, updateLastSync } from "../lib/syncManager";
import { loadFromLocalStorage, saveToLocalStorage, STORAGE_KEYS } from "../lib/localStorage";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  patchUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  patchUser: () => {},
});

const STORAGE_KEY = "apprender:user";

function getCachedUser(): User | null {
  return loadFromLocalStorage<User>(STORAGE_KEYS.USER_DATA);
}

function setCachedUser(user: User | null): void {
  if (user) {
    saveToLocalStorage(STORAGE_KEYS.USER_DATA, user);
  } else {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }
}

async function fetchUserFromFirestore(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) return snap.data() as User;
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const cached = getCachedUser();
  const [user, setUser] = useState<User | null>(cached);
  // Se já há cache, não mostra tela de loading
  const [loading, setLoading] = useState<boolean>(!cached);

  async function refreshUser(): Promise<void> {
    const fbUser = auth.currentUser;
    if (!fbUser) return;

    // Verificar se deve sincronizar com o Firebase
    if (!shouldSync()) {
      console.log("[AuthContext] Usando dados do cache (lastSync < 20min)");
      return;
    }

    console.log("[AuthContext] Sincronizando com Firebase (lastSync > 20min)");
    const fresh = await fetchUserFromFirestore(fbUser.uid);
    if (fresh) {
      setUser(fresh);
      setCachedUser(fresh);
      updateLastSync();
    }
  }

  function patchUser(updates: Partial<User>): void {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      setCachedUser(updated);
      return updated;
    });
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        // Usuário deslogou ou sessão expirou
        setUser(null);
        setCachedUser(null);
        setLoading(false);
        return;
      }

      const cached = getCachedUser();

      if (cached && cached.id === fbUser.uid) {
        // Sessão restaurada com cache válido
        setUser(cached);
        setLoading(false);

        // Verificar se deve sincronizar com Firebase
        if (shouldSync()) {
          console.log("[AuthContext] Sincronizando dados do usuário com Firebase...");
          try {
            const profile = await fetchUserFromFirestore(fbUser.uid);
            if (profile) {
              setCachedUser(profile);
              setUser(profile);
              updateLastSync();
            }
          } catch (error) {
            console.error("[AuthContext] Erro ao sincronizar:", error);
          }
        } else {
          console.log("[AuthContext] Usando cache local (lastSync < 20min)");
        }
        return;
      }

      // Primeiro login ou cache de outro usuário — busca no Firestore
      try {
        const profile = await fetchUserFromFirestore(fbUser.uid);
        if (profile) {
          setCachedUser(profile);
          setUser(profile);
          updateLastSync();
        } else {
          // Documento não existe ainda — criar
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
          await setDoc(doc(db, "users", fbUser.uid), newUser);
          setCachedUser(newUser);
          setUser(newUser);
          updateLastSync();
        }
      } catch {
        setUser(null);
        setCachedUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={{ user, loading, refreshUser, patchUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
