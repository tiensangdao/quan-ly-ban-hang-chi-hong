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
import { Settings, Save, Database, Download, FileSpreadsheet, Package, Search, ToggleLeft, ToggleRight, Edit, Settings2, Bell, Info, HardDrive, ShoppingCart, ArrowDownToLine, ArrowUpFromLine, DollarSign, AlertTriangle } from 'lucide-react';

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
            <div className="p-5 pb-24 flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-gray-500 font-medium">Đang tải cài đặt...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 pb-24 bg-gradient-to-br from-blue-50 via-white to-blue-50 min-h-screen">
            <Toaster position="top-center" />
            
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-2xl p-6 mb-6 shadow-lg">
                <div className="flex items-center gap-3">
                    <Settings className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Cài đặt</h1>
                </div>
            </div>

            {/* Section 1: Backup & Export */}
            <div className="bg-white rounded-2xl p-5 mb-5 shadow-lg border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    Sao lưu & Xuất dữ liệu
                </h2>

                {/* Google Sheets Sync */}
                <div className="mb-4 pb-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        Đồng bộ Google Sheets
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 font-medium">
                        Lần cuối: {settings?.last_sync_sheets
                            ? formatDateVietnamese(settings.last_sync_sheets)
                            : 'Chưa có'}
                    </p>
                    <button
                        onClick={handleSyncSheets}
                        disabled={syncing}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowUpFromLine className={`w-4 h-4 ${syncing ? 'animate-bounce' : ''}`} />
                        {syncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
                    </button>
                </div>

                {/* Excel Export */}
                <div>
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Download className="w-4 h-4 text-blue-600" />
                        Tải báo cáo Excel
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => handleExport('month')}
                            disabled={exporting}
                            className="px-3 py-3 bg-white border-2 border-green-500 text-green-700 font-bold text-sm rounded-xl hover:bg-green-50 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 transition-all shadow-sm"
                        >
                            Tháng này
                        </button>
                        <button
                            onClick={() => handleExport('year')}
                            disabled={exporting}
                            className="px-3 py-3 bg-white border-2 border-green-500 text-green-700 font-bold text-sm rounded-xl hover:bg-green-50 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 transition-all shadow-sm"
                        >
                            Năm nay
                        </button>
                        <button
                            onClick={() => handleExport('all')}
                            disabled={exporting}
                            className="px-3 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-sm rounded-xl hover:shadow-md disabled:from-gray-400 disabled:to-gray-400 transition-all"
                        >
                            Tất cả
                        </button>
                    </div>
                </div>
            </div>

            {/* Section 2: Product Management */}
            <div className="bg-white rounded-2xl p-5 mb-5 shadow-lg border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Quản lý sản phẩm
                </h2>

                <div className="relative mb-4">
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm sản phẩm..."
                        className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium transition-all"
                    />
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 hover:bg-white hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-gray-900 text-lg">{product.ten_hang}</h3>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={product.active}
                                        onChange={(e) => handleToggleActive(product.id, e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>

                            {editingProduct === product.id ? (
                                <div className="space-y-3 bg-white p-3 rounded-lg border border-blue-100 shadow-inner">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-gray-500 mb-1 block">Đơn vị</label>
                                            <input
                                                type="text"
                                                defaultValue={product.don_vi}
                                                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg text-gray-900 font-semibold focus:border-blue-500 outline-none"
                                                onBlur={(e) => handleUpdateProduct(product.id, { don_vi: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-gray-500 mb-1 block">Lãi %</label>
                                            <input
                                                type="number"
                                                defaultValue={product.ty_le_lai_mac_dinh}
                                                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg text-gray-900 font-semibold focus:border-blue-500 outline-none"
                                                onBlur={(e) => handleUpdateProduct(product.id, { ty_le_lai_mac_dinh: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-gray-500 mb-1 block">Cảnh báo</label>
                                            <input
                                                type="number"
                                                defaultValue={product.nguong_canh_bao}
                                                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg text-gray-900 font-semibold focus:border-blue-500 outline-none"
                                                onBlur={(e) => handleUpdateProduct(product.id, { nguong_canh_bao: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEditingProduct(null)}
                                        className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-lg transition-colors"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 font-medium mb-3">
                                        <span className="bg-white px-2 py-1 rounded border border-gray-200">Đơn vị: {product.don_vi}</span>
                                        <span className="bg-white px-2 py-1 rounded border border-gray-200">Lãi: {product.ty_le_lai_mac_dinh}%</span>
                                        <span className="bg-white px-2 py-1 rounded border border-gray-200">Min: {product.nguong_canh_bao}</span>
                                    </div>
                                    <button
                                        onClick={() => setEditingProduct(product.id)}
                                        className="flex items-center gap-1 text-sm text-blue-600 font-bold hover:text-blue-800 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Chỉnh sửa
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 3: General Settings */}
            <div className="bg-white rounded-2xl p-5 mb-5 shadow-lg border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-blue-600" />
                    Cấu hình chung
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            Tỷ lệ lãi mặc định (%)
                        </label>
                        <input
                            type="number"
                            value={settings?.ty_le_lai_mac_dinh || 30}
                            onChange={(e) => setSettings(prev => prev ? { ...prev, ty_le_lai_mac_dinh: parseInt(e.target.value) } : null)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            Cảnh báo tồn kho mặc định (đơn vị)
                        </label>
                        <input
                            type="number"
                            value={settings?.nguong_canh_bao_mac_dinh || 10}
                            onChange={(e) => setSettings(prev => prev ? { ...prev, nguong_canh_bao_mac_dinh: parseInt(e.target.value) } : null)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold transition-all"
                        />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings?.reminder_nhap_hang || false}
                                onChange={(e) => setSettings(prev => prev ? { ...prev, reminder_nhap_hang: e.target.checked } : null)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                            />
                            <span className="flex items-center gap-2 text-gray-900 font-semibold">
                                <Bell className="w-4 h-4 text-blue-600" />
                                Nhắc nhập hàng (9h sáng)
                            </span>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings?.reminder_het_hang || false}
                                onChange={(e) => setSettings(prev => prev ? { ...prev, reminder_het_hang: e.target.checked } : null)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                            />
                            <span className="flex items-center gap-2 text-gray-900 font-semibold">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                Cảnh báo hết hàng
                            </span>
                        </label>
                    </div>

                    <button
                        onClick={handleSaveSettings}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        <Save className="w-5 h-5" />
                        Lưu cài đặt
                    </button>
                </div>
            </div>

            {/* Section 4: System Info */}
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    Thông tin hệ thống
                </h2>

                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-600 font-medium flex items-center gap-2">
                            <Package className="w-4 h-4" /> Sản phẩm
                        </span>
                        <span className="font-bold text-gray-900 text-lg">{systemStats?.products || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-600 font-medium flex items-center gap-2">
                            <ArrowDownToLine className="w-4 h-4" /> Đơn nhập
                        </span>
                        <span className="font-bold text-gray-900 text-lg">{systemStats?.nhap_hang?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-600 font-medium flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" /> Đơn bán
                        </span>
                        <span className="font-bold text-gray-900 text-lg">{systemStats?.ban_hang?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-600 font-medium flex items-center gap-2">
                            <HardDrive className="w-4 h-4" /> Dung lượng
                        </span>
                        <span className="font-bold text-gray-900 text-lg">
                            {systemStats?.storage ? (systemStats.storage / 1024 / 1024).toFixed(2) + ' MB' : '0 MB'}
                        </span>
                    </div>
                    <div className="text-center pt-2">
                        <span className="text-xs font-semibold text-gray-400">Phiên bản 1.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
