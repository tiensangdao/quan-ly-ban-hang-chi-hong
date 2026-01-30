'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateVietnamese, roundNumber } from '@/lib/utils';

interface Product {
  id: string;
  ten_hang: string;
  don_vi: string;
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
    fetchDashboardData();
  }, []);

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
      .select('id, ten_hang, don_vi')
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
      if (stock === 0) {
        alertsList.push({ product, ton_kho: stock, level: 'critical' });
      } else if (stock <= 5) {
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
      <div className="p-5 pb-24 flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-5 pb-24 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📊 KHO HÀNG - Hôm nay</h1>
        <p className="text-sm text-gray-600 mt-1">📅 {getVietnameseDate()}</p>
      </div>

      {(alerts.length > 0 || !hasImportedToday) && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-bold text-red-900 mb-3">⚠️ CẢNH BÁO QUAN TRỌNG</h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.product.id} className="bg-white rounded-lg p-3 border border-red-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-red-700">
                      🔴 {alert.product.ten_hang}:{' '}
                      {alert.ton_kho === 0 ? 'Hết hàng' : `Còn ${alert.ton_kho} ${alert.product.don_vi}`}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/nhap-hang')}
                    className="ml-2 px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors"
                  >
                    Nhập ngay
                  </button>
                </div>
              </div>
            ))}

            {!hasImportedToday && (
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-yellow-700">
                      🟡 Chưa nhập hàng hôm nay
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/nhap-hang')}
                    className="ml-2 px-3 py-1 bg-yellow-600 text-white text-sm font-semibold rounded hover:bg-yellow-700 transition-colors"
                  >
                    Nhập hàng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-3">💰 HÔM NAY</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">📥 Nhập:</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(dailyStats.tong_nhap)} ({dailyStats.so_don_nhap} đơn)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">💰 Bán:</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(dailyStats.tong_ban)} ({dailyStats.so_don_ban} đơn)
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-700">💸 Lãi:</span>
            <span className={`font-bold ${dailyStats.lai >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {dailyStats.lai >= 0 ? '+' : ''}{formatCurrency(dailyStats.lai)} {dailyStats.lai > 0 && '⭐'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-3">📈 {getCurrentMonth().toUpperCase()}</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">📥 Chi nhập:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(monthlyStats.chi_nhap)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">💰 Doanh thu:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(monthlyStats.doanh_thu)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">💸 Lãi gộp:</span>
            <span className={`font-semibold ${monthlyStats.lai >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthlyStats.lai >= 0 ? '+' : ''}{formatCurrency(monthlyStats.lai)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">📈 Tỷ lệ lãi:</span>
            <span className="font-semibold text-blue-600">{monthlyStats.ty_le_lai}%</span>
          </div>
        </div>
      </div>

      {topProducts.length > 0 && (
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-3">🏆 TOP BÁN TUẦN NÀY</h2>
          <div className="space-y-3">
            {topProducts.map((item, index) => {
              const maxQty = topProducts[0].so_luong;
              const percentage = (item.so_luong / maxQty) * 100;

              return (
                <div key={item.product.id}>
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="font-semibold text-gray-900">
                      {index + 1}. {item.product.ten_hang}
                    </span>
                    <span className="text-gray-700">
                      {item.so_luong} {item.product.don_vi}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => router.push('/ton-kho')}
            className="mt-4 w-full text-center text-blue-600 font-semibold text-sm hover:text-blue-700"
          >
            [Xem tất cả →]
          </button>
        </div>
      )}
    </div>
  );
}