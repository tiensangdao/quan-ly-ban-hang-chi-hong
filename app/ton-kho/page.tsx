'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateVietnamese, roundNumber } from '@/lib/utils';
import { 
  Package, 
  Search, 
  Eye, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  X,
  Filter,
  ChevronDown
} from 'lucide-react';

interface Product {
    id: string;
    ten_hang: string;
    don_vi: string;
    gia_nhap_gan_nhat: number;
}

interface InventoryItem {
    product: Product;
    ton_kho: number;
    ngay_nhap_gan_nhat: string;
    tong_tien_nhap: number;
    tong_tien_ban: number;
    gia_tri_ton: number;
}

interface HistoryRecord {
    id: string;
    ngay: string;
    loai: 'nhap' | 'ban';
    so_luong: number;
    don_gia: number;
    gia_nhap?: number;
    nha_cung_cap?: string;
    khach_hang?: string;
}

const InventorySkeleton = () => (
    <div className="bg-white border-2 border-orange-100 rounded-2xl overflow-hidden animate-pulse">
        <div className="bg-orange-50 h-16 w-full mb-4"></div>
        <div className="p-5 space-y-4">
            <div className="flex gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full"></div>
                <div className="h-4 bg-orange-100 rounded w-1/3 mt-2"></div>
            </div>
            <div className="h-24 bg-orange-50 rounded-xl"></div>
            <div className="h-24 bg-orange-50 rounded-xl"></div>
        </div>
    </div>
);

export default function TonKhoPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [inventory, setInventory] = useState<Record<string, number>>({});
    const [lastImportDates, setLastImportDates] = useState<Record<string, string>>({});
    const [financialData, setFinancialData] = useState<Record<string, { tongNhap: number; tongBan: number }>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [filterMonth, setFilterMonth] = useState<number | null>(null);
    const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out'>('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: productsData } = await supabase
            .from('products')
            .select('*')
            .eq('active', true);

        if (productsData) setProducts(productsData);

        const { data: nhapData } = await supabase.from('nhap_hang').select('product_id, so_luong, don_gia, ngay_thang');
        const { data: banData } = await supabase.from('ban_hang').select('product_id, so_luong, gia_ban');

        const inventoryMap: Record<string, number> = {};
        const lastDateMap: Record<string, string> = {};
        const financialMap: Record<string, { tongNhap: number; tongBan: number }> = {};

        nhapData?.forEach(item => {
            inventoryMap[item.product_id] = (inventoryMap[item.product_id] || 0) + item.so_luong;

            if (!lastDateMap[item.product_id] || item.ngay_thang > lastDateMap[item.product_id]) {
                lastDateMap[item.product_id] = item.ngay_thang;
            }

            if (!financialMap[item.product_id]) {
                financialMap[item.product_id] = { tongNhap: 0, tongBan: 0 };
            }
            financialMap[item.product_id].tongNhap += item.so_luong * item.don_gia;
        });

        banData?.forEach(item => {
            inventoryMap[item.product_id] = (inventoryMap[item.product_id] || 0) - item.so_luong;

            if (!financialMap[item.product_id]) {
                financialMap[item.product_id] = { tongNhap: 0, tongBan: 0 };
            }
            financialMap[item.product_id].tongBan += item.so_luong * item.gia_ban;
        });

        setInventory(inventoryMap);
        setLastImportDates(lastDateMap);
        setFinancialData(financialMap);
        setLoading(false);
    };

    const inventoryList = useMemo((): InventoryItem[] => {
        return products.map(product => {
            const financial = financialData[product.id] || { tongNhap: 0, tongBan: 0 };
            const tonKho = inventory[product.id] || 0;

            return {
                product,
                ton_kho: tonKho,
                ngay_nhap_gan_nhat: lastImportDates[product.id] || '',
                tong_tien_nhap: roundNumber(financial.tongNhap),
                tong_tien_ban: roundNumber(financial.tongBan),
                gia_tri_ton: roundNumber(tonKho * product.gia_nhap_gan_nhat),
            };
        });
    }, [products, inventory, lastImportDates, financialData]);

    const filteredInventory = useMemo(() => {
        let filtered = inventoryList.filter(item =>
            item.product.ten_hang.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (statusFilter === 'low') {
            filtered = filtered.filter(item => item.ton_kho > 0 && item.ton_kho <= 10);
        } else if (statusFilter === 'out') {
            filtered = filtered.filter(item => item.ton_kho <= 0);
        }

        filtered.sort((a, b) => {
            const getStatus = (qty: number) => {
                if (qty === 0) return 0;
                if (qty <= 10) return 1;
                return 2;
            };
            return getStatus(a.ton_kho) - getStatus(b.ton_kho);
        });

        return filtered;
    }, [inventoryList, searchTerm, statusFilter]);

    const getStatusColor = (qty: number) => {
        if (qty === 0) return 'bg-red-50 border-red-200';
        if (qty <= 10) return 'bg-orange-50 border-orange-200';
        return 'bg-green-50 border-green-200';
    };

    const getStatusBadge = (qty: number) => {
        if (qty === 0) return (
            <div className="flex items-center justify-center gap-2 text-danger">
                <XCircle className="w-6 h-6" />
                <span className="font-bold text-lg">Hết hàng</span>
            </div>
        );
        if (qty <= 10) return (
            <div className="flex items-center justify-center gap-2 text-warning">
                <AlertCircle className="w-6 h-6" />
                <span className="font-bold text-lg">Sắp hết hàng!</span>
            </div>
        );
        return (
            <div className="flex items-center justify-center gap-2 text-success">
                <CheckCircle className="w-6 h-6" />
                <span className="font-bold text-lg">Còn hàng</span>
            </div>
        );
    };

    const handleViewHistory = async (productId: string) => {
        setSelectedProductId(productId);
        setFilterMonth(null);
        setFilterYear(new Date().getFullYear());

        const { data: nhapData } = await supabase
            .from('nhap_hang')
            .select('id, ngay_thang, so_luong, don_gia, nha_cung_cap')
            .eq('product_id', productId)
            .order('ngay_thang', { ascending: false });

        const { data: banData } = await supabase
            .from('ban_hang')
            .select('id, ngay_ban, so_luong, gia_ban, gia_nhap, khach_hang')
            .eq('product_id', productId)
            .order('ngay_ban', { ascending: false });

        const combinedHistory: HistoryRecord[] = [
            ...(nhapData?.map(item => ({
                id: item.id,
                ngay: item.ngay_thang,
                loai: 'nhap' as const,
                so_luong: item.so_luong,
                don_gia: item.don_gia,
                nha_cung_cap: item.nha_cung_cap,
            })) || []),
            ...(banData?.map(item => ({
                id: item.id,
                ngay: item.ngay_ban,
                loai: 'ban' as const,
                so_luong: item.so_luong,
                don_gia: item.gia_ban,
                gia_nhap: item.gia_nhap,
                khach_hang: item.khach_hang,
            })) || []),
        ];

        combinedHistory.sort((a, b) => b.ngay.localeCompare(a.ngay));
        setHistory(combinedHistory);
        setShowHistory(true);
    };

    const selectedProduct = products.find(p => p.id === selectedProductId);

    const filteredHistory = useMemo(() => {
        if (!filterMonth && !filterYear) return history;
        
        return history.filter(record => {
            const recordDate = new Date(record.ngay);
            const recordYear = recordDate.getFullYear();
            const recordMonth = recordDate.getMonth() + 1;
            
            if (filterYear && recordYear !== filterYear) return false;
            if (filterMonth && recordMonth !== filterMonth) return false;
            
            return true;
        });
    }, [history, filterMonth, filterYear]);

    const availableYears = useMemo(() => {
        const years = new Set<number>();
        history.forEach(record => {
            const year = new Date(record.ngay).getFullYear();
            years.add(year);
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [history]);

    return (
        <div className="p-5 pb-24 min-h-screen bg-background">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <div className="bg-primary p-2 rounded-xl shadow-lg shadow-orange-200">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Tồn Kho Hiện Tại
                    </h1>
                </div>
            </div>

            <div className="mb-4 relative clay-card p-0 overflow-hidden">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm sản phẩm..."
                    className="w-full pl-12 pr-4 py-4 bg-transparent text-foreground font-medium outline-none placeholder:text-gray-400"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                        statusFilter === 'all'
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-orange-50'
                    }`}
                >
                    Tất cả
                </button>
                <button
                    onClick={() => setStatusFilter('low')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                        statusFilter === 'low'
                            ? 'bg-warning text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-orange-50'
                    }`}
                >
                    <AlertCircle className="w-4 h-4" />
                    Sắp hết
                </button>
                <button
                    onClick={() => setStatusFilter('out')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                        statusFilter === 'out'
                            ? 'bg-danger text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-orange-50'
                    }`}
                >
                    <XCircle className="w-4 h-4" />
                    Hết hàng
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <>
                        <InventorySkeleton />
                        <InventorySkeleton />
                        <InventorySkeleton />
                    </>
                ) : (
                    filteredInventory.map((item) => {
                    const lai = item.tong_tien_ban - item.tong_tien_nhap;
                    const hoiVonPercent = item.tong_tien_nhap > 0
                        ? Math.min((item.tong_tien_ban / item.tong_tien_nhap) * 100, 100)
                        : 0;
                    const isProfit = lai >= 0;

                    return (
                        <div
                            key={item.product.id}
                            onClick={() => handleViewHistory(item.product.id)}
                            className="clay-card overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                        >
                            {/* Header with product name */}
                            <div className="bg-gradient-to-r from-primary to-orange-400 p-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-xl text-white">{item.product.ten_hang}</h3>
                                    <Eye className="w-6 h-6 text-white/80 hover:text-white transition-colors" />
                                </div>
                            </div>

                            {/* Section 1: Tồn kho */}
                            <div className="p-5 border-b border-orange-100 bg-white">
                                <div className="flex items-center gap-2 mb-3">
                                    <Package className="w-5 h-5 text-primary" />
                                    <h4 className="text-sm font-bold text-primary uppercase tracking-wide">Tồn kho</h4>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-orange-50/50 rounded-xl">
                                        <span className="text-sm font-semibold text-foreground/80">Còn lại:</span>
                                        <span className="font-bold text-3xl text-primary">
                                            {item.ton_kho} <span className="text-lg text-foreground/60">{item.product.don_vi}</span>
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-foreground/70">Giá nhập:</span>
                                        <span className="font-bold text-foreground">
                                            {formatCurrency(item.product.gia_nhap_gan_nhat)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-foreground/70">Giá trị tồn:</span>
                                        <span className="font-bold text-primary-hover">
                                            {formatCurrency(item.gia_tri_ton)}
                                        </span>
                                    </div>
                                    {item.ngay_nhap_gan_nhat && (
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4 text-primary/60" />
                                                <span className="text-sm font-medium text-foreground/70">Nhập gần nhất:</span>
                                            </div>
                                            <span className="font-semibold text-foreground">
                                                {formatDateVietnamese(item.ngay_nhap_gan_nhat)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 2: Tài chính */}
                            {item.tong_tien_nhap > 0 && (
                                <div className="p-5 border-b border-orange-100 bg-orange-50/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <DollarSign className="w-5 h-5 text-amber-600" />
                                        <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide">Tài chính</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-white rounded-xl shadow-sm border border-orange-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-semibold text-foreground/80">Hồi vốn:</span>
                                                <span className="font-bold text-2xl text-foreground">
                                                    {hoiVonPercent.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                                                <div
                                                    className={`h-3 rounded-full transition-all shadow-sm ${isProfit ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-amber-600'}`}
                                                    style={{ width: `${hoiVonPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1.5">
                                                <TrendingDown className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-medium text-foreground/70">Đã nhập:</span>
                                            </div>
                                            <span className="font-bold text-foreground">
                                                {formatCurrency(item.tong_tien_nhap)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1.5">
                                                <TrendingUp className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-medium text-foreground/70">Đã bán:</span>
                                            </div>
                                            <span className="font-bold text-green-700">
                                                {formatCurrency(item.tong_tien_ban)}
                                            </span>
                                        </div>
                                        <div className={`flex items-center gap-2 p-3 rounded-xl font-bold ${isProfit ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {isProfit ? (
                                                <>
                                                    <CheckCircle className="w-5 h-5" />
                                                    <span>Đã lãi {formatCurrency(lai)}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="w-5 h-5" />
                                                    <span>Thiếu {formatCurrency(-lai)} để hòa vốn</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section 3: Trạng thái */}
                            <div className="p-4 bg-white">
                                <div className="text-center text-lg font-bold">
                                    {getStatusBadge(item.ton_kho)}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

                {filteredInventory.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500 font-medium">
                        Không tìm thấy sản phẩm nào
                    </div>
                )}
            </div>

            {showHistory && selectedProduct && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in">
                        <div className="p-5 border-b border-orange-100 flex justify-between items-center bg-gradient-to-r from-primary to-orange-500">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-white" />
                                <h2 className="text-xl font-bold text-white">
                                    Lịch sử: {selectedProduct.ten_hang}
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Filter Section */}
                        <div className="p-4 bg-orange-50/50 border-b border-orange-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Filter className="w-4 h-4 text-primary" />
                                <h3 className="text-sm font-bold text-foreground">Lọc theo:</h3>
                            </div>
                            
                            {/* Quick Filter Buttons */}
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                <button
                                    onClick={() => { setFilterMonth(null); setFilterYear(new Date().getFullYear()); }}
                                    className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                                        !filterMonth && filterYear === new Date().getFullYear()
                                            ? 'bg-primary text-white shadow-md'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-orange-50'
                                    }`}
                                >
                                    Tất cả
                                </button>
                                <button
                                    onClick={() => { 
                                        const now = new Date();
                                        setFilterMonth(now.getMonth() + 1); 
                                        setFilterYear(now.getFullYear()); 
                                    }}
                                    className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                                        filterMonth === new Date().getMonth() + 1 && filterYear === new Date().getFullYear()
                                            ? 'bg-primary text-white shadow-md'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-orange-50'
                                    }`}
                                >
                                    Tháng này
                                </button>
                                <button
                                    onClick={() => { 
                                        const lastMonth = new Date();
                                        lastMonth.setMonth(lastMonth.getMonth() - 1);
                                        setFilterMonth(lastMonth.getMonth() + 1); 
                                        setFilterYear(lastMonth.getFullYear()); 
                                    }}
                                    className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                                        (() => {
                                            const lastMonth = new Date();
                                            lastMonth.setMonth(lastMonth.getMonth() - 1);
                                            return filterMonth === lastMonth.getMonth() + 1 && filterYear === lastMonth.getFullYear();
                                        })()
                                            ? 'bg-primary text-white shadow-md'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-orange-50'
                                    }`}
                                >
                                    Tháng trước
                                </button>
                                <button
                                    onClick={() => { setFilterMonth(null); setFilterYear(new Date().getFullYear()); }}
                                    className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                                        !filterMonth && filterYear === new Date().getFullYear()
                                            ? 'bg-primary text-white shadow-md'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-orange-50'
                                    }`}
                                >
                                    Năm nay
                                </button>
                            </div>

                            {/* Dropdown Filters */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Tháng:</label>
                                    <div className="relative">
                                        <select
                                            value={filterMonth || ''}
                                            onChange={(e) => setFilterMonth(e.target.value ? parseInt(e.target.value) : null)}
                                            className="w-full px-3 py-2 border border-orange-200 rounded-xl text-sm text-foreground font-semibold focus:ring-2 focus:ring-primary appearance-none bg-white"
                                        >
                                            <option value="">Tất cả tháng</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                                <option key={m} value={m}>Tháng {m}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Năm:</label>
                                    <div className="relative">
                                        <select
                                            value={filterYear}
                                            onChange={(e) => setFilterYear(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-orange-200 rounded-xl text-sm text-foreground font-semibold focus:ring-2 focus:ring-primary appearance-none bg-white"
                                        >
                                            {availableYears.length > 0 ? (
                                                availableYears.map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))
                                            ) : (
                                                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                                            )}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Result Count */}
                            <div className="mt-3 flex items-center gap-2 p-2 bg-white rounded-lg border border-orange-100 shadow-sm">
                                <CheckCircle className="w-4 h-4 text-primary" />
                                <span className="text-sm text-gray-600 font-medium">
                                    Tìm thấy: <span className="font-bold text-primary">{filteredHistory.length}</span> giao dịch
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-orange-50/30">
                            {filteredHistory.map((record) => (
                                <div
                                    key={record.id}
                                    className={`p-4 rounded-xl border-2 shadow-sm ${record.loai === 'nhap'
                                        ? 'bg-white border-blue-100'
                                        : 'bg-white border-green-100'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            {record.loai === 'nhap' ? (
                                                <>
                                                    <div className="bg-blue-500 p-1.5 rounded-lg shadow-sm">
                                                        <TrendingDown className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="font-bold text-gray-900">Nhập hàng</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="bg-green-500 p-1.5 rounded-lg shadow-sm">
                                                        <TrendingUp className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="font-bold text-gray-900">Bán hàng</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-500">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-xs font-semibold">
                                                {formatDateVietnamese(record.ngay)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Số lượng:</span>
                                            <span className="font-bold text-gray-900">
                                                {record.loai === 'nhap' ? '+' : '-'}{record.so_luong} {selectedProduct.don_vi}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Đơn giá:</span>
                                            <span className="font-bold text-gray-900">
                                                {formatCurrency(record.don_gia)}
                                            </span>
                                        </div>
                                        {record.loai === 'ban' && record.gia_nhap && (
                                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                                <span className="text-sm font-medium text-gray-600">Lời/cái:</span>
                                                <span className={`font-bold ${record.don_gia > record.gia_nhap
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }`}>
                                                    {record.don_gia > record.gia_nhap ? '+' : ''}{formatCurrency(record.don_gia - record.gia_nhap)}
                                                </span>
                                            </div>
                                        )}
                                        {record.nha_cung_cap && (
                                            <div className="flex justify-between items-center px-2">
                                                <span className="text-xs font-bold text-gray-400 uppercase">NCC:</span>
                                                <span className="text-sm font-semibold text-gray-700">{record.nha_cung_cap}</span>
                                            </div>
                                        )}
                                        {record.khach_hang && (
                                            <div className="flex justify-between items-center px-2">
                                                <span className="text-xs font-bold text-gray-400 uppercase">Khách:</span>
                                                <span className="text-sm font-semibold text-gray-700">{record.khach_hang}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {filteredHistory.length === 0 && (
                                <div className="text-center py-12 text-gray-400 font-medium">
                                    Không có giao dịch nào
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-orange-100 bg-white">
                            <button
                                onClick={() => setShowHistory(false)}
                                className="clay-button w-full py-3 px-6 rounded-xl text-lg shadow-md"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}