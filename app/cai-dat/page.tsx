'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import {
    getSettings,
    updateSettings,
    getProducts,
    updateProduct,
    toggleProductActive,
    getSystemStats,
    syncToGoogleSheets,
    exportToExcel
} from '@/actions/settings';
import { formatCurrency, formatDateVietnamese } from '@/lib/utils';

interface Settings {
    ty_le_lai_mac_dinh: number;
    nguong_canh_bao_mac_dinh: number;
    email_backup_enabled: boolean;
    email_backup_address: string;
    email_backup_frequency: string;
    email_backup_day: string;
    email_backup_time: string;
    reminder_nhap_hang: boolean;
    reminder_het_hang: boolean;
    last_sync_sheets: string | null;
}

interface Product {
    id: string;
    ten_hang: string;
    don_vi: string;
    ty_le_lai_mac_dinh: number;
    nguong_canh_bao: number;
    active: boolean;
}

interface SystemStats {
    products: number;
    nhap_hang: number;
    ban_hang: number;
    storage: number;
}

export default function CaiDatPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingProduct, setEditingProduct] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [settingsData, productsData, statsData] = await Promise.all([
            getSettings(),
            getProducts(),
            getSystemStats(),
        ]);
        setSettings(settingsData);
        setProducts(productsData);
        setSystemStats(statsData);
        setLoading(false);
    };

    const handleSaveSettings = async () => {
        if (!settings) return;
        const result = await updateSettings(settings);
        if (result.success) {
            toast.success('✅ Đã lưu cài đặt!');
        } else {
            toast.error('❌ Lỗi: ' + result.error);
        }
    };

    const handleSyncSheets = async () => {
        setSyncing(true);
        toast.loading('Đang đồng bộ...', { id: 'sync' });

        const result = await syncToGoogleSheets();
        setSyncing(false);

        if (result.success) {
            toast.success(`✅ Đã đồng bộ ${result.rowCount} dòng dữ liệu!`, { id: 'sync' });
            fetchData(); // Refresh to update last_sync_sheets
        } else {
            toast.error('❌ Lỗi đồng bộ', { id: 'sync' });
        }
    };

    const handleExport = async (period: 'month' | 'year' | 'all') => {
        setExporting(true);
        toast.loading(`Đang xuất ${period === 'month' ? 'tháng' : period === 'year' ? 'năm' : 'tất cả'}...`, { id: 'export' });

        const result = await exportToExcel(period);
        setExporting(false);

        if (result.success) {
            // Decode base64 to binary data
            const binaryString = atob(result.base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Create blob and download
            const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.fileName;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success('✅ Đã tải về!', { id: 'export' });
        } else {
            toast.error('❌ Lỗi xuất file', { id: 'export' });
        }
    };

    const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
        const result = await updateProduct(id, updates);
        if (result.success) {
            toast.success('✅ Đã cập nhật sản phẩm!');
            setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
            setEditingProduct(null);
        } else {
            toast.error('❌ Lỗi: ' + result.error);
        }
    };

    const handleToggleActive = async (id: string, active: boolean) => {
        const result = await toggleProductActive(id, active);
        if (result.success) {
            toast.success(active ? '✅ Đã bật sản phẩm!' : '⚠️ Đã tắt sản phẩm!');
            setProducts(products.map(p => p.id === id ? { ...p, active } : p));
        } else {
            toast.error('❌ Lỗi: ' + result.error);
        }
    };

    const filteredProducts = products.filter(p =>
        p.ten_hang.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-5 pb-24 flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="p-5 pb-24 bg-gray-50 min-h-screen">
            <Toaster position="top-center" />
            <h1 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Cài đặt</h1>

            {/* Section 1: Backup & Export */}
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">💾 Sao lưu & Xuất dữ liệu</h2>

                {/* Google Sheets Sync */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">📊 Đồng bộ Google Sheets</h3>
                    <p className="text-sm text-gray-900 mb-2">
                        Lần cuối: {settings?.last_sync_sheets
                            ? formatDateVietnamese(settings.last_sync_sheets)
                            : 'Chưa có'}
                    </p>
                    <button
                        onClick={handleSyncSheets}
                        disabled={syncing}
                        className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                        {syncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
                    </button>
                </div>

                {/* Excel Export */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">📥 Tải báo cáo Excel</h3>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => handleExport('month')}
                            disabled={exporting}
                            className="px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                        >
                            Tháng này
                        </button>
                        <button
                            onClick={() => handleExport('year')}
                            disabled={exporting}
                            className="px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                        >
                            Năm nay
                        </button>
                        <button
                            onClick={() => handleExport('all')}
                            disabled={exporting}
                            className="px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                        >
                            Tất cả
                        </button>
                    </div>
                </div>
            </div>

            {/* Section 2: Product Management */}
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">📦 Quản lý sản phẩm</h2>

                <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Tìm sản phẩm..."
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-4 placeholder:text-gray-500 text-gray-900"
                />

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-900">{product.ten_hang}</h3>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={product.active}
                                        onChange={(e) => handleToggleActive(product.id, e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    <span className="ml-2 text-sm text-gray-900 font-medium">
                                        {product.active ? '●Đang bán' : '○Ngừng bán'}
                                    </span>
                                </label>
                            </div>

                            {editingProduct === product.id ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        defaultValue={product.don_vi}
                                        placeholder="Đơn vị"
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                                        onBlur={(e) => handleUpdateProduct(product.id, { don_vi: e.target.value })}
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            defaultValue={product.ty_le_lai_mac_dinh}
                                            placeholder="Lãi %"
                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                                            onBlur={(e) => handleUpdateProduct(product.id, { ty_le_lai_mac_dinh: parseInt(e.target.value) })}
                                        />
                                        <input
                                            type="number"
                                            defaultValue={product.nguong_canh_bao}
                                            placeholder="Cảnh báo"
                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                                            onBlur={(e) => handleUpdateProduct(product.id, { nguong_canh_bao: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setEditingProduct(null)}
                                        className="w-full px-3 py-1 bg-gray-300 text-gray-900 text-sm rounded"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-gray-900 font-medium">
                                        Đơn vị: {product.don_vi} | Lãi: {product.ty_le_lai_mac_dinh}% | Cảnh báo: {product.nguong_canh_bao}
                                    </p>
                                    <button
                                        onClick={() => setEditingProduct(product.id)}
                                        className="mt-2 text-sm text-blue-700 hover:text-blue-800 font-medium"
                                    >
                                        Chỉnh sửa →
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 3: General Settings */}
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">⚙️ Cấu hình chung</h2>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1">
                            💰 Tỷ lệ lãi mặc định (%)
                        </label>
                        <input
                            type="number"
                            value={settings?.ty_le_lai_mac_dinh || 30}
                            onChange={(e) => setSettings(prev => prev ? { ...prev, ty_le_lai_mac_dinh: parseInt(e.target.value) } : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1">
                            ⚠️ Cảnh báo tồn kho mặc định (đơn vị)
                        </label>
                        <input
                            type="number"
                            value={settings?.nguong_canh_bao_mac_dinh || 10}
                            onChange={(e) => setSettings(prev => prev ? { ...prev, nguong_canh_bao_mac_dinh: parseInt(e.target.value) } : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 font-medium"
                        />
                    </div>

                    <div>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={settings?.reminder_nhap_hang || false}
                                onChange={(e) => setSettings(prev => prev ? { ...prev, reminder_nhap_hang: e.target.checked } : null)}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-gray-900 font-medium">Nhắc nhập hàng (9h sáng)</span>
                        </label>
                    </div>

                    <div>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={settings?.reminder_het_hang || false}
                                onChange={(e) => setSettings(prev => prev ? { ...prev, reminder_het_hang: e.target.checked } : null)}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-gray-900 font-medium">Cảnh báo hết hàng</span>
                        </label>
                    </div>

                    <button
                        onClick={handleSaveSettings}
                        className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors mt-4"
                    >
                        Lưu cài đặt
                    </button>
                </div>
            </div>

            {/* Section 4: System Info */}
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">ℹ️ Thông tin hệ thống</h2>

                <div className="space-y-2 text-sm text-gray-900 font-medium">
                    <p className="flex justify-between border-b border-gray-100 pb-2">
                        <span>Sản phẩm:</span>
                        <span className="font-bold text-lg">{systemStats?.products || 0}</span>
                    </p>
                    <p className="flex justify-between border-b border-gray-100 pb-2">
                        <span>Đơn nhập:</span>
                        <span className="font-bold text-lg">{systemStats?.nhap_hang?.toLocaleString() || 0}</span>
                    </p>
                    <p className="flex justify-between border-b border-gray-100 pb-2">
                        <span>Đơn bán:</span>
                        <span className="font-bold text-lg">{systemStats?.ban_hang?.toLocaleString() || 0}</span>
                    </p>
                    <p className="flex justify-between border-b border-gray-100 pb-2">
                        <span>Dung lượng:</span>
                        <span className="font-bold text-lg">{systemStats?.storage ? (systemStats.storage / 1024 / 1024).toFixed(2) + ' MB' : '0 MB'}</span>
                    </p>
                    <p className="flex justify-between pt-1">
                        <span>Phiên bản:</span>
                        <span className="font-bold">1.0</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
