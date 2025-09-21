"use client"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Analytics } from "@/components/dashboard/analytics/Analytics";
import { GiftHistory } from "@/components/dashboard/history/GiftHistory";
import { PayoutSettings } from "@/components/dashboard/payouts/PayoutSettings";
import { ProfileSettings } from "@/components/dashboard/profile/ProfileSettings";
import { MyWishlist } from "@/components/dashboard/wishlist/MyWishlist";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") || "wishlist";

  const renderContent = () => {
    switch (tab) {
      case "wishlist":
        return <MyWishlist />;
      case "history":
        return <GiftHistory />;
      case "payouts":
        return <PayoutSettings />;
      case "analytics":
        return <Analytics />;
      case "profile":
        return <ProfileSettings />;
      default:
        return <MyWishlist />;
    }
  };

  return renderContent();
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-design-primary" />
          <p className="text-design-text-muted">Loading...</p>
        </div>
      </div>
    }>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </Suspense>
  );
} 