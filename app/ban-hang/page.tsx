'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatNumber, parseNumber, getTodayDate, formatDateVietnamese, getYesterdayDate } from '@/lib/utils';

interface Product {
    id: string;
    ten_hang: string;
    don_vi: string;
    gia_nhap_gan_nhat: number;
}

interface InventoryData {
    product_id: string;
    ton_kho: number;
}

export default function BanHangPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [inventory, setInventory] = useState<Record<string, number>>({});
    const [selectedProductId, setSelectedProductId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [ngay, setNgay] = useState(getTodayDate());
    const [soLuong, setSoLuong] = useState('');
    const [giaBan, setGiaBan] = useState('');
    const [khachHang, setKhachHang] = useState('Khách lẻ');
    const [ghiChu, setGhiChu] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [giaBanGoiY, setGiaBanGoiY] = useState(0);

    const dateInputRef = useRef<HTMLInputElement>(null);
    const soLuongRef = useRef<HTMLInputElement>(null);
    const giaBanRef = useRef<HTMLInputElement>(null);

    const selectedProduct = products.find(p => p.id === selectedProductId);
    const currentInventory = selectedProductId ? (inventory[selectedProductId] || 0) : 0;

    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.ten_hang.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const remainingInventory = useMemo(() => {
        return currentInventory - parseNumber(soLuong);
    }, [currentInventory, soLuong]);

    const thanhTien = useMemo(() => {
        return parseNumber(soLuong) * parseNumber(giaBan);
    }, [soLuong, giaBan]);

    const lai = useMemo(() => {
        if (!selectedProduct || !soLuong || !giaBan) return { amount: 0, percent: 0 };
        const profit = (parseNumber(giaBan) - selectedProduct.gia_nhap_gan_nhat) * parseNumber(soLuong);
        const percent = selectedProduct.gia_nhap_gan_nhat > 0
            ? (profit / (selectedProduct.gia_nhap_gan_nhat * parseNumber(soLuong))) * 100
            : 0;
        return { amount: profit, percent };
    }, [selectedProduct, soLuong, giaBan]);

    useEffect(() => {
        fetchProducts();
        fetchInventory();
    }, []);

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').eq('active', true);
        if (data) setProducts(data);
    };

    const fetchInventory = async () => {
        const { data: nhapData } = await supabase.from('nhap_hang').select('product_id, so_luong');
        const { data: banData } = await supabase.from('ban_hang').select('product_id, so_luong');

        const inventoryMap: Record<string, number> = {};

        nhapData?.forEach(item => {
            inventoryMap[item.product_id] = (inventoryMap[item.product_id] || 0) + item.so_luong;
        });

        banData?.forEach(item => {
            inventoryMap[item.product_id] = (inventoryMap[item.product_id] || 0) - item.so_luong;
        });

        setInventory(inventoryMap);
    };

    const handleSelectProduct = async (product: Product) => {
        setSelectedProductId(product.id);
        setSearchTerm(product.ten_hang);
        setIsDropdownOpen(false);

        // Fetch giá bán gợi ý từ lần nhập hàng gần nhất
        const { data } = await supabase
            .from('nhap_hang')
            .select('gia_ban_goi_y')
            .eq('product_id', product.id)
            .order('ngay_thang', { ascending: false })
            .limit(1)
            .single();

        if (data?.gia_ban_goi_y) {
            setGiaBanGoiY(data.gia_ban_goi_y);
            // Tự động điền giá bán từ giá khuyến nghị
            setGiaBan(data.gia_ban_goi_y.toString());
        } else {
            setGiaBanGoiY(0);
            setGiaBan('');
        }

        setTimeout(() => soLuongRef.current?.focus(), 100);
    };

    const handleSave = async () => {
        if (!selectedProductId || !soLuong || !giaBan) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }

        if (parseNumber(soLuong) > currentInventory) {
            alert(`Không đủ hàng! Tồn kho chỉ còn ${currentInventory} ${selectedProduct?.don_vi || 'cái'}`);
            return;
        }

        setIsLoading(true);

        const { error } = await supabase.from('ban_hang').insert({
            product_id: selectedProductId,
            ngay_ban: ngay,
            khach_hang: khachHang,
            so_luong: parseNumber(soLuong),
            gia_nhap: selectedProduct?.gia_nhap_gan_nhat || 0,
            gia_ban: parseNumber(giaBan),
            ghi_chu: ghiChu || null,
        });

        setIsLoading(false);

        if (error) {
            alert('Lỗi: ' + error.message);
        } else {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            await fetchInventory();
            resetForm();
        }
    };

    const resetForm = () => {
        setSelectedProductId('');
        setSearchTerm('');
        setSoLuong('');
        setGiaBan('');
        setKhachHang('Khách lẻ');
        setGhiChu('');
        setNgay(getTodayDate());
    };

    return (
        <div className="p-5 pb-8">
            <h1 className="text-2xl font-bold text-green-600 mb-6">💰 Bán hàng</h1>

            {showSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                    ✅ <span className="font-semibold">Đã lưu thành công!</span>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">📅 Ngày</label>

                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 mb-2">
                        <div className="text-xl font-bold text-green-600 text-center">
                            {formatDateVietnamese(ngay)}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setNgay(getYesterdayDate())}
                            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${ngay === getYesterdayDate()
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Hôm qua
                        </button>
                        <button
                            type="button"
                            onClick={() => setNgay(getTodayDate())}
                            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${ngay === getTodayDate()
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Hôm nay
                        </button>
                        <button
                            type="button"
                            onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
                            className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium text-sm transition-colors"
                        >
                            Chọn khác
                        </button>
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={ngay}
                            onChange={(e) => setNgay(e.target.value)}
                            className="hidden"
                        />
                    </div>
                </div>

                <div className="relative">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">🔍 Sản phẩm</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            placeholder="Tìm sản phẩm..."
                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 font-medium"
                        />
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="absolute right-3 top-3 text-gray-600 text-xl hover:text-gray-900"
                        >
                            ▼
                        </button>
                    </div>

                    {isDropdownOpen && filteredProducts.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredProducts.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => handleSelectProduct(product)}
                                    className="w-full px-4 py-3 text-left hover:bg-green-50 border-b border-gray-100 last:border-b-0"
                                >
                                    <div className="font-semibold text-gray-900">{product.ten_hang}</div>
                                    <div className="text-sm text-gray-700">
                                        {product.gia_nhap_gan_nhat > 0 && `Giá nhập: ${formatCurrency(product.gia_nhap_gan_nhat)} | `}
                                        Tồn: {inventory[product.id] || 0} {product.don_vi}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedProduct && (
                        <div className="mt-2 space-y-1">
                            <div className="text-sm text-green-600 font-medium">
                                💡 Giá nhập: {formatCurrency(selectedProduct.gia_nhap_gan_nhat)} | Tồn: {currentInventory} {selectedProduct.don_vi}
                            </div>
                            {giaBanGoiY > 0 && (
                                <div className="text-sm text-blue-600 font-semibold">
                                    💰 Giá bán khuyến nghị: {formatCurrency(giaBanGoiY)}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">📦 Số lượng</label>
                    <div className="flex items-center gap-2">
                        <input
                            ref={soLuongRef}
                            type="text"
                            inputMode="numeric"
                            value={formatNumber(soLuong)}
                            onChange={(e) => setSoLuong(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && soLuong) {
                                    e.preventDefault();
                                    giaBanRef.current?.focus();
                                }
                            }}
                            placeholder="0"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-gray-900 font-medium text-lg"
                        />
                        <span className="text-gray-900 font-medium">{selectedProduct?.don_vi || 'cái'}</span>
                    </div>
                    {soLuong && remainingInventory < 0 && (
                        <div className="mt-2 text-sm text-red-600 font-semibold">
                            ⚠️ Không đủ hàng! Tồn kho chỉ còn {currentInventory}
                        </div>
                    )}
                    {soLuong && remainingInventory >= 0 && (
                        <div className="mt-2 text-sm text-blue-600 font-medium">
                            ℹ️ Sau bán còn: {remainingInventory} {selectedProduct?.don_vi || 'cái'}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">💵 Giá bán</label>
                    <input
                        ref={giaBanRef}
                        type="text"
                        inputMode="numeric"
                        value={formatNumber(giaBan)}
                        onChange={(e) => setGiaBan(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-gray-900 font-medium text-lg"
                    />
                </div>

                {thanhTien > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-900 font-semibold text-sm">💸 Thành tiền</span>
                            <span className="text-xl font-bold text-green-600">{formatCurrency(thanhTien)}</span>
                        </div>
                        {lai.amount !== 0 && (
                            <div className="flex justify-between items-center border-t border-green-200 pt-2">
                                <span className="text-gray-900 font-semibold text-sm">💰 Lãi</span>
                                <span className={`text-xl font-bold ${lai.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {lai.amount >= 0 ? '+' : ''}{formatCurrency(lai.amount)} ({lai.percent.toFixed(1)}%)
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">👤 Khách hàng</label>
                    <input
                        type="text"
                        value={khachHang}
                        onChange={(e) => setKhachHang(e.target.value)}
                        placeholder="Khách lẻ"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">📝 Ghi chú</label>
                    <textarea
                        value={ghiChu}
                        onChange={(e) => setGhiChu(e.target.value)}
                        placeholder="Tùy chọn"
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={isLoading || remainingInventory < 0}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors mt-6"
                >
                    {isLoading ? '⏳ Đang lưu...' : '✓ BÁN & LƯU'}
                </button>
            </div>
        </div>
    );
}
