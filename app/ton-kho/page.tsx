'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateVietnamese, roundNumber } from '@/lib/utils';

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
        if (qty === 0) return <span className="text-red-600 font-semibold">❌ Hết hàng</span>;
        if (qty <= 10) return <span className="text-yellow-600 font-semibold">⚠️ Sắp hết hàng!</span>;
        return <span className="text-green-600 font-semibold">✓ Còn hàng</span>;
    };

    const handleViewHistory = async (productId: string) => {
        setSelectedProductId(productId);

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

    return (
        <div className="p-5 pb-24">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">📦 Tồn kho hiện tại</h1>

            <div className="mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔍 Tìm sản phẩm..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
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
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${getStatusColor(item.ton_kho)}`}
                        >
                            <div className="font-bold text-lg text-gray-900 mb-3">{item.product.ten_hang}</div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">📦 Tồn kho:</span>
                                    <span className="font-bold text-gray-900">
                                        {item.ton_kho} {item.product.don_vi}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">💵 Giá nhập:</span>
                                    <span className="font-semibold text-gray-900">
                                        {formatCurrency(item.product.gia_nhap_gan_nhat)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">💰 Giá trị tồn:</span>
                                    <span className="font-semibold text-blue-600">
                                        {formatCurrency(item.gia_tri_ton)}
                                    </span>
                                </div>

                                {item.ngay_nhap_gan_nhat && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700">📅 Nhập gần nhất:</span>
                                        <span className="text-gray-900">
                                            {formatDateVietnamese(item.ngay_nhap_gan_nhat)}
                                        </span>
                                    </div>
                                )}

                                {/* Financial Progress Bar */}
                                {item.tong_tien_nhap > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-300">
                                        <div className="mb-2">
                                            <div className="flex justify-between items-center text-xs mb-1">
                                                <span className="text-gray-600">Hồi vốn</span>
                                                <span className="font-semibold text-gray-900">
                                                    {hoiVonPercent.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className={`h-2.5 rounded-full transition-all ${isProfit ? 'bg-green-500' : 'bg-orange-500'
                                                        }`}
                                                    style={{ width: `${hoiVonPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="mb-2 flex justify-between items-center text-xs">
                                            <span className="text-gray-600">💸 Tổng đã nhập:</span>
                                            <span className="font-semibold text-gray-900">
                                                {formatCurrency(item.tong_tien_nhap)}
                                            </span>
                                        </div>
                                        <div className="mb-2 flex justify-between items-center text-xs">
                                            <span className="text-gray-600">💰 Tổng đã bán:</span>
                                            <span className="font-semibold text-green-700">
                                                {formatCurrency(item.tong_tien_ban)}
                                            </span>
                                        </div>
                                        <div className={`text-sm font-semibold ${isProfit ? 'text-green-600' : 'text-orange-600'
                                            }`}>
                                            {isProfit
                                                ? `✓ Đã lãi ${formatCurrency(lai)}`
                                                : `⏳ Thiếu ${formatCurrency(-lai)} để hòa vốn`
                                            }
                                        </div>
                                    </div>
                                )}

                                <div className="mt-2 pt-2 border-t border-gray-300">
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

            {/* History Modal */}
            {showHistory && selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-50">
                            <h2 className="text-xl font-bold text-gray-900">
                                📊 Lịch sử: {selectedProduct.ten_hang}
                            </h2>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-2xl text-gray-600 hover:text-gray-900"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {history.map((record) => (
                                <div
                                    key={record.id}
                                    className={`p-3 rounded-lg border ${record.loai === 'nhap'
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-green-50 border-green-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-gray-900">
                                            {record.loai === 'nhap' ? '📥 Nhập hàng' : '💰 Bán hàng'}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {formatDateVietnamese(record.ngay)}
                                        </span>
                                    </div>

                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Số lượng:</span>
                                            <span className="font-semibold text-gray-900">
                                                {record.loai === 'nhap' ? '+' : '-'}{record.so_luong} {selectedProduct.don_vi}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Đơn giá:</span>
                                            <span className="font-semibold text-gray-900">
                                                {formatCurrency(record.don_gia)}
                                            </span>
                                        </div>
                                        {record.loai === 'ban' && record.gia_nhap && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">Lời/cái:</span>
                                                <span className={`font-semibold ${record.don_gia > record.gia_nhap
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }`}>
                                                    {record.don_gia > record.gia_nhap ? '+' : ''}{formatCurrency(record.don_gia - record.gia_nhap)}
                                                </span>
                                            </div>
                                        )}
                                        {record.nha_cung_cap && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">NCC:</span>
                                                <span className="text-gray-900">{record.nha_cung_cap}</span>
                                            </div>
                                        )}
                                        {record.khach_hang && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">Khách:</span>
                                                <span className="text-gray-900">{record.khach_hang}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {history.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    Chưa có lịch sử giao dịch
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setShowHistory(false)}
                                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
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
