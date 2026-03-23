"use client";

import { ToastContainer } from "react-toastify";

export default function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      newestOnTop
      pauseOnFocusLoss={false}
      theme="colored"
      style={{ zIndex: 99999 }}
    />
  );
}
