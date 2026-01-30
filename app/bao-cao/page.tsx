'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, roundNumber } from '@/lib/utils';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function BaoCaoPage() {
    const [activeTab, setActiveTab] = useState<'month' | 'year' | 'compare'>('month');
    const [loading, setLoading] = useState(true);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
    const [productBreakdown, setProductBreakdown] = useState<ProductData[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [recoveryData, setRecoveryData] = useState<RecoveryData[]>([]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchMonthlyData(),
            fetchYearlyData(),
            fetchProductBreakdown(),
            fetchTopProducts(),
            fetchRecoveryStatus(),
        ]);
        setLoading(false);
    };

    const fetchMonthlyData = async () => {
        const data: MonthlyData[] = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

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
                month: `T${date.getMonth() + 1}`,
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

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                    <p className="font-semibold text-gray-900 mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
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
                <div className="text-gray-500">Đang tải dữ liệu...</div>
            </div>
        );
    }

    return (
        <div className="p-5 pb-24 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">📊 Báo cáo</h1>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('month')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${activeTab === 'month'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                        }`}
                >
                    📈 Tháng
                </button>
                <button
                    onClick={() => setActiveTab('year')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${activeTab === 'year'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                        }`}
                >
                    📅 Năm
                </button>
                <button
                    onClick={() => setActiveTab('compare')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${activeTab === 'compare'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                        }`}
                >
                    🔍 So sánh
                </button>
            </div>

            {/* Monthly Tab */}
            {activeTab === 'month' && (
                <div className="space-y-6">
                    {/* Bar Chart: Chi nhập vs Doanh thu */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">📊 Chi nhập & Doanh thu 6 tháng gần nhất</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="chi_nhap" fill="#3b82f6" name="Chi nhập" />
                                <Bar dataKey="doanh_thu" fill="#10b981" name="Doanh thu" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pie Chart: Product Breakdown */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">🥧 Cơ cấu chi phí nhập hàng</h2>
                        {productBreakdown.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={productBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.name} (${entry.percentage}%)`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {productBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
                        )}
                    </div>

                    {/* Line Chart: Profit Trend */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">📈 Xu hướng lợi nhuận</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="lai" stroke="#10b981" strokeWidth={3} name="Lãi" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Area Chart: Cash Flow */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">📉 Dòng tiền 6 tháng</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area type="monotone" dataKey="chi_nhap" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Chi nhập" />
                                <Area type="monotone" dataKey="doanh_thu" stackId="2" stroke="#10b981" fill="#10b981" name="Doanh thu" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Yearly Tab */}
            {activeTab === 'year' && (
                <div className="space-y-6">
                    {/* Yearly Bar Chart */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">📊 So sánh Chi/Thu/Lãi theo năm</h2>
                        {yearlyData.filter(y => y.chi_nhap > 0 || y.doanh_thu > 0).length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={yearlyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="year" />
                                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="chi_nhap" fill="#3b82f6" name="Chi nhập" />
                                    <Bar dataKey="doanh_thu" fill="#10b981" name="Doanh thu" />
                                    <Bar dataKey="lai" fill="#f59e0b" name="Lãi" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-500 text-center py-8">Chưa có dữ liệu nhiều năm</p>
                        )}
                    </div>

                    {/* Growth Line Chart */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">📈 Tốc độ tăng trưởng lợi nhuận (%)</h2>
                        {yearlyData.filter(y => y.growth_rate !== 0).length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={yearlyData.filter(y => y.growth_rate !== 0)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="year" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `${value}%`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="growth_rate" stroke="#8b5cf6" strokeWidth={3} name="Tăng trưởng (%)" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-500 text-center py-8">Cần ít nhất 2 năm có dữ liệu</p>
                        )}
                    </div>

                    {/* Profit Distribution Pie */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">🥧 Tỷ trọng lợi nhuận theo năm</h2>
                        {yearlyData.filter(y => y.lai > 0).length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={yearlyData.filter(y => y.lai > 0)}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.year} (${formatCurrency(entry.lai)})`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="lai"
                                    >
                                        {yearlyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-500 text-center py-8">Chưa có năm nào có lãi</p>
                        )}
                    </div>
                </div>
            )}

            {/* Compare Tab */}
            {activeTab === 'compare' && (
                <div className="space-y-6">
                    {/* Top Products - Horizontal Bar */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">🏆 Top sản phẩm theo doanh thu</h2>
                        {topProducts.length > 0 ? (
                            <div className="space-y-3">
                                {topProducts.map((product, index) => {
                                    const maxRevenue = topProducts[0].doanh_thu;
                                    const percentage = (product.doanh_thu / maxRevenue) * 100;
                                    return (
                                        <div key={index}>
                                            <div className="flex justify-between items-center mb-1 text-sm">
                                                <span className="font-semibold text-gray-900">{product.product_name}</span>
                                                <span className="text-gray-700">{formatCurrency(product.doanh_thu)}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="h-3 rounded-full transition-all"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        background: `linear-gradient(to right, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">Chưa có dữ liệu bán hàng</p>
                        )}
                    </div>

                    {/* Recovery Progress Bars */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">💸 Trạng thái hồi vốn</h2>
                        {recoveryData.length > 0 ? (
                            <div className="space-y-3">
                                {recoveryData.map((item, index) => {
                                    const isRecovered = item.recovery_percent >= 100;
                                    return (
                                        <div key={index}>
                                            <div className="flex justify-between items-center mb-1 text-sm">
                                                <span className="font-semibold text-gray-900">{item.product_name}</span>
                                                <span className={`font-semibold ${isRecovered ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {item.recovery_percent}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className={`h-2.5 rounded-full transition-all ${isRecovered ? 'bg-green-500' : 'bg-orange-500'
                                                        }`}
                                                    style={{ width: `${Math.min(item.recovery_percent, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
                        )}
                    </div>

                    {/* Comparison: This Year vs Last Year */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">📊 So sánh năm nay vs năm trước</h2>
                        {yearlyData.length >= 2 ? (
                            <div className="space-y-4">
                                {['doanh_thu', 'lai'].map((key) => {
                                    const currentYear = yearlyData[yearlyData.length - 1];
                                    const lastYear = yearlyData[yearlyData.length - 2];
                                    const currentValue = key === 'doanh_thu' ? currentYear.doanh_thu : currentYear.lai;
                                    const lastValue = key === 'doanh_thu' ? lastYear.doanh_thu : lastYear.lai;
                                    const maxValue = Math.max(currentValue, lastValue);
                                    const change = lastValue > 0 ? ((currentValue - lastValue) / lastValue) * 100 : 0;

                                    return (
                                        <div key={key}>
                                            <h3 className="font-semibold text-gray-900 mb-2">
                                                {key === 'doanh_thu' ? '💰 Doanh thu' : '💸 Lãi'}
                                            </h3>
                                            <div className="space-y-2">
                                                <div>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-700">{lastYear.year}</span>
                                                        <span className="font-semibold">{formatCurrency(lastValue)}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div
                                                            className="bg-blue-400 h-2.5 rounded-full"
                                                            style={{ width: `${(lastValue / maxValue) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-700">{currentYear.year}</span>
                                                        <span className="font-semibold">{formatCurrency(currentValue)}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div
                                                            className="bg-green-500 h-2.5 rounded-full"
                                                            style={{ width: `${(currentValue / maxValue) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-center">
                                                    <span className={`font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {change >= 0 ? '↗️' : '↘️'} {change >= 0 ? '+' : ''}
                                                        {roundNumber(change)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">Cần ít nhất 2 năm có dữ liệu</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
