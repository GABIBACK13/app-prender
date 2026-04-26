import { useEffect } from "react";
import { auth } from "./lib/firebase";
import { syncFirestore } from "./lib/syncManager";
import AppRoutes from "./routes";

export default function App() {
  useEffect(() => {
    // Sincronizar antes de fechar o app
    const handleBeforeUnload = () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        // Tenta sincronizar (pode não completar se o navegador fechar muito rápido)
        syncFirestore(userId).catch((error) => {
          console.error("[App] Erro ao sincronizar antes de fechar:", error);
        });
      }
    };

    // Sincronizar quando voltar online
    const handleOnline = () => {
      console.log("[App] Conexão restaurada, sincronizando...");
      const userId = auth.currentUser?.uid;
      if (userId) {
        syncFirestore(userId)
          .then(() => {
            console.log("[App] Sincronização completa após reconexão");
          })
          .catch((error) => {
            console.error("[App] Erro ao sincronizar após reconexão:", error);
          });
      }
    };

    // Registrar listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("online", handleOnline);

    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return <AppRoutes />;
}
