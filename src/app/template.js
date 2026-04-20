"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import AppSidebar from "@/components/layout/appSidebar";
import { useUser } from "@/context/usercontext";
import FullScreenLoader from "@/components/layout/loadingSpinner";

export default function Template({ children }) {
  const { isAuthenticated, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated && !isLoginPage) {
      router.replace("/login");
    }

    if (isAuthenticated && isLoginPage) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoginPage, loading, pathname, router]);

  if (loading) return <FullScreenLoader />;

  if (isLoginPage) {
    return <main>{children}</main>;
  }

  // 🔐 If authenticated → show dashboard layout
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-background lg:h-screen lg:flex-row">
        <AppSidebar />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return null;
}
