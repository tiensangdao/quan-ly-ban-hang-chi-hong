'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateVietnamese, roundNumber } from '@/lib/utils';
import { 
  BarChart3, 
  Calendar, 
  ArrowDownToLine, 
  TrendingUp, 
  AlertTriangle, 
  AlertCircle,
  Package,
  Sparkles,
  Trophy,
  Store,
  ShoppingCart,
  PackagePlus,
  Wallet
} from 'lucide-react';

interface Product {
  id: string;
  ten_hang: string;
  don_vi: string;
  nguong_canh_bao?: number;
}

interface InventoryAlert {
  product: Product;
  ton_kho: number;
  level: 'critical' | 'warning';
}

interface DailyStats {
  tong_nhap: number;
  so_don_nhap: number;
  tong_ban: number;
  so_don_ban: number;
  lai: number;
}

interface MonthlyStats {
  chi_nhap: number;
  doanh_thu: number;
  lai: number;
  ty_le_lai: number;
}

interface TopProduct {
  product: Product;
  so_luong: number;
  doanh_thu: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [globalAlertThreshold, setGlobalAlertThreshold] = useState(5); // Default
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    tong_nhap: 0,
    so_don_nhap: 0,
    tong_ban: 0,
    so_don_ban: 0,
    lai: 0,
  });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    chi_nhap: 0,
    doanh_thu: 0,
    lai: 0,
    ty_le_lai: 0,
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [hasImportedToday, setHasImportedToday] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchSettings();
      await fetchDashboardData();
    };
    init();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('nguong_canh_bao_mac_dinh')
      .eq('id', 1)
      .single();
    
    if (data?.nguong_canh_bao_mac_dinh) {
      setGlobalAlertThreshold(data.nguong_canh_bao_mac_dinh);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    await Promise.all([
      fetchInventoryAlerts(),
      fetchDailyStats(),
      fetchMonthlyStats(),
      fetchTopProducts(),
      checkTodayImport(),
    ]);
    setLoading(false);
  };

  const fetchInventoryAlerts = async () => {
    const { data: products } = await supabase
      .from('products')
      .select('id, ten_hang, don_vi, nguong_canh_bao')
      .eq('active', true);

    if (!products) return;

    const { data: nhapData } = await supabase.from('nhap_hang').select('product_id, so_luong');
    const { data: banData } = await supabase.from('ban_hang').select('product_id, so_luong');

    const inventory: Record<string, number> = {};
    nhapData?.forEach(item => {
      inventory[item.product_id] = (inventory[item.product_id] || 0) + item.so_luong;
    });
    banData?.forEach(item => {
      inventory[item.product_id] = (inventory[item.product_id] || 0) - item.so_luong;
    });

    const alertsList: InventoryAlert[] = [];
    products.forEach(product => {
      const stock = inventory[product.id] || 0;
      const threshold = product.nguong_canh_bao ?? globalAlertThreshold;
      
      if (stock === 0) {
        alertsList.push({ product, ton_kho: stock, level: 'critical' });
      } else if (stock <= threshold) {
        alertsList.push({ product, ton_kho: stock, level: 'critical' });
      }
    });

    alertsList.sort((a, b) => a.ton_kho - b.ton_kho);
    setAlerts(alertsList);
  };

  const fetchDailyStats = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data: nhapData } = await supabase
      .from('nhap_hang')
      .select('so_luong, don_gia')
      .eq('ngay_thang', today);

    const { data: banData } = await supabase
      .from('ban_hang')
      .select('so_luong, gia_ban, gia_nhap')
      .eq('ngay_ban', today);

    const tongNhap = nhapData?.reduce((sum, item) => sum + (item.so_luong * item.don_gia), 0) || 0;
    const tongBan = banData?.reduce((sum, item) => sum + (item.so_luong * item.gia_ban), 0) || 0;
    const lai = tongBan - tongNhap;

    setDailyStats({
      tong_nhap: roundNumber(tongNhap),
      so_don_nhap: nhapData?.length || 0,
      tong_ban: roundNumber(tongBan),
      so_don_ban: banData?.length || 0,
      lai: roundNumber(lai),
    });
  };

  const fetchMonthlyStats = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: nhapData } = await supabase
      .from('nhap_hang')
      .select('so_luong, don_gia')
      .gte('ngay_thang', startOfMonth)
      .lte('ngay_thang', endOfMonth);

    const { data: banData } = await supabase
      .from('ban_hang')
      .select('so_luong, gia_ban, gia_nhap')
      .gte('ngay_ban', startOfMonth)
      .lte('ngay_ban', endOfMonth);

    const chiNhap = nhapData?.reduce((sum, item) => sum + (item.so_luong * item.don_gia), 0) || 0;
    const doanhThu = banData?.reduce((sum, item) => sum + (item.so_luong * item.gia_ban), 0) || 0;
    const lai = doanhThu - chiNhap;
    const tyLeLai = chiNhap > 0 ? (lai / chiNhap) * 100 : 0;

    setMonthlyStats({
      chi_nhap: roundNumber(chiNhap),
      doanh_thu: roundNumber(doanhThu),
      lai: roundNumber(lai),
      ty_le_lai: roundNumber(tyLeLai * 10) / 10,
    });
  };

  const fetchTopProducts = async () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const weekStart = startOfWeek.toISOString().split('T')[0];

    const { data: banData } = await supabase
      .from('ban_hang')
      .select('product_id, so_luong, gia_ban')
      .gte('ngay_ban', weekStart);

    const { data: products } = await supabase
      .from('products')
      .select('id, ten_hang, don_vi')
      .eq('active', true);

    if (!banData || !products) return;

    const productMap: Record<string, { so_luong: number; doanh_thu: number }> = {};
    banData.forEach(item => {
      if (!productMap[item.product_id]) {
        productMap[item.product_id] = { so_luong: 0, doanh_thu: 0 };
      }
      productMap[item.product_id].so_luong += item.so_luong;
      productMap[item.product_id].doanh_thu += item.so_luong * item.gia_ban;
    });

    const topList: TopProduct[] = products
      .map(product => ({
        product,
        so_luong: productMap[product.id]?.so_luong || 0,
        doanh_thu: productMap[product.id]?.doanh_thu || 0,
      }))
      .filter(item => item.so_luong > 0)
      .sort((a, b) => b.so_luong - a.so_luong)
      .slice(0, 3);

    setTopProducts(topList);
  };

  const checkTodayImport = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('nhap_hang')
      .select('id')
      .eq('ngay_thang', today)
      .limit(1);

    setHasImportedToday((data?.length || 0) > 0);
  };

  const getVietnameseDate = () => {
    const now = new Date();
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const day = days[now.getDay()];
    const date = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    return `${day}, ${date}/${month}/${year}`;
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `Tháng ${now.getMonth() + 1}`;
  };

  if (loading) {
    return (
      <div className="p-5 pb-24 flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-primary font-medium">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 pb-24 min-h-screen bg-background">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-orange-200">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý Chị Hồng
          </h1>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-foreground/70 ml-1">
          <Calendar className="w-4 h-4 text-primary" />
          <span>{getVietnameseDate()}</span>
        </div>
      </div>

      {(alerts.length > 0 || !hasImportedToday) && (
        <div className="bg-white border-2 border-red-200 rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-red-800">CẢNH BÁO</h2>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.product.id} className="bg-red-50 rounded-xl p-3 border border-red-100 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="font-semibold text-red-900">
                      {alert.product.ten_hang}:{' '}
                      {alert.ton_kho === 0 ? 'Hết hàng' : `Còn ${alert.ton_kho} ${alert.product.don_vi}`}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/nhap-hang?product=${encodeURIComponent(alert.product.ten_hang)}`)}
                    className="ml-2 px-3 py-1.5 clay-button text-sm"
                  >
                    Nhập ngay
                  </button>
                </div>
              </div>
            ))}

            {!hasImportedToday && (
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-200 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <Package className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="font-semibold text-orange-900">
                      Chưa nhập hàng hôm nay
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/nhap-hang')}
                    className="ml-2 px-3 py-1.5 clay-button text-sm"
                  >
                    Nhập hàng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="clay-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">HÔM NAY</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center p-2.5 bg-background rounded-lg border border-orange-100">
            <div className="flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-primary" />
              <span className="text-foreground/80 font-medium">Chi Nhập:</span>
            </div>
            <span className="font-semibold text-foreground">
              {formatCurrency(dailyStats.tong_nhap)} ({dailyStats.so_don_nhap} đơn)
            </span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-background rounded-lg border border-orange-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <span className="text-foreground/80 font-medium">Doanh Thu:</span>
            </div>
            <span className="font-semibold text-foreground">
              {formatCurrency(dailyStats.tong_ban)} ({dailyStats.so_don_ban} đơn)
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border border-orange-200 mt-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              <span className="text-foreground font-semibold">Lợi Nhuận:</span>
            </div>
            <span className={`font-bold text-lg ${dailyStats.lai >= 0 ? 'text-success-text' : 'text-danger-text'}`}>
              {dailyStats.lai >= 0 ? '+' : ''}{formatCurrency(dailyStats.lai)}
            </span>
          </div>
        </div>
      </div>

      <div className="clay-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-secondary/10 p-1.5 rounded-lg">
            <TrendingUp className="w-4 h-4 text-secondary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{getCurrentMonth().toUpperCase()}</h2>
        </div>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4 text-primary" />
              <span className="text-foreground/80">Chi nhập:</span>
            </div>
            <span className="font-semibold text-foreground">{formatCurrency(monthlyStats.chi_nhap)}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-secondary" />
              <span className="text-foreground/80">Doanh thu:</span>
            </div>
            <span className="font-semibold text-foreground">{formatCurrency(monthlyStats.doanh_thu)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-orange-100">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-foreground font-medium">Lãi gộp:</span>
            </div>
            <span className={`font-semibold ${monthlyStats.lai >= 0 ? 'text-success-text' : 'text-danger-text'}`}>
              {monthlyStats.lai >= 0 ? '+' : ''}{formatCurrency(monthlyStats.lai)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-foreground/80">Tỷ lệ lãi:</span>
            </div>
            <span className="font-semibold text-primary">{monthlyStats.ty_le_lai}%</span>
          </div>
        </div>
      </div>

      {topProducts.length > 0 && (
        <div className="clay-card p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">TOP BÁN CHẠY</h2>
          </div>
          <div className="space-y-4">
            {topProducts.map((item, index) => {
              const maxQty = topProducts[0].so_luong;
              const percentage = (item.so_luong / maxQty) * 100;
              const medalColors = ['from-yellow-400 to-amber-500', 'from-gray-300 to-gray-400', 'from-orange-400 to-amber-600'];
              const bgColors = ['bg-orange-50', 'bg-gray-100', 'bg-white'];

              return (
                <div key={item.product.id} className={`p-3 rounded-xl ${bgColors[index] || 'bg-background'}`}>
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`bg-gradient-to-br ${medalColors[index] || 'from-primary to-orange-400'} w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                        {index + 1}
                      </div>
                      <span className="font-semibold text-foreground">
                        {item.product.ten_hang}
                      </span>
                    </div>
                    <span className="text-foreground/80 font-medium">
                      {item.so_luong} {item.product.don_vi}
                    </span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2.5 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-primary via-orange-400 to-secondary h-2.5 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => router.push('/ton-kho')}
            className="mt-4 w-full text-center py-2.5 clay-button text-sm"
          >
            Xem tất cả →
          </button>
        </div>
      )}
    </div>
  );
}
