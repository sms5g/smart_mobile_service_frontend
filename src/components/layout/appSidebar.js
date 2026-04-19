"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  Image,
  FileText,
  ChevronLeft,
  ChevronRight,
  Layers,
  LayoutDashboard,
  LogOut,
  Package,
  Tags,
  Newspaper,
  Users,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/usercontext";

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    title: "Master Key",
    icon: Layers,
    children: [
      { title: "Brands", href: "/brands", icon: Tags },
      { title: "Models", href: "/models", icon: Layers },
      { title: "Products", href: "/products", icon: Package },
      { title: "Categories", href: "/categories", icon: Layers },
    ],
  },
  {
    title: "CMS",
    icon: FileText,
    children: [
      { title: "About", href: "/about", icon: FileText },
      { title: "Terms", href: "/terms", icon: FileText },
      { title: "Agree", href: "/agree", icon: FileText },
      { title: "News", href: "/news", icon: Newspaper },
      { title: "Banners", href: "/banners", icon: Image },
    ],
  },
  { title: "Users", href: "/users", icon: Users },
  { title: "Feedback", href: "/feedback", icon: LogOut },
  // { title: "Contact Us", href: "/contactus", icon: LogOut },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openItems, setOpenItems] = useState([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logout } = useUser();

  const toggleItem = (title) => {
    setOpenItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  const isActive = (href) =>
    href && (pathname === href || pathname.startsWith(href + "/"));

  const isChildActive = (children) =>
    children?.some((child) => isActive(child.href));

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-2 py-1 bg-[#111827] text-white">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="h-6 w-6 text-white" />
          </Button>
          <span className="font-bold">Admin Panel</span>
        </div>
        <div>
          <Button
            onClick={logout}
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:static top-0 left-0 z-50 h-screen bg-[#111827] text-[#F9FAFB] transition-all duration-300 border-r border-[#374151]",
          "transform",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
          isCollapsed ? "md:w-16" : "md:w-64",
          "w-64",
        )}
      > 
        <div className="flex flex-col h-full justify-between">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-[#374151]">
            {!isCollapsed && (
              <span className="text-xl font-bold">Admin Panel</span>
            )}

            <div className="flex items-center gap-2">
              {/* Desktop Collapse Button */}
              <div className="hidden md:block">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Mobile Close Button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMobileSidebar}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => (
                <li key={item.title}>
                  {item.children ? (
                    <Collapsible
                      open={
                        !isCollapsed &&
                        (openItems.includes(item.title) ||
                          isChildActive(item.children))
                      }
                      onOpenChange={() => toggleItem(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center w-full gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isChildActive(item.children)
                              ? "bg-[#2563EB] text-white"
                              : "hover:bg-[#1F2937]",
                            isCollapsed && "justify-center",
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {!isCollapsed && (
                            <>
                              <span className="flex-1 text-left">
                                {item.title}
                              </span>
                              <ChevronRight
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  (openItems.includes(item.title) ||
                                    isChildActive(item.children)) &&
                                    "rotate-90",
                                )}
                              />
                            </>
                          )}
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="space-y-1 mt-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.title}
                            href={child.href}
                            onClick={closeMobileSidebar}
                            className={cn(
                              "flex items-center gap-3 pl-10 pr-3 py-2 rounded-md text-sm transition-colors",
                              isActive(child.href)
                                ? "bg-[#2563EB] text-white"
                                : "hover:bg-[#1F2937] text-[#9CA3AF]",
                            )}
                          >
                            <child.icon className="h-4 w-4" />
                            {child.title}
                          </Link>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      onClick={closeMobileSidebar}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-[#2563EB] text-white"
                          : "hover:bg-[#1F2937]",
                        isCollapsed && "justify-center",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="flex justify-between items-center border-t border-[#374151] p-4">
            {!isCollapsed && (
              <div>
                <p className="text-sm font-medium truncate">
                  Smart Mobile Service
                </p>
                <p className="text-xs text-[#9CA3AF] truncate">
                  admin@example.com
                </p>
              </div>
            )}
            <Button
              onClick={logout}
              variant="ghost"
              size={isCollapsed ? "icon" : "default"}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
