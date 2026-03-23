"use client";

import { motion } from "framer-motion";

export default function FullScreenLoader({ text = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Animated Spinner */}
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-black dark:border-white border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 1,
              ease: "linear",
            }}
          />
        </div>

        {/* Loading Text */}
        <motion.p
          className="text-lg font-medium text-gray-700 dark:text-gray-300"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
          }}
        >
          {text}
        </motion.p>
      </motion.div>
    </div>
  );
}