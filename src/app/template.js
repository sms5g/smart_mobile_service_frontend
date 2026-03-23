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
  }, [isAuthenticated, loading, pathname, router]);

  if (loading) return <FullScreenLoader />;

  if (isLoginPage) {
    return <main>{children}</main>;
  }

  // 🔐 If authenticated → show dashboard layout
  if (isAuthenticated) {
    return (
      <div className="flex flex-col md:flex-row h-screen bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-y-scroll">
          <div className="container py-6 px-4 md:px-6 lg:px-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return null;
}
