"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="text-center">
        {/* Animated 404 */}
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-7xl md:text-9xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent"
        >
          404
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-4 text-lg md:text-xl text-muted-foreground"
        >
          Oops! The page you`re looking for doesn`t exist.
        </motion.p>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8"
        >
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-primary text-white font-medium shadow-lg hover:scale-105 transition-transform duration-300"
          >
            Go Back Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
