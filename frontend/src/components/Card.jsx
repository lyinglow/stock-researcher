import React from "react";
import { motion } from "framer-motion";

export default function Card({ children, className = "", delay = 0, testId }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={`rounded-xl2 border border-butter-200/70 bg-white/80 p-6 shadow-soft backdrop-blur-sm ${className}`}
      data-testid={testId}
    >
      {children}
    </motion.div>
  );
}
