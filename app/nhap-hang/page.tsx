'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatNumber, parseNumber, getTodayDate, formatDateVietnamese, getYesterdayDate, roundNumber } from '@/lib/utils';
import { PackagePlus, Calendar, Search, ChevronDown, Package, DollarSign, Lightbulb, User, FileText, CheckCircle, Clock, Save, Trash2 } from 'lucide-react';

interface Product {
    id: string;
    ten_hang: string;
    don_vi: string;
    gia_nhap_gan_nhat: number;
}

export default function NhapHangPage() {
    // ... (state logic preserved) ...
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [ngay, setNgay] = useState(getTodayDate());
    const [soLuong, setSoLuong] = useState('');
    const [thanhTien, setThanhTien] = useState('');
    const [nhaCungCap, setNhaCungCap] = useState('');
    const [ghiChu, setGhiChu] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const dateInputRef = useRef<HTMLInputElement>(null);
    const soLuongRef = useRef<HTMLInputElement>(null);
    const thanhTienRef = useRef<HTMLInputElement>(null);

    const selectedProduct = products.find(p => p.id === selectedProductId);

    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.ten_hang.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const donGia = useMemo(() => {
        const sl = parseNumber(soLuong);
        const tt = parseNumber(thanhTien);
        if (sl === 0) return 0;
        return roundNumber(tt / sl);
    }, [soLuong, thanhTien]);

    const giaBanGoiY = useMemo(() => {
        return roundNumber(donGia * 1.5);
    }, [donGia]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').eq('active', true);
        if (data) setProducts(data);
    };

    const handleSelectProduct = (product: Product) => {
        setSelectedProductId(product.id);
        setSearchTerm(product.ten_hang);
        setIsDropdownOpen(false);
        setTimeout(() => soLuongRef.current?.focus(), 100);
    };

    const handleCreateNewProduct = async (tenHang: string, giaHap: number) => {
        const { data, error } = await supabase.from('products').insert({
            ten_hang: tenHang,
            don_vi: 'cái',
            gia_nhap_gan_nhat: giaHap,
            active: true,
        }).select().single();

        if (error) {
            alert('Lỗi khi tạo sản phẩm: ' + error.message);
            return null;
        }

        await fetchProducts();
        return data;
    };

    const handleSave = async () => {
        if (!soLuong || !thanhTien) {
            alert('Vui lòng nhập số lượng và thành tiền!');
            return;
        }

        let productIdToUse = selectedProductId;

        if (!selectedProductId && searchTerm.trim()) {
            const confirm = window.confirm(
                `Sản phẩm "${searchTerm}" chưa có trong danh sách.\nBạn có muốn thêm sản phẩm mới này không?`
            );

            if (!confirm) return;

            const newProduct = await handleCreateNewProduct(searchTerm.trim(), donGia);
            if (!newProduct) return;

            productIdToUse = newProduct.id;
            setSelectedProductId(newProduct.id);
        }

        if (!productIdToUse) {
            alert('Vui lòng chọn sản phẩm!');
            return;
        }

        setIsLoading(true);

        const { error } = await supabase.from('nhap_hang').insert({
            product_id: productIdToUse,
            ngay_thang: ngay,
            so_luong: parseNumber(soLuong),
            don_gia: donGia,
            gia_ban_goi_y: giaBanGoiY,
            nha_cung_cap: nhaCungCap || null,
            ghi_chu: ghiChu || null,
        });

        setIsLoading(false);

        if (error) {
            alert('Lỗi: ' + error.message);
        } else {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            resetForm();
        }
    };

    const resetForm = () => {
        setSelectedProductId('');
        setSearchTerm('');
        setSoLuong('');
        setThanhTien('');
        setNhaCungCap('');
        setGhiChu('');
        setNgay(getTodayDate());
    };

    return (
        <div className="p-5 pb-8 min-h-screen bg-background">
            <div className="bg-gradient-to-r from-primary to-orange-400 text-white rounded-2xl p-6 mb-6 shadow-lg shadow-orange-200/50">
                <div className="flex items-center gap-3">
                    <PackagePlus className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Nhập Hàng Mới</h1>
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
                                        {product.gia_nhap_gan_nhat > 0 && `Giá gần nhất: ${formatCurrency(product.gia_nhap_gan_nhat)}`}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedProduct && selectedProduct.gia_nhap_gan_nhat > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-primary font-bold bg-orange-50 p-3 rounded-xl border border-orange-200">
                            <Lightbulb className="w-5 h-5" />
                            Giá nhập lần trước: {formatCurrency(selectedProduct.gia_nhap_gan_nhat)}
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
                                    thanhTienRef.current?.focus();
                                }
                            }}
                            placeholder="0"
                            className="flex-1 px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-center text-foreground font-bold text-xl transition-all outline-none"
                        />
                        <span className="text-foreground font-bold text-lg">{selectedProduct?.don_vi || 'cái'}</span>
                    </div>
                </div>

                <div className="clay-card p-5">
                    <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        Thành tiền
                    </label>
                    <input
                        ref={thanhTienRef}
                        type="text"
                        inputMode="numeric"
                        value={formatNumber(thanhTien)}
                        onChange={(e) => setThanhTien(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-center text-foreground font-bold text-xl transition-all outline-none"
                    />
                </div>

                {donGia > 0 && (
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 space-y-3 shadow-inner">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-800 font-bold text-sm flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-primary" />
                                Đơn giá
                            </span>
                            <span className="text-2xl font-black text-primary">{formatCurrency(donGia)}</span>
                        </div>
                        {giaBanGoiY > 0 && (
                            <div className="flex justify-between items-center border-t-2 border-orange-200 pt-3">
                                <span className="text-gray-800 font-bold text-sm flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-green-600" />
                                    Giá bán gợi ý (+50%)
                                </span>
                                <span className="text-2xl font-black text-green-600">{formatCurrency(giaBanGoiY)}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="clay-card p-5">
                    <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Nhà cung cấp
                    </label>
                    <input
                        type="text"
                        value={nhaCungCap}
                        onChange={(e) => setNhaCungCap(e.target.value)}
                        placeholder="Tùy chọn"
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
                    disabled={isLoading}
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
                            LƯU NGAY
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
