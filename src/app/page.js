"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Tags,
  Layers,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";

function StatCard({ title, value, icon: Icon, trend, href }) {
  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm mt-1 ${trend.isPositive ? "text-success" : "text-destructive"}`}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{trend.value}% from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const stats = [
    {
      title: "Total Users",
      value: "2,543",
      icon: Users,
      trend: { value: 12, isPositive: true },
      href: "/users",
    },
    {
      title: "Total Brands",
      value: "48",
      icon: Tags,
      trend: { value: 4, isPositive: true },
      href: "/brands",
    },
    {
      title: "Total Models",
      value: "1,924",
      icon: Layers,
      trend: { value: 8, isPositive: true },
      href: "/models",
    },
    {
      title: "Total Sales",
      value: "₹4,56,780",
      icon: DollarSign,
      trend: { value: 2, isPositive: false },
      href: "/dashboard",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here an overview of your business.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Additional Info Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link
              href="/brands"
              className="p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-center"
            >
              <Tags className="h-6 w-6 mx-auto mb-2 text-primary" />
              <span className="text-sm font-medium">Add Brand</span>
            </Link>
            <Link
              href="/models"
              className="p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-center"
            >
              <Layers className="h-6 w-6 mx-auto mb-2 text-primary" />
              <span className="text-sm font-medium">Add Model</span>
            </Link>
            <Link
              href="/products"
              className="p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-center"
            >
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
              <span className="text-sm font-medium">Add Product</span>
            </Link>
            <Link
              href="/users"
              className="p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-center"
            >
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <span className="text-sm font-medium">View Users</span>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "New user registered", time: "2 minutes ago" },
                { action: 'Brand "Samsung" updated', time: "1 hour ago" },
                { action: "New product added", time: "3 hours ago" },
                { action: 'Model "iPhone 15" created', time: "5 hours ago" },
              ].map((activity, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm">{activity.action}</span>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
