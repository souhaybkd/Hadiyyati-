"use client"

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Gift, DollarSign, TrendingUp, RefreshCw } from "lucide-react";
import { getGiftAnalytics } from "@/lib/actions/gift-history";
import type { GiftAnalytics, AnalyticsDateFilter } from "@/lib/types/database";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useLanguage } from "@/lib/contexts/LanguageContext";

const dateFilters: AnalyticsDateFilter[] = [
    { period: 'this_year', label: 'This Year' },
    { period: 'this_month', label: 'This Month' },
    { period: 'last_month', label: 'Last Month' }
];

export function Analytics() {
    const { t } = useLanguage()
    const [analytics, setAnalytics] = useState<GiftAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsDateFilter['period']>('this_year');

    // Tracks the last time we fetched, so focus-based refreshes can be throttled.
    const lastRefreshRef = useRef<number>(Date.now());

    // Refresh data function
    const refreshData = useCallback(async (showRefreshingState = true) => {
        if (showRefreshingState) setRefreshing(true);
        try {
            const analyticsData = await getGiftAnalytics(selectedPeriod);
            setAnalytics(analyticsData);
            lastRefreshRef.current = Date.now();
        } catch (error) {
            console.error("Error refreshing analytics:", error);
        } finally {
            if (showRefreshingState) setRefreshing(false);
        }
    }, [selectedPeriod]);

    useEffect(() => {
        const loadAnalytics = async () => {
            setLoading(true);
            try {
                const analyticsData = await getGiftAnalytics(selectedPeriod);
                setAnalytics(analyticsData);
                lastRefreshRef.current = Date.now();
            } catch (error) {
                console.error("Error loading analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        loadAnalytics();
    }, [selectedPeriod]);

    // Refresh instantly after a payment completes (signalled from the success page).
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'payment_completed') {
                refreshData();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [refreshData]);

    // Refresh when the user returns to the tab, but only if the data is stale
    // (30s+). This keeps data fresh without polling on a fixed interval.
    useEffect(() => {
        const STALE_AFTER = 30000; // 30 seconds
        const handleFocus = () => {
            if (Date.now() - lastRefreshRef.current > STALE_AFTER) {
                refreshData(false);
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [refreshData]);

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (!analytics) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('dash.analyticsTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{t('dash.noAnalytics')}</p>
                </CardContent>
            </Card>
        );
    }

    const periodLabels: Record<AnalyticsDateFilter['period'], string> = {
        this_year: t('dash.thisYear'),
        this_month: t('dash.thisMonth'),
        last_month: t('dash.lastMonth'),
    };

    const getPeriodLabel = () => periodLabels[selectedPeriod] || t('dash.thisYear');

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center">
            <h2 className="text-design-h2 font-bold text-design-text-heading">{t('dash.analyticsTitle')}</h2>
            <div className="flex items-center gap-4">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refreshData()}
                    disabled={refreshing}
                >
                    <RefreshCw className={`h-4 w-4 me-2 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? t('dash.refreshing') : t('dash.refresh')}
                </Button>
                <div className="flex items-center gap-2">
                    {dateFilters.map((filter) => (
                        <Button
                            key={filter.period}
                            variant={selectedPeriod === filter.period ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedPeriod(filter.period)}
                        >
                            {periodLabels[filter.period]}
                        </Button>
                    ))}
                </div>
            </div>
        </div>

        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dash.wishlistViews')}</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalWishlistViews}</div>
                        <p className="text-xs text-muted-foreground">
                            Total views {getPeriodLabel().toLowerCase()}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dash.giftsReceived')}</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalGiftsThisYear}</div>
                        <p className="text-xs text-muted-foreground">
                            Total gifts {getPeriodLabel().toLowerCase()}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dash.totalValue')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${analytics.totalReceivedThisYear.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Amount received {getPeriodLabel().toLowerCase()}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('dash.monthlyActivity')}</CardTitle>
                    <CardDescription>Your wishlist and gift activity for {getPeriodLabel().toLowerCase()}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analytics.monthlyStats.map((month) => (
                            <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="font-medium">{month.month}</div>
                                <div className="flex space-x-6 text-sm">
                                    <div className="text-center">
                                        <div className="font-semibold text-blue-600">{month.wishlistViews}</div>
                                        <div className="text-muted-foreground">Views</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-semibold text-green-600">{month.giftsReceived}</div>
                                        <div className="text-muted-foreground">Gifts</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-semibold text-purple-600">${month.amountReceived.toFixed(0)}</div>
                                        <div className="text-muted-foreground">Value</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
} 