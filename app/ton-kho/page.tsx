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
  Filter
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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
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

        filtered.sort((a, b) => {
            const getStatus = (qty: number) => {
                if (qty === 0) return 0;
                if (qty <= 10) return 1;
                return 2;
            };
            return getStatus(a.ton_kho) - getStatus(b.ton_kho);
        });

        return filtered;
    }, [inventoryList, searchTerm]);

    const getStatusColor = (qty: number) => {
        if (qty === 0) return 'bg-red-50 border-red-200';
        if (qty <= 10) return 'bg-yellow-50 border-yellow-200';
        return 'bg-green-50 border-green-200';
    };

    const getStatusBadge = (qty: number) => {
        if (qty === 0) return (
            <div className="flex items-center justify-center gap-2 text-red-600">
                <XCircle className="w-6 h-6" />
                <span className="font-bold text-lg">Hết hàng</span>
            </div>
        );
        if (qty <= 10) return (
            <div className="flex items-center justify-center gap-2 text-yellow-600">
                <AlertCircle className="w-6 h-6" />
                <span className="font-bold text-lg">Sắp hết hàng!</span>
            </div>
        );
        return (
            <div className="flex items-center justify-center gap-2 text-green-600">
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
        <div className="p-5 pb-24 bg-gradient-to-br from-blue-50 via-white to-blue-50 min-h-screen">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-md">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                        Tồn kho hiện tại
                    </h1>
                </div>
            </div>

            <div className="mb-4 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm sản phẩm..."
                    className="w-full pl-12 pr-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium shadow-sm"
                />
            </div>

            <div className="space-y-3">
                {filteredInventory.map((item) => {
                    const lai = item.tong_tien_ban - item.tong_tien_nhap;
                    const hoiVonPercent = item.tong_tien_nhap > 0
                        ? Math.min((item.tong_tien_ban / item.tong_tien_nhap) * 100, 100)
                        : 0;
                    const isProfit = lai >= 0;

                    return (
                        <div
                            key={item.product.id}
                            onClick={() => handleViewHistory(item.product.id)}
                            className="bg-white border-2 border-blue-100 rounded-2xl cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                        >
                            {/* Header with product name */}
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-xl text-white">{item.product.ten_hang}</h3>
                                    <Eye className="w-6 h-6 text-white/80 hover:text-white transition-colors" />
                                </div>
                            </div>

                            {/* Section 1: Tồn kho */}
                            <div className="bg-gradient-to-br from-blue-50 to-white p-5 border-b border-blue-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wide">Tồn kho</h4>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                                        <span className="text-sm font-semibold text-gray-800">Còn lại:</span>
                                        <span className="font-bold text-3xl text-blue-600">
                                            {item.ton_kho} <span className="text-lg text-gray-600">{item.product.don_vi}</span>
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Giá nhập:</span>
                                        <span className="font-bold text-gray-900">
                                            {formatCurrency(item.product.gia_nhap_gan_nhat)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Giá trị tồn:</span>
                                        <span className="font-bold text-blue-700">
                                            {formatCurrency(item.gia_tri_ton)}
                                        </span>
                                    </div>
                                    {item.ngay_nhap_gan_nhat && (
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm font-medium text-gray-700">Nhập gần nhất:</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">
                                                {formatDateVietnamese(item.ngay_nhap_gan_nhat)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 2: Tài chính */}
                            {item.tong_tien_nhap > 0 && (
                                <div className="bg-gradient-to-br from-amber-50 to-white p-5 border-b border-amber-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <DollarSign className="w-5 h-5 text-amber-600" />
                                        <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Tài chính</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-white rounded-xl shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-semibold text-gray-800">Hồi vốn:</span>
                                                <span className="font-bold text-2xl text-gray-900">
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
                                                <TrendingDown className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm font-medium text-gray-700">Đã nhập:</span>
                                            </div>
                                            <span className="font-bold text-gray-900">
                                                {formatCurrency(item.tong_tien_nhap)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1.5">
                                                <TrendingUp className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-medium text-gray-700">Đã bán:</span>
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
                            <div className="bg-white p-4">
                                <div className="text-center text-lg font-bold">
                                    {getStatusBadge(item.ton_kho)}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredInventory.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        Không tìm thấy sản phẩm nào
                    </div>
                )}
            </div>

            {showHistory && selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-5 border-b border-blue-200 flex justify-between items-center bg-gradient-to-r from-blue-500 to-blue-600">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-white" />
                                <h2 className="text-xl font-bold text-white">
                                    Lịch sử: {selectedProduct.ten_hang}
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Filter Section */}
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-white border-b border-blue-200">
                            <div className="flex items-center gap-2 mb-3">
                                <Filter className="w-4 h-4 text-blue-600" />
                                <h3 className="text-sm font-bold text-gray-900">Lọc theo:</h3>
                            </div>
                            
                            {/* Quick Filter Buttons */}
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                <button
                                    onClick={() => { setFilterMonth(null); setFilterYear(new Date().getFullYear()); }}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        !filterMonth && filterYear === new Date().getFullYear()
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
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
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        filterMonth === new Date().getMonth() + 1 && filterYear === new Date().getFullYear()
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
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
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        (() => {
                                            const lastMonth = new Date();
                                            lastMonth.setMonth(lastMonth.getMonth() - 1);
                                            return filterMonth === lastMonth.getMonth() + 1 && filterYear === lastMonth.getFullYear();
                                        })()
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    Tháng trước
                                </button>
                                <button
                                    onClick={() => { setFilterMonth(null); setFilterYear(new Date().getFullYear()); }}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        !filterMonth && filterYear === new Date().getFullYear()
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    Năm nay
                                </button>
                            </div>

                            {/* Dropdown Filters */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tháng:</label>
                                    <select
                                        value={filterMonth || ''}
                                        onChange={(e) => setFilterMonth(e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Tất cả tháng</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                            <option key={m} value={m}>Tháng {m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Năm:</label>
                                    <select
                                        value={filterYear}
                                        onChange={(e) => setFilterYear(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-500"
                                    >
                                        {availableYears.length > 0 ? (
                                            availableYears.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))
                                        ) : (
                                            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Result Count */}
                            <div className="mt-3 flex items-center gap-2 p-2 bg-white rounded-lg">
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-gray-700">
                                    Tìm thấy: <span className="font-bold text-blue-600">{filteredHistory.length}</span> giao dịch
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {filteredHistory.map((record) => (
                                <div
                                    key={record.id}
                                    className={`p-4 rounded-xl border-2 shadow-sm ${record.loai === 'nhap'
                                        ? 'bg-gradient-to-br from-blue-50 to-white border-blue-200'
                                        : 'bg-gradient-to-br from-green-50 to-white border-green-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            {record.loai === 'nhap' ? (
                                                <>
                                                    <div className="bg-blue-500 p-1.5 rounded-lg">
                                                        <TrendingDown className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="font-bold text-gray-900">Nhập hàng</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="bg-green-500 p-1.5 rounded-lg">
                                                        <TrendingUp className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="font-bold text-gray-900">Bán hàng</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm font-medium">
                                                {formatDateVietnamese(record.ngay)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                            <span className="text-sm font-medium text-gray-700">Số lượng:</span>
                                            <span className="font-bold text-gray-900">
                                                {record.loai === 'nhap' ? '+' : '-'}{record.so_luong} {selectedProduct.don_vi}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                            <span className="text-sm font-medium text-gray-700">Đơn giá:</span>
                                            <span className="font-bold text-gray-900">
                                                {formatCurrency(record.don_gia)}
                                            </span>
                                        </div>
                                        {record.loai === 'ban' && record.gia_nhap && (
                                            <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                                <span className="text-sm font-medium text-gray-700">Lời/cái:</span>
                                                <span className={`font-bold ${record.don_gia > record.gia_nhap
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }`}>
                                                    {record.don_gia > record.gia_nhap ? '+' : ''}{formatCurrency(record.don_gia - record.gia_nhap)}
                                                </span>
                                            </div>
                                        )}
                                        {record.nha_cung_cap && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700">NCC:</span>
                                                <span className="font-semibold text-gray-900">{record.nha_cung_cap}</span>
                                            </div>
                                        )}
                                        {record.khach_hang && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700">Khách:</span>
                                                <span className="font-semibold text-gray-900">{record.khach_hang}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {filteredHistory.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    Không có giao dịch nào trong khoảng thời gian này
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                            <button
                                onClick={() => setShowHistory(false)}
                                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg"
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
