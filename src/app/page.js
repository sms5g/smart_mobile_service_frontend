"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  FolderTree,
  Image as ImageIcon,
  Layers,
  Newspaper,
  Package,
  Tags,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetcher } from "@/lib/fetcher";

function StatCard({ title, value, icon: Icon, href }) {
  const card = (
    <Card className="cursor-pointer border-0 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-full bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const response = await fetcher("/admin/dashboard");
        setDashboard(response.data || response || {});
      } catch (error) {
        toast.error(error.message || "Failed to fetch dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const overview = dashboard?.overview || {};
  const recentUsers = dashboard?.recentUsers || [];
  const recentProducts = dashboard?.recentProducts || [];

  const stats = [
    {
      title: "Total Users",
      value: overview.totalUsers ?? 0,
      icon: Users,
      href: "/users",
    },
    {
      title: "Active Users",
      value: overview.activeUsers ?? 0,
      icon: Activity,
      href: "/users",
    },
    {
      title: "Total Products",
      value: overview.totalProducts ?? 0,
      icon: Package,
      href: "/products",
    },
    {
      title: "Total Categories",
      value: overview.totalCategories ?? 0,
      icon: FolderTree,
      href: "/categories",
    },
    {
      title: "Total Brands",
      value: overview.totalBrands ?? 0,
      icon: Tags,
      href: "/brands",
    },
    {
      title: "Total Models",
      value: overview.totalModels ?? 0,
      icon: Layers,
      href: "/models",
    },
    {
      title: "Total News",
      value: overview.totalNews ?? 0,
      icon: Newspaper,
      href: "/news",
    },
    {
      title: "Total Banners",
      value: overview.totalBanners ?? 0,
      icon: ImageIcon,
      href: "/banners",
    },
  ];

  const formatDate = (value) => {
    if (!value) return "-";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  };

  const formatBrandNames = (brands = []) => {
    if (!Array.isArray(brands) || !brands.length) return "-";

    return brands.map((brand) => brand.name).filter(Boolean).join(", ") || "-";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here is the latest overview of your business.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link
              href="/brands"
              className="rounded-lg bg-primary/5 p-4 text-center transition-colors hover:bg-primary/10"
            >
              <Tags className="mx-auto mb-2 h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Add Brand</span>
            </Link>
            <Link
              href="/models"
              className="rounded-lg bg-primary/5 p-4 text-center transition-colors hover:bg-primary/10"
            >
              <Layers className="mx-auto mb-2 h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Add Model</span>
            </Link>
            <Link
              href="/products"
              className="rounded-lg bg-primary/5 p-4 text-center transition-colors hover:bg-primary/10"
            >
              <Package className="mx-auto mb-2 h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Add Product</span>
            </Link>
            <Link
              href="/users"
              className="rounded-lg bg-primary/5 p-4 text-center transition-colors hover:bg-primary/10"
            >
              <Users className="mx-auto mb-2 h-6 w-6 text-primary" />
              <span className="text-sm font-medium">View Users</span>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            ) : recentUsers.length ? (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {user.name || "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.mobileNumber || "-"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent users.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Recent Products</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading products...
              </p>
            ) : recentProducts.length ? (
              <div className="space-y-4">
                {recentProducts.map((product) => (
                  <div
                    key={product._id}
                    className="space-y-2 border-b border-border py-2 last:border-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">
                        {product.category?.name || "-"}
                      </p>
                      <span className="shrink-0 text-sm font-semibold">
                        Rs. {product.price ?? 0}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {formatBrandNames(product.brand)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(product.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent products.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
