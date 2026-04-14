import { useEffect, useState } from "react";
import { initStore } from "@/lib/store";

const StoreInitializer = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    initStore().then(() => setReady(true)).catch(() => setReady(true));
  }, []);

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
