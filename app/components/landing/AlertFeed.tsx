"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Skull, Heart, Zap } from "lucide-react";

export default function AlertFeed({ notifications }: any) {
  return (
    <div className="alert-feed">
      <AnimatePresence>
        {notifications.map((n: any) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="alert-box"
            style={{
              borderColor:
                n.type === "death"
                  ? "#FF0033"
                  : n.type === "coma"
                  ? "#FFAA00"
                  : "#00C853",
            }}
          >
            <div className="pulse-icon">
              {n.type === "death" ? (
                <Skull size={14} />
              ) : n.type === "coma" ? (
                <Heart size={14} />
              ) : (
                <Zap size={14} />
              )}
            </div>

            <span>{n.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}