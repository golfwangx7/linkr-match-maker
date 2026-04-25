import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame } from "lucide-react";

const STORAGE_KEY = "linkr_splash_shown";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Show once per browser session for a premium-feel cold start.
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary shadow-glow">
              <Flame className="h-10 w-10 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold tracking-tight">Linkr</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
