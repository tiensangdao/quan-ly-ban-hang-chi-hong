'use client';

// Report Page Logic - Upgraded with Trends & Forecasting
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, roundNumber } from '@/lib/utils';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { 
    TrendingUp, TrendingDown, PackageCheck, ShoppingCart, 
    DollarSign, AlertTriangle, CheckCircle2, XCircle, 
    ArrowUpCircle, ArrowDownCircle, Package, Calendar,
    Filter, BarChart3, Activity, Sparkles, Clock, Search
} from 'lucide-react';

// ============= TYPES =============

type DateRangeFilter = 'this_month' | 'last_month' | '3_months' | '6_months' | 'this_year';

interface MonthlyData {
    month: string;
    chi_nhap: number;
    doanh_thu: number;
    lai: number;
}

interface YearlyData {
    year: string;
    chi_nhap: number;
    doanh_thu: number;
    lai: number;
    growth_rate: number;
}

interface ProductData {
    name: string;
    value: number;
    percentage: number;
}

interface TopProduct {
    product_name: string;
    so_luong: number;
    doanh_thu: number;
}

interface RecoveryData {
    product_name: string;
    recovery_percent: number;
    ton_kho: number;
}

interface SparklineDataPoint {
    month: string;
    value: number;
}

interface ProductPerformance {
    product_id: string;
    product_name: string;
    revenue: number;  // Doanh thu trong kỳ (filtered)
    profit: number;   // Lãi trong kỳ (filtered)
    quantity_sold: number;  // Số lượng bán trong kỳ (filtered)
    stock: number;  // Tồn kho hiện tại (all-time)
    recovery_percent: number;  // % hồi vốn toàn thời gian
    is_top_30: boolean;
    is_bottom_30: boolean;
    total_cost: number;  // Chi nhập trong kỳ (filtered)
    total_cost_alltime?: number;  // Tổng chi nhập toàn thời gian
    recommendation?: 'BUY_MORE' | 'STOP_BUYING';
    profit_status: 'PROFIT' | 'BREAKING_EVEN' | 'LOSS';
    has_imports: boolean;
    has_sales: boolean;
    // New fields
    revenue_previous?: number;
    profit_previous?: number;
    revenue_change_percent?: number;
    profit_change_percent?: number;
    sparkline_data?: SparklineDataPoint[];
    forecast_days_until_depletion?: number | null;
    forecast_message?: string;
    // Pricing fields
    avg_import_price?: number;  // Giá nhập TB (all-time)
    avg_sale_price?: number;    // Giá bán TB (all-time)
    profit_per_unit?: number;   // Lời/Lỗ mỗi cái
    quantity_imported?: number; // Tổng số lượng nhập (all-time)
    revenue_alltime?: number;   // Tổng doanh thu toàn thời gian
    quantity_sold_alltime?: number; // Tổng số lượng bán toàn thời gian
}

interface NhapHangRecord {
    product_id: string;
    so_luong: number;
    don_gia: number;
    ngay_thang: string;
}

interface BanHangRecord {
    product_id: string;
    so_luong: number;
    gia_ban: number;
    ngay_ban: string;
}

const COLORS = ['#F97316', '#FB7185', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#14B8A6', '#EC4899'];

// ============= HELPER FUNCTIONS =============

function getDateRanges(filter: DateRangeFilter): { current: [string, string], previous: [string, string] } {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    switch (filter) {
        case 'this_month': {
            const startOfMonth = new Date(currentYear, currentMonth, 1);
            const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
            const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1);
            const endOfPrevMonth = new Date(currentYear, currentMonth, 0);
            return {
                current: [startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]],
                previous: [startOfPrevMonth.toISOString().split('T')[0], endOfPrevMonth.toISOString().split('T')[0]]
            };
        }
        case 'last_month': {
            const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
            const endOfLastMonth = new Date(currentYear, currentMonth, 0);
            const startOfTwoMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
            const endOfTwoMonthsAgo = new Date(currentYear, currentMonth - 1, 0);
            return {
                current: [startOfLastMonth.toISOString().split('T')[0], endOfLastMonth.toISOString().split('T')[0]],
                previous: [startOfTwoMonthsAgo.toISOString().split('T')[0], endOfTwoMonthsAgo.toISOString().split('T')[0]]
            };
        }
        case '3_months': {
            const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
            const endOfLastMonth = new Date(currentYear, currentMonth, 0);
            const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);
            const endOfThreeMonthsAgo = new Date(currentYear, currentMonth - 3, 0);
            return {
                current: [threeMonthsAgo.toISOString().split('T')[0], endOfLastMonth.toISOString().split('T')[0]],
                previous: [sixMonthsAgo.toISOString().split('T')[0], endOfThreeMonthsAgo.toISOString().split('T')[0]]
            };
        }
        case '6_months': {
            const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);
            const endOfLastMonth = new Date(currentYear, currentMonth, 0);
            const twelveMonthsAgo = new Date(currentYear, currentMonth - 12, 1);
            const endOfSixMonthsAgo = new Date(currentYear, currentMonth - 6, 0);
            return {
                current: [sixMonthsAgo.toISOString().split('T')[0], endOfLastMonth.toISOString().split('T')[0]],
                previous: [twelveMonthsAgo.toISOString().split('T')[0], endOfSixMonthsAgo.toISOString().split('T')[0]]
            };
        }
        case 'this_year': {
            const startOfYear = new Date(currentYear, 0, 1);
            const endOfYear = new Date(currentYear, 11, 31);
            const startOfLastYear = new Date(currentYear - 1, 0, 1);
            const endOfLastYear = new Date(currentYear - 1, 11, 31);
            return {
                current: [startOfYear.toISOString().split('T')[0], endOfYear.toISOString().split('T')[0]],
                previous: [startOfLastYear.toISOString().split('T')[0], endOfLastYear.toISOString().split('T')[0]]
            };
        }
    }
}

function calculatePercentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return roundNumber(((current - previous) / previous) * 100);
}

function forecastStockDepletion(
    currentStock: number,
    salesLast30Days: BanHangRecord[]
): { days: number | null; message: string } {
    if (currentStock <= 0) {
        return { days: 0, message: 'Hết hàng' };
    }

    if (salesLast30Days.length === 0) {
        return { days: null, message: 'Chưa có dữ liệu bán hàng' };
    }

    const totalSold = salesLast30Days.reduce((sum, s) => sum + s.so_luong, 0);
    
    if (totalSold === 0) {
        return { days: null, message: 'Hàng không bán được trong 30 ngày qua' };
    }

    const avgDailySales = totalSold / 30;
    const daysUntilDepletion = Math.ceil(currentStock / avgDailySales);

    return {
        days: daysUntilDepletion,
        message: `Dự kiến bán hết trong ${daysUntilDepletion} ngày`
    };
}

// ============= SPARKLINE COMPONENT =============

function Sparkline({ data }: { data: SparklineDataPoint[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-10 flex items-center justify-center text-xs text-gray-400">
                Không có dữ liệu
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={40}>
            <LineChart data={data}>
                <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#F97316" 
                    strokeWidth={2} 
                    dot={false}
                    isAnimationActive={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

// ============= COMPARISON INDICATOR COMPONENT =============

function ComparisonIndicator({ percentChange }: { percentChange: number | undefined }) {
    if (percentChange === undefined || percentChange === null) {
        return null;
    }

    const isPositive = percentChange > 0;
    const isNeutral = percentChange === 0;

    if (isNeutral) {
        return (
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                → Không đổi
            </span>
        );
    }

    return (
        <span className={`text-xs font-semibold flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '↗️' : '↘️'}
            {isPositive ? '+' : ''}{percentChange.toFixed(1)}% so với kỳ trước
        </span>
    );
}

// ============= MAIN COMPONENT =============

export default function BaoCaoPage() {
    const [activeTab, setActiveTab] = useState<'product' | 'time'>('product');
    const [loading, setLoading] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingTimeData, setLoadingTimeData] = useState(false);
    const [dateFilter, setDateFilter] = useState<DateRangeFilter>('this_month');
    
    // Data states
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
    const [productBreakdown, setProductBreakdown] = useState<ProductData[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [recoveryData, setRecoveryData] = useState<RecoveryData[]>([]);
    const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
    
    // UI states
    const [sortBy, setSortBy] = useState<'revenue' | 'profit' | 'quantity' | 'recovery'>('revenue');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Initial load
    useEffect(() => {
        const initLoad = async () => {
            setLoading(true);
            // Load minimal data for initial render
            await Promise.all([
                fetchYearlyData(),
                fetchProductPerformance(),
            ]);
            setLoading(false);
        };
        initLoad();
    }, []);

    // Load product tab data when dateFilter changes
    useEffect(() => {
        if (activeTab === 'product') {
            const loadProductData = async () => {
                setLoadingProducts(true);
                await fetchProductPerformance();
                setLoadingProducts(false);
            };
            loadProductData();
        }
    }, [activeTab, dateFilter]);

    // Load time tab data when switching to time tab or year changes
    useEffect(() => {
        if (activeTab === 'time') {
            const loadTimeData = async () => {
                setLoadingTimeData(true);
                await Promise.all([
                    fetchMonthlyData(),
                    fetchYearlyData(),
                ]);
                setLoadingTimeData(false);
            };
            loadTimeData();
        }
    }, [activeTab, selectedYear]);

    // ============= OPTIMIZED DATA FETCHING =============

    const fetchProductPerformance = async () => {
        const ranges = getDateRanges(dateFilter);
        const [currentStart, currentEnd] = ranges.current;
        const [prevStart, prevEnd] = ranges.previous;

        // Fetch products
        const { data: products } = await supabase
            .from('products')
            .select('id, ten_hang')
            .eq('active', true);

        if (!products) return;

        // Fetch current period data (optimized - single query per table)
        const { data: currentNhapData } = await supabase
            .from('nhap_hang')
            .select('product_id, so_luong, don_gia, ngay_thang')
            .gte('ngay_thang', currentStart)
            .lte('ngay_thang', currentEnd);

        const { data: currentBanData } = await supabase
            .from('ban_hang')
            .select('product_id, so_luong, gia_ban, ngay_ban')
            .gte('ngay_ban', currentStart)
            .lte('ngay_ban', currentEnd);

        // Fetch previous period data for comparison
        const { data: prevNhapData } = await supabase
            .from('nhap_hang')
            .select('product_id, so_luong, don_gia')
            .gte('ngay_thang', prevStart)
            .lte('ngay_thang', prevEnd);

        const { data: prevBanData } = await supabase
            .from('ban_hang')
            .select('product_id, so_luong, gia_ban')
            .gte('ngay_ban', prevStart)
            .lte('ngay_ban', prevEnd);

        // Fetch all-time data for stock calculation AND average price calculation
        const { data: allNhapData } = await supabase.from('nhap_hang').select('product_id, so_luong, don_gia');
        const { data: allBanData } = await supabase.from('ban_hang').select('product_id, so_luong, gia_ban');

        // Fetch last 30 days sales for forecasting
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: last30DaysSales } = await supabase
            .from('ban_hang')
            .select('product_id, so_luong, ngay_ban')
            .gte('ngay_ban', thirtyDaysAgo.toISOString().split('T')[0]);

        // Fetch 6-month data for sparklines
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const { data: sparklineNhapData } = await supabase
            .from('nhap_hang')
            .select('product_id, so_luong, don_gia, ngay_thang')
            .gte('ngay_thang', sixMonthsAgo.toISOString().split('T')[0]);

        const { data: sparklineBanData } = await supabase
            .from('ban_hang')
            .select('product_id, so_luong, gia_ban, ngay_ban')
            .gte('ngay_ban', sixMonthsAgo.toISOString().split('T')[0]);

        // ============= AGGREGATE DATA =============

        const performanceMap: Record<string, ProductPerformance> = {};

        products.forEach(p => {
            performanceMap[p.id] = {
                product_id: p.id,
                product_name: p.ten_hang,
                revenue: 0,
                profit: 0,
                quantity_sold: 0,
                stock: 0,
                recovery_percent: 0,
                is_top_30: false,
                is_bottom_30: false,
                total_cost: 0,
                total_cost_alltime: 0,
                revenue_alltime: 0,
                quantity_sold_alltime: 0,
                profit_status: 'LOSS',
                has_imports: false,
                has_sales: false,
                revenue_previous: 0,
                profit_previous: 0,
                revenue_change_percent: 0,
                profit_change_percent: 0,
                sparkline_data: [],
                forecast_days_until_depletion: null,
                forecast_message: '',
                avg_import_price: 0,
                avg_sale_price: 0,
                profit_per_unit: 0,
                quantity_imported: 0
            };
        });

        // Calculate all-time totals for average prices and recovery (not affected by date filter)
        const allTimeTotals: Record<string, { totalImportValue: number; totalImportQty: number; totalSaleValue: number; totalSaleQty: number }> = {};
        
        allNhapData?.forEach(item => {
            if (!allTimeTotals[item.product_id]) {
                allTimeTotals[item.product_id] = { totalImportValue: 0, totalImportQty: 0, totalSaleValue: 0, totalSaleQty: 0 };
            }
            allTimeTotals[item.product_id].totalImportValue += item.so_luong * item.don_gia;
            allTimeTotals[item.product_id].totalImportQty += item.so_luong;
            
            // Also update performanceMap with all-time totals
            if (performanceMap[item.product_id]) {
                performanceMap[item.product_id].total_cost_alltime! += item.so_luong * item.don_gia;
                performanceMap[item.product_id].quantity_imported! += item.so_luong;
            }
        });

        allBanData?.forEach(item => {
            if (!allTimeTotals[item.product_id]) {
                allTimeTotals[item.product_id] = { totalImportValue: 0, totalImportQty: 0, totalSaleValue: 0, totalSaleQty: 0 };
            }
            allTimeTotals[item.product_id].totalSaleValue += item.so_luong * item.gia_ban;
            allTimeTotals[item.product_id].totalSaleQty += item.so_luong;
            
            // Also update performanceMap with all-time revenue and quantity
            if (performanceMap[item.product_id]) {
                performanceMap[item.product_id].revenue_alltime! += item.so_luong * item.gia_ban;
                performanceMap[item.product_id].quantity_sold_alltime! += item.so_luong;
            }
        });

        // Aggregate current period (for filtered revenue/profit/quantity)
        currentNhapData?.forEach(item => {
            if (performanceMap[item.product_id]) {
                performanceMap[item.product_id].total_cost += item.so_luong * item.don_gia;
                performanceMap[item.product_id].has_imports = true;
            }
        });

        currentBanData?.forEach(item => {
            if (performanceMap[item.product_id]) {
                performanceMap[item.product_id].revenue += item.so_luong * item.gia_ban;
                performanceMap[item.product_id].quantity_sold += item.so_luong;
                performanceMap[item.product_id].has_sales = true;
            }
        });

        // Aggregate previous period
        prevNhapData?.forEach(item => {
            if (performanceMap[item.product_id]) {
                // Track previous cost for profit calculation
                const prevCost = item.so_luong * item.don_gia;
                performanceMap[item.product_id].total_cost += prevCost; // For stock valuation
            }
        });

        prevBanData?.forEach(item => {
            if (performanceMap[item.product_id]) {
                performanceMap[item.product_id].revenue_previous! += item.so_luong * item.gia_ban;
            }
        });

        // Calculate all-time stock
        allNhapData?.forEach(item => {
            if (performanceMap[item.product_id]) {
                performanceMap[item.product_id].stock += item.so_luong;
            }
        });

        allBanData?.forEach(item => {
            if (performanceMap[item.product_id]) {
                performanceMap[item.product_id].stock -= item.so_luong;
            }
        });

        // Calculate sparkline data (monthly breakdown for 6 months)
        const monthlyBreakdown: Record<string, Record<string, number>> = {};
        
        sparklineBanData?.forEach(sale => {
            const monthKey = sale.ngay_ban.substring(0, 7); // "2026-01"
            if (!monthlyBreakdown[sale.product_id]) {
                monthlyBreakdown[sale.product_id] = {};
            }
            if (!monthlyBreakdown[sale.product_id][monthKey]) {
                monthlyBreakdown[sale.product_id][monthKey] = 0;
            }
            monthlyBreakdown[sale.product_id][monthKey] += sale.so_luong * sale.gia_ban;
        });

        // Generate last 6 months labels
        const last6Months: string[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            last6Months.push(d.toISOString().substring(0, 7));
        }

        // Populate sparkline data for each product
        Object.keys(performanceMap).forEach(productId => {
            const sparklineData: SparklineDataPoint[] = last6Months.map((monthKey, idx) => ({
                month: `T${(new Date(monthKey + '-01').getMonth() + 1)}`,
                value: monthlyBreakdown[productId]?.[monthKey] || 0
            }));
            performanceMap[productId].sparkline_data = sparklineData;
        });

        // Calculate forecasting
        Object.keys(performanceMap).forEach(productId => {
            const productSales = last30DaysSales?.filter(s => s.product_id === productId) as BanHangRecord[] || [];
            const forecast = forecastStockDepletion(performanceMap[productId].stock, productSales);
            performanceMap[productId].forecast_days_until_depletion = forecast.days;
            performanceMap[productId].forecast_message = forecast.message;
        });

        // Calculate metrics and comparisons
        Object.values(performanceMap).forEach(p => {
            // Calculate average prices using ALL-TIME data (not filtered by date)
            const allTimeData = allTimeTotals[p.product_id];
            if (allTimeData) {
                if (allTimeData.totalImportQty > 0) {
                    p.avg_import_price = roundNumber(allTimeData.totalImportValue / allTimeData.totalImportQty);
                }
                if (allTimeData.totalSaleQty > 0) {
                    p.avg_sale_price = roundNumber(allTimeData.totalSaleValue / allTimeData.totalSaleQty);
                }
            }
            
            // Calculate profit per unit
            if (p.avg_import_price! > 0 && p.avg_sale_price! > 0) {
                p.profit_per_unit = roundNumber(p.avg_sale_price! - p.avg_import_price!);
            }
            
            // Recovery percent uses ALL-TIME data (how much we've recovered of all investments)
            p.recovery_percent = (p.total_cost_alltime || 0) > 0 
                ? Math.min(((p.revenue_alltime || 0) / (p.total_cost_alltime || 0)) * 100, 100)
                : 0;
            
            // Profit in CURRENT period (filtered)
            p.profit = p.revenue - p.total_cost;
            
            // Calculate previous profit (simplified - using revenue only)
            const prevProfit = (p.revenue_previous || 0) - p.total_cost;
            p.profit_previous = prevProfit;

            // Calculate % changes
            p.revenue_change_percent = calculatePercentChange(p.revenue, p.revenue_previous || 0);
            p.profit_change_percent = calculatePercentChange(p.profit, p.profit_previous || 0);
            
            // Profit status based on ALL-TIME recovery
            if (p.recovery_percent >= 100) {
                p.profit_status = 'PROFIT';
            } else if (p.recovery_percent >= 50) {
                p.profit_status = 'BREAKING_EVEN';
            } else {
                p.profit_status = 'LOSS';
            }
        });

        const performanceArray = Object.values(performanceMap);
        
        // Calculate top/bottom 30%
        if (performanceArray.length >= 3) {
            const revenueValues = performanceArray.map(p => p.revenue).sort((a, b) => a - b);
            const percentile30Index = Math.floor(revenueValues.length * 0.3);
            const percentile70Index = Math.floor(revenueValues.length * 0.7);
            
            const percentile30Value = revenueValues[percentile30Index];
            const percentile70Value = revenueValues[percentile70Index];

            performanceArray.forEach(p => {
                p.is_top_30 = p.revenue >= percentile70Value;
                p.is_bottom_30 = p.revenue <= percentile30Value;

                if (p.recovery_percent >= 100 && p.is_top_30 && p.stock < 10) {
                    p.recommendation = 'BUY_MORE';
                } else if (p.recovery_percent < 50 && p.is_bottom_30 && p.stock > 20) {
                    p.recommendation = 'STOP_BUYING';
                }
            });
        }

        setProductPerformance(performanceArray);
    };

    // Keep other fetch functions (simplified versions)
    const fetchMonthlyData = async () => {
        const data: MonthlyData[] = [];
        
        for (let month = 0; month < 12; month++) {
            const startOfMonth = new Date(selectedYear, month, 1).toISOString().split('T')[0];
            const endOfMonth = new Date(selectedYear, month + 1, 0).toISOString().split('T')[0];

            const { data: nhapData } = await supabase
                .from('nhap_hang')
                .select('so_luong, don_gia')
                .gte('ngay_thang', startOfMonth)
                .lte('ngay_thang', endOfMonth);

            const { data: banData } = await supabase
                .from('ban_hang')
                .select('so_luong, gia_ban')
                .gte('ngay_ban', startOfMonth)
                .lte('ngay_ban', endOfMonth);

            const chiNhap = nhapData?.reduce((sum, item) => sum + (item.so_luong * item.don_gia), 0) || 0;
            const doanhThu = banData?.reduce((sum, item) => sum + (item.so_luong * item.gia_ban), 0) || 0;

            data.push({
                month: `T${month + 1}`,
                chi_nhap: roundNumber(chiNhap),
                doanh_thu: roundNumber(doanhThu),
                lai: roundNumber(doanhThu - chiNhap),
            });
        }

        setMonthlyData(data);
    };

    const fetchYearlyData = async () => {
        const data: YearlyData[] = [];
        const currentYear = new Date().getFullYear();

        for (let year = currentYear - 4; year <= currentYear; year++) {
            const startOfYear = `${year}-01-01`;
            const endOfYear = `${year}-12-31`;

            const { data: nhapData } = await supabase
                .from('nhap_hang')
                .select('so_luong, don_gia')
                .gte('ngay_thang', startOfYear)
                .lte('ngay_thang', endOfYear);

            const { data: banData } = await supabase
                .from('ban_hang')
                .select('so_luong, gia_ban')
                .gte('ngay_ban', startOfYear)
                .lte('ngay_ban', endOfYear);

            const chiNhap = nhapData?.reduce((sum, item) => sum + (item.so_luong * item.don_gia), 0) || 0;
            const doanhThu = banData?.reduce((sum, item) => sum + (item.so_luong * item.gia_ban), 0) || 0;

            data.push({
                year: year.toString(),
                chi_nhap: roundNumber(chiNhap),
                doanh_thu: roundNumber(doanhThu),
                lai: roundNumber(doanhThu - chiNhap),
                growth_rate: 0,
            });
        }

        for (let i = 1; i < data.length; i++) {
            if (data[i - 1].lai > 0) {
                data[i].growth_rate = roundNumber(((data[i].lai - data[i - 1].lai) / data[i - 1].lai) * 100);
            }
        }

        setYearlyData(data);
    };

    const fetchProductBreakdown = async () => {
        const { data: products } = await supabase
            .from('products')
            .select('id, ten_hang')
            .eq('active', true);

        const { data: nhapData } = await supabase
            .from('nhap_hang')
            .select('product_id, so_luong, don_gia');

        if (!products || !nhapData) return;

        const breakdown: Record<string, number> = {};
        nhapData.forEach(item => {
            breakdown[item.product_id] = (breakdown[item.product_id] || 0) + (item.so_luong * item.don_gia);
        });

        const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
        const data: ProductData[] = products
            .map(p => ({
                name: p.ten_hang,
                value: roundNumber(breakdown[p.id] || 0),
                percentage: roundNumber(((breakdown[p.id] || 0) / total) * 100),
            }))
            .filter(p => p.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        setProductBreakdown(data);
    };

    const fetchTopProducts = async () => {
        const { data: products } = await supabase
            .from('products')
            .select('id, ten_hang')
            .eq('active', true);

        const { data: banData } = await supabase
            .from('ban_hang')
            .select('product_id, so_luong, gia_ban');

        if (!products || !banData) return;

        const productMap: Record<string, { so_luong: number; doanh_thu: number }> = {};
        banData.forEach(item => {
            if (!productMap[item.product_id]) {
                productMap[item.product_id] = { so_luong: 0, doanh_thu: 0 };
            }
            productMap[item.product_id].so_luong += item.so_luong;
            productMap[item.product_id].doanh_thu += item.so_luong * item.gia_ban;
        });

        const data: TopProduct[] = products
            .map(p => ({
                product_name: p.ten_hang,
                so_luong: productMap[p.id]?.so_luong || 0,
                doanh_thu: productMap[p.id]?.doanh_thu || 0,
            }))
            .filter(p => p.so_luong > 0)
            .sort((a, b) => b.doanh_thu - a.doanh_thu)
            .slice(0, 10);

        setTopProducts(data);
    };

    const fetchRecoveryStatus = async () => {
        const { data: products } = await supabase
            .from('products')
            .select('id, ten_hang')
            .eq('active', true);

        if (!products) return;

        const { data: nhapData } = await supabase.from('nhap_hang').select('product_id, so_luong, don_gia');
        const { data: banData } = await supabase.from('ban_hang').select('product_id, so_luong, gia_ban');

        const financialData: Record<string, { nhap: number; ban: number; ton: number }> = {};

        nhapData?.forEach(item => {
            if (!financialData[item.product_id]) {
                financialData[item.product_id] = { nhap: 0, ban: 0, ton: 0 };
            }
            financialData[item.product_id].nhap += item.so_luong * item.don_gia;
            financialData[item.product_id].ton += item.so_luong;
        });

        banData?.forEach(item => {
            if (!financialData[item.product_id]) {
                financialData[item.product_id] = { nhap: 0, ban: 0, ton: 0 };
            }
            financialData[item.product_id].ban += item.so_luong * item.gia_ban;
            financialData[item.product_id].ton -= item.so_luong;
        });

        const data: RecoveryData[] = products
            .map(p => {
                const financial = financialData[p.id] || { nhap: 0, ban: 0, ton: 0 };
                const recoveryPercent = financial.nhap > 0 ? Math.min((financial.ban / financial.nhap) * 100, 100) : 0;
                return {
                    product_name: p.ten_hang,
                    recovery_percent: roundNumber(recoveryPercent),
                    ton_kho: financial.ton,
                };
            })
            .filter(p => p.recovery_percent > 0 || p.ton_kho > 0)
            .sort((a, b) => b.recovery_percent - a.recovery_percent)
            .slice(0, 8);

        setRecoveryData(data);
    };

    // Memoize sorted product list to avoid re-sorting on every render
    const sortedProducts = useMemo(() => {
        // First filter by search term
        let filtered = productPerformance;
        if (searchTerm.trim()) {
            filtered = productPerformance.filter(p => 
                p.product_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Then sort
        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'revenue': return b.revenue - a.revenue;
                case 'profit': return b.profit - a.profit;
                case 'quantity': return b.quantity_sold - a.quantity_sold;
                case 'recovery': return b.recovery_percent - a.recovery_percent;
                default: return 0;
            }
        });
    }, [productPerformance, sortBy, searchTerm]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-lg">
                    <p className="font-bold text-foreground mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="p-5 pb-24 flex items-center justify-center min-h-screen">
                <div className="text-primary font-medium animate-pulse">Đang tải báo cáo...</div>
            </div>
        );
    }

    return (
        <div className="p-5 pb-24 min-h-screen bg-background">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2">
                    <div className="bg-primary p-2 rounded-xl shadow-lg shadow-orange-200">
                        <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Báo Cáo Hiệu Quả
                    </h1>
                </div>
            </div>

            {/* Global Date Filter */}
            <div className="clay-card p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-primary" />
                    <label className="text-sm font-bold text-foreground">Khoảng thời gian:</label>
                </div>
                <select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value as DateRangeFilter)}
                    className="w-full px-4 py-3 border-2 border-orange-100 rounded-xl text-sm font-semibold text-foreground bg-white focus:border-primary focus:ring-2 focus:ring-orange-200 outline-none"
                >
                    <option value="this_month">Tháng này</option>
                    <option value="last_month">Tháng trước</option>
                    <option value="3_months">3 tháng gần nhất</option>
                    <option value="6_months">6 tháng gần nhất</option>
                    <option value="this_year">Năm nay</option>
                </select>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
                <button
                    onClick={() => setActiveTab('product')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'product'
                        ? 'bg-primary text-white shadow-md'
                        : 'clay-button bg-white text-gray-600 border border-orange-100 hover:bg-orange-50'
                        }`}
                >
                    <BarChart3 className="w-4 h-4" />
                    <span>Phân tích Sản phẩm</span>
                </button>
                <button
                    onClick={() => setActiveTab('time')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'time'
                        ? 'bg-primary text-white shadow-md'
                        : 'clay-button bg-white text-gray-600 border border-orange-100 hover:bg-orange-50'
                        }`}
                >
                    <TrendingUp className="w-4 h-4" />
                    <span>Xu hướng Thời gian</span>
                </button>
            </div>

            {/* Tab 1: Phân tích Sản phẩm */}
            {activeTab === 'product' && (
                <div className="space-y-6">
                    {/* Search and Sort */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Product Search */}
                        <div className="clay-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Search className="w-4 h-4 text-primary" />
                                <label className="text-sm font-bold text-foreground">Tìm sản phẩm:</label>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nhập tên sản phẩm..."
                                className="w-full px-4 py-3 border-2 border-orange-100 rounded-xl text-sm font-semibold text-foreground bg-white focus:border-primary focus:ring-2 focus:ring-orange-200 outline-none"
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="clay-card p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Filter className="w-4 h-4 text-primary" />
                                <label className="text-sm font-bold text-foreground">Sắp xếp theo:</label>
                            </div>
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="w-full px-4 py-3 border-2 border-orange-100 rounded-xl text-sm font-semibold text-foreground bg-white focus:border-primary focus:ring-2 focus:ring-orange-200 outline-none"
                            >
                                <option value="revenue">Doanh thu cao → thấp</option>
                                <option value="profit">Lãi cao → thấp</option>
                                <option value="quantity">Số lượng bán nhiều → ít</option>
                                <option value="recovery">Hồi vốn % cao → thấp</option>
                            </select>
                        </div>
                    </div>

                    {/* Info boxes */}
                    {productPerformance.filter(p => p.recommendation === 'BUY_MORE').length > 0 && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="bg-green-500 rounded-lg p-2 shrink-0">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-green-800 font-bold">
                                        Có {productPerformance.filter(p => p.recommendation === 'BUY_MORE').length} sản phẩm cần nhập thêm
                                    </div>
                                    <div className="text-green-600 text-sm mt-1">
                                        Hàng bán chạy và sắp hết. Nhập ngay để không bỏ lỡ doanh thu!
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {productPerformance.filter(p => p.forecast_days_until_depletion !== null && p.forecast_days_until_depletion! < 7).length > 0 && (
                        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="bg-primary rounded-lg p-2 shrink-0">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-primary font-bold">Cảnh báo: Hàng sắp hết</div>
                                    <div className="text-orange-700 text-sm mt-1">
                                        {productPerformance.filter(p => p.forecast_days_until_depletion !== null && p.forecast_days_until_depletion! < 7).length} sản phẩm 
                                        sẽ hết hàng trong vòng 7 ngày
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Product Cards */}
                    <div className="space-y-4">
                        {loadingProducts ? (
                            // Loading skeleton
                            Array(3).fill(0).map((_, idx) => (
                                <div key={idx} className="clay-card overflow-hidden animate-pulse">
                                    <div className="p-4 bg-gray-100 h-24"></div>
                                    <div className="p-4 bg-gray-50 h-16"></div>
                                    <div className="p-4 bg-white h-48"></div>
                                </div>
                            ))
                        ) : productPerformance.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 font-medium">
                                Chưa có dữ liệu sản phẩm
                            </div>
                        ) : (
                            sortedProducts.map(product => {
                                    const hoiVonPercent = Math.min(product.recovery_percent, 100);
                                    
                                    return (
                                        <div
                                            key={product.product_id}
                                            className="clay-card overflow-hidden"
                                        >
                                            {/* Header with Pricing Info */}
                                            <div className="p-4 border-b border-orange-100 bg-gradient-to-br from-white to-orange-50">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <h3 className="font-bold text-xl text-foreground flex-1">{product.product_name}</h3>
                                                    {product.profit_per_unit !== undefined && product.profit_per_unit !== 0 && (
                                                        <div className={`px-3 py-1.5 rounded-lg font-bold text-sm shadow-sm ${
                                                            product.profit_per_unit > 0 
                                                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                                                : 'bg-red-100 text-red-700 border border-red-200'
                                                        }`}>
                                                            {product.profit_per_unit > 0 ? '💰 Lời' : '💸 Lỗ'} {formatCurrency(Math.abs(product.profit_per_unit))}/cái
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Price Info Grid */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="bg-white/70 px-3 py-2 rounded-lg border border-orange-100">
                                                        <div className="text-xs font-semibold text-gray-500 mb-0.5">Giá nhập TB</div>
                                                        <div className="font-bold text-sm text-orange-700">
                                                            {product.avg_import_price ? formatCurrency(product.avg_import_price) : '---'}
                                                        </div>
                                                    </div>
                                                    <div className="bg-white/70 px-3 py-2 rounded-lg border border-green-100">
                                                        <div className="text-xs font-semibold text-gray-500 mb-0.5">Giá bán TB</div>
                                                        <div className="font-bold text-sm text-green-700">
                                                            {product.avg_sale_price ? formatCurrency(product.avg_sale_price) : '---'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sparkline Section */}
                                            <div className="p-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <TrendingUp className="w-4 h-4 text-primary" />
                                                    <h4 className="text-xs font-bold text-primary uppercase tracking-wide">Xu hướng 6 tháng</h4>
                                                </div>
                                                <Sparkline data={product.sparkline_data || []} />
                                            </div>

                                            {/* Revenue Section with Comparison */}
                                            <div className="p-4 border-b border-orange-100 bg-orange-50/30">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <BarChart3 className="w-4 h-4 text-primary" />
                                                    <h4 className="text-sm font-bold text-primary uppercase tracking-wide">Doanh thu & Bán</h4>
                                                </div>
                                                <div className="space-y-3">
                                                    {/* Tổng chi nhập - ALL TIME */}
                                                    <div className="p-3 bg-white rounded-xl border border-red-100">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-semibold text-gray-600">Tổng chi nhập:</span>
                                                            <div className="font-bold text-lg text-red-600">
                                                                {formatCurrency(product.total_cost_alltime || 0)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Doanh thu - ALL TIME */}
                                                    <div className="p-3 bg-white rounded-xl border border-orange-100">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-sm font-semibold text-gray-600">Doanh thu:</span>
                                                            <div className="text-right">
                                                                <div className="font-bold text-xl text-primary">
                                                                    {formatCurrency(product.revenue_alltime || 0)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Số lượng bán - ALL TIME */}
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-600">Số lượng bán:</span>
                                                        <span className="font-bold text-foreground">
                                                            {product.quantity_sold_alltime || 0} cái
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Lãi - ALL TIME */}
                                                    <div className="p-3 bg-white rounded-xl border border-orange-100">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-sm font-semibold text-gray-600">Lãi:</span>
                                                            <div className="text-right">
                                                                <div className={`font-bold text-xl ${((product.revenue_alltime || 0) - (product.total_cost_alltime || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {formatCurrency((product.revenue_alltime || 0) - (product.total_cost_alltime || 0))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Section */}
                                            <div className="p-4 bg-white">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Activity className="w-4 h-4 text-amber-600" />
                                                    <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide">Trạng thái</h4>
                                                </div>
                                                <div className="space-y-3">
                                                    {/* Progress Bar */}
                                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-semibold text-gray-600">Hồi vốn:</span>
                                                            <span className="font-bold text-xl text-foreground">
                                                                {hoiVonPercent.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                                                            <div
                                                                className={`h-3 rounded-full transition-all shadow-sm ${product.recovery_percent >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : product.recovery_percent >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-600' : 'bg-gradient-to-r from-red-500 to-orange-600'}`}
                                                                style={{ width: `${hoiVonPercent}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-600">Tình trạng:</span>
                                                        <span className={`font-bold px-3 py-1.5 rounded-lg text-sm ${
                                                            product.profit_status === 'PROFIT' ? 'bg-green-100 text-green-700' :
                                                            product.profit_status === 'BREAKING_EVEN' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {product.profit_status === 'PROFIT' ? 'CÓ LỜI' :
                                                             product.profit_status === 'BREAKING_EVEN' ? 'HÒA VỐN' : 'LỖ VỐN'}
                                                        </span>
                                                    </div>

                                                    {/* Stock with Forecast */}
                                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-sm font-semibold text-gray-600">Tồn kho:</span>
                                                            <span className={`font-bold text-lg ${product.stock < 0 ? 'text-red-600' : 'text-foreground'}`}>
                                                                {product.stock < 0 ? (
                                                                    <span className="flex items-center gap-1">
                                                                        <AlertTriangle className="w-4 h-4" />
                                                                        Thiếu {Math.abs(product.stock)} cái
                                                                    </span>
                                                                ) : (
                                                                    `${product.stock} cái`
                                                                )}
                                                            </span>
                                                        </div>
                                                        {product.forecast_message && product.stock > 0 && (
                                                            <div className={`flex items-center gap-2 text-xs font-semibold ${
                                                                (product.forecast_days_until_depletion !== null && product.forecast_days_until_depletion !== undefined && product.forecast_days_until_depletion < 7)
                                                                    ? 'text-red-600' 
                                                                    : (product.forecast_days_until_depletion !== null && product.forecast_days_until_depletion !== undefined && product.forecast_days_until_depletion < 14)
                                                                    ? 'text-orange-600'
                                                                    : 'text-blue-600'
                                                            }`}>
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {product.forecast_message}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Recommendation */}
                                                    {product.recommendation && (
                                                        <div className="mt-2">
                                            <div className={`flex items-center justify-center gap-2 font-bold py-2.5 px-3 rounded-xl shadow-sm text-sm ${
                                                product.recommendation === 'BUY_MORE' 
                                                    ? 'bg-green-50 text-green-700 border-2 border-green-200' 
                                                    : 'bg-red-50 text-red-700 border-2 border-red-200'
                                            }`}>
                                                {product.recommendation === 'BUY_MORE' ? (
                                                    <>
                                                        <TrendingUp className="w-4 h-4" />
                                                        <span>💡 NHẬP THÊM HÀNG</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TrendingDown className="w-4 h-4" />
                                                        <span>⚠️ NGƯNG NHẬP HÀNG</span>
                                                    </>
                                                )}
                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Edge cases */}
                                                    {!product.has_imports && (
                                                        <div className="bg-gray-100 px-2 py-1 rounded text-xs text-center text-gray-500 font-medium">
                                                            Chưa nhập hàng trong kỳ này
                                                        </div>
                                                    )}
                                                    {product.has_imports && !product.has_sales && (
                                                        <div className="bg-yellow-50 px-2 py-1 rounded text-xs text-center text-yellow-700 font-medium">
                                                            Chưa bán được trong kỳ này
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>
            )}

            {/* Tab 2: Xu hướng Thời gian */}
            {activeTab === 'time' && (
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="clay-card p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-primary" />
                            <label className="text-sm font-bold text-foreground">Lọc theo thời gian:</label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="px-4 py-2.5 border-2 border-orange-100 rounded-xl text-sm font-semibold text-foreground bg-white focus:border-primary focus:ring-2 focus:ring-orange-200 outline-none"
                            >
                                {yearlyData.map(y => (
                                    <option key={y.year} value={y.year} className="font-semibold text-gray-900">{y.year}</option>
                                ))}
                            </select>
                            
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="px-4 py-2.5 border-2 border-orange-100 rounded-xl text-sm font-semibold text-foreground bg-white focus:border-primary focus:ring-2 focus:ring-orange-200 outline-none"
                            >
                                <option value="all" className="font-semibold text-gray-900">Tất cả tháng</option>
                                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                    <option key={m} value={m} className="font-semibold text-gray-900">Tháng {m}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loadingTimeData ? (
                        // Loading skeleton for time tab
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-3">
                                {Array(3).fill(0).map((_, idx) => (
                                    <div key={idx} className="bg-gray-100 p-4 rounded-xl h-20 animate-pulse"></div>
                                ))}
                            </div>
                            <div className="clay-card p-5 h-80 bg-gray-50 animate-pulse"></div>
                            <div className="clay-card p-5 h-80 bg-gray-50 animate-pulse"></div>
                        </div>
                    ) : (() => {
                        const filteredData = monthlyData.filter(item => {
                            if (selectedMonth === 'all') return true;
                            return item.month === `T${selectedMonth}`;
                        });

                        const totalChiNhap = filteredData.reduce((sum, d) => sum + d.chi_nhap, 0);
                        const totalDoanhThu = filteredData.reduce((sum, d) => sum + d.doanh_thu, 0);
                        const totalLai = filteredData.reduce((sum, d) => sum + d.lai, 0);

                        return (
                            <>
                                {/* KPI Cards */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <ArrowDownCircle className="w-4 h-4 text-primary" />
                                            <div className="text-xs font-bold text-gray-500 uppercase">Chi nhập</div>
                                        </div>
                                        <div className="text-lg font-black text-primary truncate">{formatCurrency(totalChiNhap)}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <ArrowUpCircle className="w-4 h-4 text-green-600" />
                                            <div className="text-xs font-bold text-gray-500 uppercase">Doanh thu</div>
                                        </div>
                                        <div className="text-lg font-black text-green-600 truncate">{formatCurrency(totalDoanhThu)}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Sparkles className="w-4 h-4 text-amber-500" />
                                            <div className="text-xs font-bold text-gray-500 uppercase">Lãi</div>
                                        </div>
                                        <div className="text-lg font-black text-amber-600 truncate">{formatCurrency(totalLai)}</div>
                                    </div>
                                </div>

                                {filteredData.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 font-medium">
                                        Chưa có dữ liệu năm {selectedYear}
                                    </div>
                                ) : (
                                    <>
                                        {/* Chart 1: Bar chart */}
                                        <div className="clay-card p-5">
                                            <div className="flex items-center gap-2 mb-4">
                                                <BarChart3 className="w-5 h-5 text-primary" />
                                                <h3 className="text-lg font-bold text-foreground">Chi Nhập vs Doanh Thu</h3>
                                            </div>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={filteredData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" vertical={false} />
                                                    <XAxis 
                                                        dataKey="month" 
                                                        tick={{ fill: '#431407', fontSize: 12, fontWeight: 600 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis 
                                                        tick={{ fill: '#431407', fontSize: 12, fontWeight: 600 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tickFormatter={(value) => `${value / 1000000}M`}
                                                    />
                                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fff7ed' }} />
                                                    <Legend 
                                                        wrapperStyle={{ 
                                                            paddingTop: '20px',
                                                            fontWeight: 600,
                                                            color: '#431407'
                                                        }}
                                                    />
                                                    <Bar dataKey="chi_nhap" fill="#F97316" name="Chi nhập" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="doanh_thu" fill="#10B981" name="Doanh thu" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Chart 2: Line chart */}
                                        <div className="clay-card p-5 border-amber-200">
                                            <div className="flex items-center gap-2 mb-4">
                                                <TrendingUp className="w-5 h-5 text-amber-600" />
                                                <h3 className="text-lg font-bold text-foreground">Xu Hướng Lãi</h3>
                                            </div>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={filteredData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" vertical={false} />
                                                    <XAxis 
                                                        dataKey="month" 
                                                        tick={{ fill: '#431407', fontSize: 12, fontWeight: 600 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis 
                                                        tick={{ fill: '#431407', fontSize: 12, fontWeight: 600 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tickFormatter={(value) => `${value / 1000000}M`}
                                                    />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Legend 
                                                        wrapperStyle={{ 
                                                            paddingTop: '20px',
                                                            fontWeight: 600,
                                                            color: '#431407'
                                                        }}
                                                    />
                                                    <Line type="monotone" dataKey="lai" stroke="#F59E0B" strokeWidth={3} name="Lãi" dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </>
                                )}
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
