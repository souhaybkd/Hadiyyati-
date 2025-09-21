"use client"
import { AdminLayout } from "@/components/dashboard/AdminLayout";
import { AdminOverview } from "@/components/dashboard/admin/AdminOverview";
import { UserManagement } from "@/components/dashboard/admin/UserManagement";
import { OrderManagement } from "@/components/dashboard/admin/OrderManagement";
import { TransactionManagement } from "@/components/dashboard/admin/TransactionManagement";
import { NotificationManagement } from "@/components/dashboard/admin/NotificationManagement";
import { PlatformSettings } from "@/components/dashboard/admin/PlatformSettings";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") || "overview";

  const renderContent = () => {
    switch (tab) {
      case "overview":
        return <AdminOverview />;
      case "users":
        return <UserManagement />;
      case "orders":
        return <OrderManagement />;
      case "transactions":
        return <TransactionManagement />;
      case "notifications":
        return <NotificationManagement />;
      case "settings":
        return <PlatformSettings />;
      default:
        return <AdminOverview />;
    }
  };

  return renderContent();
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-design-primary" />
          <p className="text-design-text-muted">Loading Admin Dashboard...</p>
        </div>
      </div>
    }>
      <AdminLayout>
        <AdminDashboardContent />
      </AdminLayout>
    </Suspense>
  );
} 