-- Migration: Add Weighted Average Cost (WAC) columns to products table
-- Run this in Supabase SQL Editor

-- Add new columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS gia_nhap_trung_binh REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tong_so_luong_nhap INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tong_gia_tri_nhap REAL DEFAULT 0;

-- Initialize values for existing products based on historical data
UPDATE products p
SET 
    tong_so_luong_nhap = COALESCE((
        SELECT SUM(so_luong) 
        FROM nhap_hang 
        WHERE product_id = p.id
    ), 0),
    tong_gia_tri_nhap = COALESCE((
        SELECT SUM(so_luong * don_gia) 
        FROM nhap_hang 
        WHERE product_id = p.id
    ), 0);

-- Calculate average price (cast to NUMERIC for ROUND function)
UPDATE products
SET gia_nhap_trung_binh = CASE 
    WHEN tong_so_luong_nhap > 0 
    THEN ROUND((tong_gia_tri_nhap / tong_so_luong_nhap)::NUMERIC, 2)
    ELSE 0
END;

-- Verify results
SELECT 
    ten_hang,
    gia_nhap_gan_nhat as "Giá nhập gần nhất",
    gia_nhap_trung_binh as "Giá TB (WAC)",
    tong_so_luong_nhap as "Tổng số lượng nhập",
    tong_gia_tri_nhap as "Tổng giá trị nhập"
FROM products
WHERE active = true
ORDER BY ten_hang;
