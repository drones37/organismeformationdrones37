import { useEffect, useState } from "react";
import { initStore, reloadStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";

const StoreInitializer = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    initStore().then(() => setReady(true)).catch(() => setReady(true));
  }, []);

  // Reload data whenever the authenticated user changes (e.g. fresh login
  // after the previous session's refresh token was invalidated).
  useEffect(() => {
    if (!userId || !ready) return;
    reloadStore().catch(() => {});
  }, [userId, ready]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

export default StoreInitializer;
