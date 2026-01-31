-- Migration: Add price calculation mode setting
-- Run this in Supabase SQL Editor

-- Add new column to app_settings table
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS gia_ban_tinh_theo TEXT DEFAULT 'gia_trung_binh';

-- Add constraint to only allow valid values
ALTER TABLE app_settings 
ADD CONSTRAINT gia_ban_tinh_theo_check 
CHECK (gia_ban_tinh_theo IN ('gia_gan_nhat', 'gia_trung_binh'));

-- Set default value for existing row (ID = 1)
UPDATE app_settings
SET gia_ban_tinh_theo = 'gia_trung_binh'
WHERE id = 1 AND gia_ban_tinh_theo IS NULL;

-- Verify
SELECT 
    ty_le_lai_mac_dinh as "Tỷ lệ lãi mặc định (%)",
    nguong_canh_bao_mac_dinh as "Ngưỡng cảnh báo",
    gia_ban_tinh_theo as "Tính giá bán theo"
FROM app_settings
WHERE id = 1;
