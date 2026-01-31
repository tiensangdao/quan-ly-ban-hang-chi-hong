'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatNumber, parseNumber, getTodayDate, formatDateVietnamese, getYesterdayDate } from '@/lib/utils';
import { ShoppingCart, Calendar, Search, ChevronDown, Package, DollarSign, Lightbulb, User, FileText, CheckCircle, Clock, AlertTriangle, Info, Sparkles, Save } from 'lucide-react';

interface Product {
    id: string;
    ten_hang: string;
    don_vi: string;
    gia_nhap_gan_nhat: number;
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

        const { data } = await supabase
            .from('nhap_hang')
            .select('gia_ban_goi_y')
            .eq('product_id', product.id)
            .order('ngay_thang', { ascending: false })
            .limit(1)
            .single();

        if (data?.gia_ban_goi_y) {
            setGiaBanGoiY(data.gia_ban_goi_y);
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
        <div className="p-5 pb-24 min-h-screen bg-background">
            <div className="bg-gradient-to-r from-primary to-orange-400 text-white rounded-2xl p-6 mb-6 shadow-lg shadow-orange-200/50">
                <div className="flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Bán Hàng</h1>
                </div>
            </div>

            {showSuccess && (
                <div className="bg-green-50 border-2 border-green-400 text-green-800 px-5 py-4 rounded-2xl mb-4 flex items-center gap-3 shadow-md">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="font-bold">Đã lưu thành công!</span>
                </div>
            )}

            <div className="space-y-4">
                <div className="clay-card p-5">
                    <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Ngày
                    </label>

                    <div className="bg-orange-50 border-2 border-orange-100 rounded-xl p-4 mb-3 shadow-inner">
                        <div className="text-2xl font-bold text-primary text-center">
                            {formatDateVietnamese(ngay)}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setNgay(getYesterdayDate())}
                            className={`px-3 py-3 rounded-xl font-bold text-sm transition-all transform active:scale-95 ${ngay === getYesterdayDate()
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Hôm qua
                        </button>
                        <button
                            type="button"
                            onClick={() => setNgay(getTodayDate())}
                            className={`px-3 py-3 rounded-xl font-bold text-sm transition-all transform active:scale-95 ${ngay === getTodayDate()
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Hôm nay
                        </button>
                        <button
                            type="button"
                            onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
                            className="px-3 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-sm transition-all transform active:scale-95"
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

                <div className="relative clay-card p-5">
                    <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <Search className="w-5 h-5 text-primary" />
                        Sản phẩm
                    </label>
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
                            className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-foreground font-semibold transition-all outline-none"
                        />
                        <Search className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="absolute right-12 top-3 text-gray-600 hover:text-foreground transition-colors"
                        >
                            <ChevronDown className="w-5 h-5" />
                        </button>
                    </div>

                    {isDropdownOpen && filteredProducts.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white border-2 border-orange-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                            {filteredProducts.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => handleSelectProduct(product)}
                                    className="w-full px-5 py-4 text-left hover:bg-orange-50 border-b border-gray-100 last:border-b-0 transition-all first:rounded-t-2xl last:rounded-b-2xl"
                                >
                                    <div className="font-bold text-foreground">{product.ten_hang}</div>
                                    <div className="text-sm text-gray-600 font-semibold">
                                        {product.gia_nhap_gan_nhat > 0 && `Giá nhập: ${formatCurrency(product.gia_nhap_gan_nhat)} | `}
                                        Tồn: {inventory[product.id] || 0} {product.don_vi}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedProduct && (
                        <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-primary font-bold bg-orange-50 p-3 rounded-xl border border-orange-200">
                                <Lightbulb className="w-5 h-5" />
                                Giá nhập: {formatCurrency(selectedProduct.gia_nhap_gan_nhat)} | Tồn: {currentInventory} {selectedProduct.don_vi}
                            </div>
                            {giaBanGoiY > 0 && (
                                <div className="flex items-center gap-2 text-sm text-green-700 font-bold bg-green-50 p-3 rounded-xl border border-green-200">
                                    <Sparkles className="w-5 h-5" />
                                    Giá bán khuyến nghị: {formatCurrency(giaBanGoiY)}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="clay-card p-5">
                    <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        Số lượng
                    </label>
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
                            className="flex-1 px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-center text-foreground font-bold text-xl transition-all outline-none"
                        />
                        <span className="text-foreground font-bold text-lg">{selectedProduct?.don_vi || 'cái'}</span>
                    </div>
                    {soLuong && remainingInventory < 0 && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-red-700 font-bold bg-red-50 p-3 rounded-xl border border-red-200">
                            <AlertTriangle className="w-5 h-5" />
                            Không đủ hàng! Tồn kho chỉ còn {currentInventory}
                        </div>
                    )}
                    {soLuong && remainingInventory >= 0 && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 font-semibold bg-blue-50 p-3 rounded-xl border border-blue-200">
                            <Info className="w-5 h-5" />
                            Sau bán còn: {remainingInventory} {selectedProduct?.don_vi || 'cái'}
                        </div>
                    )}
                </div>

                <div className="clay-card p-5">
                    <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        Giá bán
                    </label>
                    <input
                        ref={giaBanRef}
                        type="text"
                        inputMode="numeric"
                        value={formatNumber(giaBan)}
                        onChange={(e) => setGiaBan(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-center text-foreground font-bold text-xl transition-all outline-none"
                    />
                </div>

                {thanhTien > 0 && (
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 space-y-3 shadow-inner">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-800 font-bold text-sm flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-primary" />
                                Thành tiền
                            </span>
                            <span className="text-2xl font-black text-primary">{formatCurrency(thanhTien)}</span>
                        </div>
                        {lai.amount !== 0 && (
                            <div className="flex justify-between items-center border-t-2 border-orange-200 pt-3">
                                <span className="text-gray-800 font-bold text-sm flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-600" />
                                    Lãi
                                </span>
                                <span className={`text-2xl font-black ${lai.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {lai.amount >= 0 ? '+' : ''}{formatCurrency(lai.amount)} ({lai.percent.toFixed(1)}%)
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="clay-card p-5">
                    <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Khách hàng
                    </label>
                    <input
                        type="text"
                        value={khachHang}
                        onChange={(e) => setKhachHang(e.target.value)}
                        placeholder="Khách lẻ"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-foreground font-semibold transition-all outline-none"
                    />
                </div>

                <div className="clay-card p-5">
                    <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Ghi chú
                    </label>
                    <textarea
                        value={ghiChu}
                        onChange={(e) => setGhiChu(e.target.value)}
                        placeholder="Tùy chọn"
                        rows={2}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-foreground font-semibold transition-all outline-none"
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={isLoading || remainingInventory < 0}
                    className="clay-button w-full py-5 px-6 rounded-2xl text-lg mt-6 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Clock className="w-6 h-6 animate-spin" />
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <Save className="w-6 h-6" />
                            BÁN & LƯU
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
