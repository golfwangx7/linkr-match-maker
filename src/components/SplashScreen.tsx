import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import appIcon from "@/assets/app-icon.png";

export function SplashScreen() {
  // Show on every cold load so it's the first thing the user ever sees,
  // mirroring an iOS launch screen.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => setVisible(false), 1500);
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0F]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-5"
          >
            <img
              src={appIcon}
              alt="Linkr"
              width={112}
              height={112}
              className="h-28 w-28 rounded-[28px]"
            />
            <span className="text-2xl font-bold tracking-tight text-white">Linkr</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
