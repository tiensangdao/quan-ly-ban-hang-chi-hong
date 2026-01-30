'use server';

import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { appendToSheet, clearSheet } from '@/lib/googleSheets';
import { setupYearSheet, setupSummarySheet, writeYearSummaryTables } from '@/lib/setupSheet';

// Get settings from database
export async function getSettings() {
    const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (error) {
        console.error('Error fetching settings:', error);
        return null;
    }

    return data;
}

// Update settings
export async function updateSettings(updates: any) {
    const { error } = await supabase
        .from('app_settings')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', 1);

    if (error) {
        console.error('Error updating settings:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Get all products
export async function getProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('ten_hang');

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return data || [];
}

// Update product
export async function updateProduct(id: string, updates: any) {
    const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

    if (error) {
        console.error('Error updating product:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Toggle product active status
export async function toggleProductActive(id: string, active: boolean) {
    return updateProduct(id, { active });
}

// Get system statistics
export async function getSystemStats() {
    const [productsResult, nhapResult, banResult] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('nhap_hang').select('id', { count: 'exact', head: true }),
        supabase.from('ban_hang').select('id', { count: 'exact', head: true }),
    ]);

    const stats = {
        products: productsResult.count || 0,
        nhap_hang: nhapResult.count || 0,
        ban_hang: banResult.count || 0,
        storage: ((productsResult.count || 0) * 0.5 +
            (nhapResult.count || 0) * 0.5 +
            (banResult.count || 0) * 0.5) / 1000, // Estimate in MB
    };

    return stats;
}

// Sync data to Google Sheets
export async function syncToGoogleSheets(year?: number) {
    const targetYear = year || new Date().getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    // Fetch nhap_hang data
    const { data: nhapData } = await supabase
        .from('nhap_hang')
        .select('id, ngay_thang, so_luong, don_gia, nha_cung_cap, product_id, products(ten_hang, don_vi)')
        .gte('ngay_thang', startDate)
        .lte('ngay_thang', endDate)
        .order('ngay_thang');

    // Fetch ban_hang data
    const { data: banData } = await supabase
        .from('ban_hang')
        .select('id, ngay_ban, so_luong, gia_ban, gia_nhap, khach_hang, product_id, products(ten_hang, don_vi)')
        .gte('ngay_ban', startDate)
        .lte('ngay_ban', endDate)
        .order('ngay_ban');

    // Combine data
    const rows: any[] = [
        ['STT', 'Ngày', 'Loại', 'Sản phẩm', 'Đơn vị', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Lãi', 'Khách/NCC', 'Ghi chú']
    ];

    const allData: any[] = [];

    // Add nhap_hang
    nhapData?.forEach(item => {
        allData.push({
            date: item.ngay_thang,
            type: 'NHẬP',
            product: (item.products as any)?.ten_hang || '',
            unit: (item.products as any)?.don_vi || '',
            quantity: item.so_luong,
            price: item.don_gia,
            total: item.so_luong * item.don_gia,
            profit: '',
            partner: item.nha_cung_cap || '',
            note: ''
        });
    });

    // Add ban_hang
    banData?.forEach(item => {
        const profit = item.gia_nhap ? (item.gia_ban - item.gia_nhap) * item.so_luong : 0;
        allData.push({
            date: item.ngay_ban,
            type: 'BÁN',
            product: (item.products as any)?.ten_hang || '',
            unit: (item.products as any)?.don_vi || '',
            quantity: item.so_luong,
            price: item.gia_ban,
            total: item.so_luong * item.gia_ban,
            profit: profit > 0 ? profit : '',
            partner: item.khach_hang || '',
            note: ''
        });
    });

    // Sort by date
    allData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Format rows (12 columns including Tháng - calculated server-side)
    allData.forEach((item, index) => {
        const dateObj = new Date(item.date);
        const month = dateObj.getMonth() + 1; // getMonth() returns 0-11

        rows.push([
            index + 1,
            dateObj.toLocaleDateString('vi-VN'),
            item.type,
            item.product,
            item.unit,
            item.quantity,
            item.price,
            item.total,
            item.profit,
            item.partner,
            item.note,
            month // Tháng column - calculated server-side
        ]);
    });

    // Calculate Top Products (Top BÁN by quantity)
    const productSales: { [key: string]: { unit: string; quantity: number; revenue: number; profit: number } } = {};
    allData.filter(item => item.type === 'BÁN').forEach(item => {
        const key = item.product;
        if (!productSales[key]) {
            productSales[key] = { unit: item.unit, quantity: 0, revenue: 0, profit: 0 };
        }
        productSales[key].quantity += item.quantity || 0;
        productSales[key].revenue += item.total || 0;
        productSales[key].profit += item.profit || 0;
    });

    const topProducts = Object.entries(productSales)
        .map(([product, data]) => ({
            product,
            unit: data.unit,
            quantity: data.quantity,
            revenue: data.revenue,
            profit: data.profit
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

    // Calculate Type Stats (Import vs Export)
    const typeStatsMap = {
        'NHẬP': { count: 0, total: 0 },
        'BÁN': { count: 0, total: 0 }
    };

    allData.forEach(item => {
        if (item.type === 'NHẬP') {
            typeStatsMap['NHẬP'].count++;
            typeStatsMap['NHẬP'].total += item.total || 0;
        } else if (item.type === 'BÁN') {
            typeStatsMap['BÁN'].count++;
            typeStatsMap['BÁN'].total += item.total || 0;
        }
    });

    const typeStats = [
        { type: 'NHẬP', count: typeStatsMap['NHẬP'].count, total: typeStatsMap['NHẬP'].total },
        { type: 'BÁN', count: typeStatsMap['BÁN'].count, total: typeStatsMap['BÁN'].total }
    ];

    // Calculate Inventory / Product Performance (All products involved in transactions)
    const inventoryMap: { [key: string]: { unit: string; totalIn: number; totalOut: number; lastPrice: number; revenue: number; profit: number } } = {};

    allData.forEach(item => {
        const key = item.product;
        if (!key) return; // Skip empty product names

        if (!inventoryMap[key]) {
            inventoryMap[key] = { unit: item.unit, totalIn: 0, totalOut: 0, lastPrice: 0, revenue: 0, profit: 0 };
        }
        if (item.type === 'NHẬP') {
            inventoryMap[key].totalIn += item.quantity || 0;
            inventoryMap[key].lastPrice = item.price || 0; // Giá nhập gần nhất
        } else if (item.type === 'BÁN') {
            inventoryMap[key].totalOut += item.quantity || 0;
            inventoryMap[key].revenue += item.total || 0;
            inventoryMap[key].profit += item.profit || 0;
        }
    });

    const inventory = Object.entries(inventoryMap)
        .map(([product, data]) => ({
            product,
            unit: data.unit,
            totalIn: data.totalIn,
            totalOut: data.totalOut,
            stock: data.totalIn - data.totalOut,
            value: (data.totalIn - data.totalOut) * data.lastPrice,
            revenue: data.revenue,
            profit: data.profit
        }))
        // Filter out items with no interaction? No, all items here have interactions.
        // Maybe sort by Revenue or Profit or Stock? Let's sort by Stock desc, then Profit desc
        .sort((a, b) => b.stock - a.stock || b.profit - a.profit);

    // Actually write to Google Sheets using existing API
    const sheetName = `${targetYear}`; // Sheet name: "2025", "2026", etc.

    try {
        // 1. Setup sheet structure (header, formatting only)
        console.log(`Setting up sheet "${sheetName}"...`);
        const setupResult = await setupYearSheet(targetYear);
        if (!setupResult.success) {
            console.error('Setup sheet warning:', setupResult.error);
        }

        // 2. Clear existing data to prevent duplicates on re-sync
        console.log(`Clearing old data in sheet "${sheetName}"...`);
        await clearSheet(sheetName);

        // 3. Write data rows
        const dataRowCount = rows.length - 1; // Exclude header
        console.log(`Writing ${dataRowCount} rows to sheet "${sheetName}"...`);
        for (const row of rows.slice(1)) { // Skip header row
            const result = await appendToSheet(row, sheetName);
            if (!result.success) {
                console.error('Failed to append row:', result.error);
            }
        }

        // 4. Write Top Products and Inventory tables AFTER data
        console.log(`Writing summary tables to sheet "${sheetName}"...`);
        await writeYearSummaryTables(targetYear, topProducts, inventory, typeStats, dataRowCount);

        // Update last_sync_sheets timestamp
        await supabase
            .from('app_settings')
            .update({ last_sync_sheets: new Date().toISOString() })
            .eq('id', 1);

        // Calculate monthly summaries from allData
        const monthlyData: { month: number; nhap: number; ban: number; lai: number }[] = [];
        for (let month = 1; month <= 12; month++) {
            const monthItems = allData.filter(item => {
                const d = new Date(item.date);
                return d.getMonth() + 1 === month && d.getFullYear() === targetYear;
            });

            const nhap = monthItems
                .filter(i => i.type === 'NHẬP')
                .reduce((sum, i) => sum + (i.total || 0), 0);
            const ban = monthItems
                .filter(i => i.type === 'BÁN')
                .reduce((sum, i) => sum + (i.total || 0), 0);
            const lai = monthItems.reduce((sum, i) => sum + (i.profit || 0), 0);

            monthlyData.push({ month, nhap, ban, lai });
        }

        // Setup/update Tổng hợp sheet with calculated summaries
        console.log('Setting up "Tổng hợp" sheet with monthly data...');
        const summaryResult = await setupSummarySheet(monthlyData);
        if (!summaryResult.success) {
            console.error('Setup summary sheet warning:', summaryResult.error);
        }

        return {
            success: true,
            sheetName,
            rowCount: rows.length - 1
        };
    } catch (error: any) {
        console.error('Google Sheets sync error:', error);
        return {
            success: false,
            error: error.message,
            sheetName,
            rowCount: 0
        };
    }
}

// Export to Excel
export async function exportToExcel(period: 'month' | 'year' | 'all') {
    const now = new Date();
    let startDate: string;
    let endDate: string;
    let fileName: string;

    if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        fileName = `bao-cao-thang-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}.xlsx`;
    } else if (period === 'year') {
        startDate = `${now.getFullYear()}-01-01`;
        endDate = `${now.getFullYear()}-12-31`;
        fileName = `bao-cao-nam-${now.getFullYear()}.xlsx`;
    } else {
        startDate = '2000-01-01';
        endDate = '2099-12-31';
        fileName = `bao-cao-tat-ca-${now.getFullYear()}.xlsx`;
    }

    // Fetch data
    const { data: nhapData } = await supabase
        .from('nhap_hang')
        .select('ngay_thang, so_luong, don_gia, nha_cung_cap, products(ten_hang, don_vi)')
        .gte('ngay_thang', startDate)
        .lte('ngay_thang', endDate)
        .order('ngay_thang');

    const { data: banData } = await supabase
        .from('ban_hang')
        .select('ngay_ban, so_luong, gia_ban, gia_nhap, khach_hang, products(ten_hang, don_vi)')
        .gte('ngay_ban', startDate)
        .lte('ngay_ban', endDate)
        .order('ngay_ban');

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Dữ liệu
    const dataRows: any[] = [
        ['Ngày', 'Loại', 'Sản phẩm', 'Đơn vị', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Lãi', 'Khách/NCC']
    ];

    const allData: any[] = [];

    nhapData?.forEach(item => {
        allData.push({
            date: item.ngay_thang,
            type: 'NHẬP',
            product: (item.products as any)?.ten_hang || '',
            unit: (item.products as any)?.don_vi || '',
            quantity: item.so_luong,
            price: item.don_gia,
            total: item.so_luong * item.don_gia,
            profit: '',
            partner: item.nha_cung_cap || ''
        });
    });

    banData?.forEach(item => {
        const profit = item.gia_nhap ? (item.gia_ban - item.gia_nhap) * item.so_luong : 0;
        allData.push({
            date: item.ngay_ban,
            type: 'BÁN',
            product: (item.products as any)?.ten_hang || '',
            unit: (item.products as any)?.don_vi || '',
            quantity: item.so_luong,
            price: item.gia_ban,
            total: item.so_luong * item.gia_ban,
            profit: profit > 0 ? profit : '',
            partner: item.khach_hang || ''
        });
    });

    allData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    allData.forEach(item => {
        dataRows.push([
            new Date(item.date).toLocaleDateString('vi-VN'),
            item.type,
            item.product,
            item.unit,
            item.quantity,
            item.price,
            item.total,
            item.profit,
            item.partner
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(dataRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Dữ liệu');

    // Generate buffer and convert to base64 for client transfer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    const base64 = Buffer.from(excelBuffer).toString('base64');

    return {
        success: true,
        fileName,
        base64 // Return base64 instead of buffer
    };
}
