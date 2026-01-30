'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatNumber, parseNumber, getTodayDate, formatDateVietnamese, getYesterdayDate, roundNumber } from '@/lib/utils';

interface Product {
    id: string;
    ten_hang: string;
    don_vi: string;
    gia_nhap_gan_nhat: number;
}

export default function NhapHangPage() {
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
        <div className="p-5 pb-8">
            <h1 className="text-2xl font-bold text-blue-600 mb-6">📥 Nhập hàng mới</h1>

            {showSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                    ✅ <span className="font-semibold">Đã lưu thành công!</span>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">📅 Ngày</label>

                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 mb-2">
                        <div className="text-xl font-bold text-blue-600 text-center">
                            {formatDateVietnamese(ngay)}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setNgay(getYesterdayDate())}
                            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${ngay === getYesterdayDate()
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Hôm qua
                        </button>
                        <button
                            type="button"
                            onClick={() => setNgay(getTodayDate())}
                            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${ngay === getTodayDate()
                                ? 'bg-blue-600 text-white'
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
                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
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
                                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                >
                                    <div className="font-semibold text-gray-900">{product.ten_hang}</div>
                                    <div className="text-sm text-gray-700">
                                        {product.gia_nhap_gan_nhat > 0 && `Giá gần nhất: ${formatCurrency(product.gia_nhap_gan_nhat)}`}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedProduct && selectedProduct.gia_nhap_gan_nhat > 0 && (
                        <div className="mt-2 text-sm text-blue-600 font-medium">
                            💡 Giá nhập lần trước: {formatCurrency(selectedProduct.gia_nhap_gan_nhat)}
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
                                    thanhTienRef.current?.focus();
                                }
                            }}
                            placeholder="0"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-gray-900 font-medium text-lg"
                        />
                        <span className="text-gray-900 font-medium">{selectedProduct?.don_vi || 'cái'}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">� Thành tiền</label>
                    <input
                        ref={thanhTienRef}
                        type="text"
                        inputMode="numeric"
                        value={formatNumber(thanhTien)}
                        onChange={(e) => setThanhTien(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-gray-900 font-medium text-lg"
                    />
                </div>

                {donGia > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-900 font-semibold text-sm">💵 Đơn giá</span>
                            <span className="text-xl font-bold text-blue-600">{formatCurrency(donGia)}</span>
                        </div>
                        {giaBanGoiY > 0 && (
                            <div className="flex justify-between items-center border-t border-blue-200 pt-2">
                                <span className="text-gray-900 font-semibold text-sm">💡 Giá bán gợi ý (+50%)</span>
                                <span className="text-xl font-bold text-green-600">{formatCurrency(giaBanGoiY)}</span>
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">👤 Nhà cung cấp</label>
                    <input
                        type="text"
                        value={nhaCungCap}
                        onChange={(e) => setNhaCungCap(e.target.value)}
                        placeholder="Tùy chọn"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">📝 Ghi chú</label>
                    <textarea
                        value={ghiChu}
                        onChange={(e) => setGhiChu(e.target.value)}
                        placeholder="Tùy chọn"
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors mt-6"
                >
                    {isLoading ? '⏳ Đang lưu...' : '✓ LƯU NGAY'}
                </button>
            </div>
        </div>
    );
}
