'use client';

// Report Page Logic
import { useState, useEffect } from 'react';
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
    Filter, BarChart3, Activity, Sparkles
} from 'lucide-react';

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

interface ProductPerformance {
    product_id: string;
    product_name: string;
    revenue: number;
    profit: number;
    quantity_sold: number;
    stock: number;
    recovery_percent: number;
    is_top_30: boolean;
    is_bottom_30: boolean;
    total_cost: number;
    recommendation?: 'BUY_MORE' | 'STOP_BUYING';
    profit_status: 'PROFIT' | 'BREAKING_EVEN' | 'LOSS';
    has_imports: boolean;
    has_sales: boolean;
}

const COLORS = ['#F97316', '#FB7185', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#14B8A6', '#EC4899'];

export default function BaoCaoPage() {
    const [activeTab, setActiveTab] = useState<'product' | 'time'>('product');
    const [loading, setLoading] = useState(true);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
    const [productBreakdown, setProductBreakdown] = useState<ProductData[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [recoveryData, setRecoveryData] = useState<RecoveryData[]>([]);
    const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
    const [sortBy, setSortBy] = useState<'revenue' | 'profit' | 'quantity' | 'recovery'>('revenue');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

    useEffect(() => {
        fetchAllData();
    }, [selectedYear]);

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchMonthlyData(),
            fetchYearlyData(),
            fetchProductBreakdown(),
            fetchTopProducts(),
            fetchRecoveryStatus(),
            fetchProductPerformance(),
        ]);
        setLoading(false);
    };

    const fetchMonthlyData = async () => {
        const data: MonthlyData[] = [];
        
        // Fetch full year data for selectedYear
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

        // Calculate growth rates
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

    const fetchProductPerformance = async () => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const startDate = sixMonthsAgo.toISOString().split('T')[0];

        const { data: products } = await supabase
            .from('products')
            .select('id, ten_hang')
            .eq('active', true);

        if (!products) return;

        const { data: nhapData } = await supabase
            .from('nhap_hang')
            .select('product_id, so_luong, don_gia')
            .gte('ngay_thang', startDate);

        const { data: banData } = await supabase
            .from('ban_hang')
            .select('product_id, so_luong, gia_ban')
            .gte('ngay_ban', startDate);

        const { data: allNhapData } = await supabase.from('nhap_hang').select('product_id, so_luong');
        const { data: allBanData } = await supabase.from('ban_hang').select('product_id, so_luong');

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
                profit_status: 'LOSS',
                has_imports: false,
                has_sales: false,
            };
        });

        nhapData?.forEach(item => {
            if (performanceMap[item.product_id]) {
                performanceMap[item.product_id].total_cost += item.so_luong * item.don_gia;
                performanceMap[item.product_id].has_imports = true;
            }
        });

        banData?.forEach(item => {
            if (performanceMap[item.product_id]) {
                performanceMap[item.product_id].revenue += item.so_luong * item.gia_ban;
                performanceMap[item.product_id].quantity_sold += item.so_luong;
                performanceMap[item.product_id].has_sales = true;
            }
        });

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

        Object.values(performanceMap).forEach(p => {
            p.profit = p.revenue - p.total_cost;
            p.recovery_percent = p.total_cost > 0 
                ? Math.min((p.revenue / p.total_cost) * 100, 100)
                : 0;
            
            if (p.recovery_percent >= 100) {
                p.profit_status = 'PROFIT';
            } else if (p.recovery_percent >= 50) {
                p.profit_status = 'BREAKING_EVEN';
            } else {
                p.profit_status = 'LOSS';
            }
        });

        const performanceArray = Object.values(performanceMap);
        
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

                    {/* Info boxes */}
                    {productPerformance.filter(p => p.recommendation === 'BUY_MORE').length === 0 && (
                        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <div className="bg-primary rounded-lg p-2 shrink-0">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-primary font-bold">Chưa có đề xuất nhập thêm</div>
                                    <div className="text-orange-700 text-sm mt-1">
                                        Cần: Lời {'>'} 100% + Bán chạy + Tồn {'<'} 10
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {productPerformance.every(p => p.profit_status === 'PROFIT') && productPerformance.length > 0 && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <div className="bg-green-500 rounded-lg p-2 shrink-0">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-green-800 font-bold">Tất cả sản phẩm đều lời!</div>
                                    <div className="text-green-600 text-sm mt-1">Kinh doanh hiệu quả. Tiếp tục phát huy!</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Product Cards */}
                    <div className="space-y-4">
                        {productPerformance.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 font-medium">
                                Chưa có dữ liệu sản phẩm
                            </div>
                        ) : (
                            [...productPerformance]
                                .sort((a, b) => {
                                    switch (sortBy) {
                                        case 'revenue': return b.revenue - a.revenue;
                                        case 'profit': return b.profit - a.profit;
                                        case 'quantity': return b.quantity_sold - a.quantity_sold;
                                        case 'recovery': return b.recovery_percent - a.recovery_percent;
                                        default: return 0;
                                    }
                                })
                                .map(product => {
                                    const hoiVonPercent = Math.min(product.recovery_percent, 100);
                                    
                                    return (
                                        <div
                                            key={product.product_id}
                                            className="clay-card overflow-hidden"
                                        >
                                            {/* Header */}
                                            <div className="p-4 border-b border-orange-100 bg-white">
                                                <h3 className="font-bold text-xl text-foreground">{product.product_name}</h3>
                                            </div>

                                            {/* Section 1: Revenue */}
                                            <div className="p-4 border-b border-orange-100 bg-orange-50/30">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <BarChart3 className="w-4 h-4 text-primary" />
                                                    <h4 className="text-sm font-bold text-primary uppercase tracking-wide">DOANH THU & BÁN</h4>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-orange-100">
                                                        <span className="text-sm font-semibold text-gray-600">Doanh thu:</span>
                                                        <span className="font-bold text-2xl text-primary">
                                                            {formatCurrency(product.revenue)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-600">Số lượng bán:</span>
                                                        <span className="font-bold text-foreground">
                                                            {product.quantity_sold} cái
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-600">Lãi:</span>
                                                        <span className={`font-bold ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {formatCurrency(product.profit)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section 2: Status */}
                                            <div className="p-4 bg-white">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Activity className="w-4 h-4 text-amber-600" />
                                                    <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide">TRẠNG THÁI</h4>
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

                                                    {/* Stock */}
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-600">Tồn kho:</span>
                                                        <span className={`font-bold ${product.stock < 0 ? 'text-red-600' : 'text-foreground'}`}>
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

                                                    {/* Recommendation */}
                                                    {product.recommendation && (
                                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                            <div className={`flex items-center justify-center gap-2 font-bold py-2.5 px-3 rounded-xl shadow-sm text-sm ${
                                                product.recommendation === 'BUY_MORE' 
                                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                                    : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                                {product.recommendation === 'BUY_MORE' ? (
                                                    <>
                                                        <TrendingUp className="w-4 h-4" />
                                                        <span>NHẬP THÊM HÀNG</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TrendingDown className="w-4 h-4" />
                                                        <span>NGƯNG NHẬP HÀNG</span>
                                                    </>
                                                )}
                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Edge cases */}
                                                    {!product.has_imports && (
                                                        <div className="bg-gray-100 px-2 py-1 rounded text-xs text-center text-gray-500 font-medium">
                                                            Chưa nhập hàng
                                                        </div>
                                                    )}
                                                    {product.has_imports && !product.has_sales && (
                                                        <div className="bg-yellow-50 px-2 py-1 rounded text-xs text-center text-yellow-700 font-medium">
                                                            Chưa bán được
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

                    {(() => {
                        // Filter data based on year and month
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
                                        {/* Chart 1: Bar chart - Chi nhập vs Doanh thu */}
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

                                        {/* Chart 2: Line chart - Xu hướng lãi */}
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