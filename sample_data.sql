-- Sample Data for Testing Charts
-- Run this in Supabase SQL Editor to populate sample data

-- 1. Insert sample products (if not exists)
INSERT INTO products (ten_hang, don_vi, gia_nhap_gan_nhat, active) VALUES
('Cốc 140ml', 'cái', 400, true),
('Túi nilon', 'kg', 35000, true),
('Ly nhựa 500ml', 'cái', 500, true),
('Cốc 2 lớp', 'cái', 800, true),
('Đũa nhựa', 'đôi', 100, true),
('Thìa súp', 'cái', 150, true),
('Nĩa nhựa', 'cái', 120, true),
('Bát nhựa', 'cái', 600, true)
ON CONFLICT (ten_hang) DO NOTHING;

-- Get product IDs for reference
DO $$
DECLARE
    product_coc_140 UUID;
    product_tui_nilon UUID;
    product_ly_500 UUID;
    product_coc_2_lo UUID;
    product_dua UUID;
    product_thia UUID;
    product_nia UUID;
    product_bat UUID;
BEGIN
    -- Get product IDs
    SELECT id INTO product_coc_140 FROM products WHERE ten_hang = 'Cốc 140ml' LIMIT 1;
    SELECT id INTO product_tui_nilon FROM products WHERE ten_hang = 'Túi nilon' LIMIT 1;
    SELECT id INTO product_ly_500 FROM products WHERE ten_hang = 'Ly nhựa 500ml' LIMIT 1;
    SELECT id INTO product_coc_2_lo FROM products WHERE ten_hang = 'Cốc 2 lớp' LIMIT 1;
    SELECT id INTO product_dua FROM products WHERE ten_hang = 'Đũa nhựa' LIMIT 1;
    SELECT id INTO product_thia FROM products WHERE ten_hang = 'Thìa súp' LIMIT 1;
    SELECT id INTO product_nia FROM products WHERE ten_hang = 'Nĩa nhựa' LIMIT 1;
    SELECT id INTO product_bat FROM products WHERE ten_hang = 'Bát nhựa' LIMIT 1;

    -- 2. Insert IMPORT data for multiple months (Sept 2025 - Jan 2026)
    
    -- September 2025
    INSERT INTO nhap_hang (product_id, ngay_thang, so_luong, don_gia, nha_cung_cap, gia_ban_goi_y) VALUES
    (product_coc_140, '2025-09-05', 200, 400, 'Công ty A', 600),
    (product_tui_nilon, '2025-09-05', 10, 35000, 'Công ty A', 50000),
    (product_ly_500, '2025-09-10', 150, 500, 'Công ty B', 750),
    (product_coc_2_lo, '2025-09-15', 100, 800, 'Công ty C', 1200);

    -- October 2025
    INSERT INTO nhap_hang (product_id, ngay_thang, so_luong, don_gia, nha_cung_cap, gia_ban_goi_y) VALUES
    (product_coc_140, '2025-10-08', 250, 400, 'Công ty A', 600),
    (product_tui_nilon, '2025-10-08', 15, 35000, 'Công ty A', 50000),
    (product_dua, '2025-10-12', 300, 100, 'Công ty D', 150),
    (product_thia, '2025-10-12', 200, 150, 'Công ty D', 225),
    (product_bat, '2025-10-20', 80, 600, 'Công ty C', 900);

    -- November 2025
    INSERT INTO nhap_hang (product_id, ngay_thang, so_luong, don_gia, nha_cung_cap, gia_ban_goi_y) VALUES
    (product_coc_140, '2025-11-05', 300, 400, 'Công ty A', 600),
    (product_ly_500, '2025-11-05', 200, 500, 'Công ty B', 750),
    (product_tui_nilon, '2025-11-10', 20, 35000, 'Công ty A', 50000),
    (product_nia, '2025-11-15', 250, 120, 'Công ty D', 180),
    (product_coc_2_lo, '2025-11-20', 120, 800, 'Công ty C', 1200);

    -- December 2025
    INSERT INTO nhap_hang (product_id, ngay_thang, so_luong, don_gia, nha_cung_cap, gia_ban_goi_y) VALUES
    (product_coc_140, '2025-12-03', 400, 400, 'Công ty A', 600),
    (product_tui_nilon, '2025-12-03', 25, 35000, 'Công ty A', 50000),
    (product_ly_500, '2025-12-08', 250, 500, 'Công ty B', 750),
    (product_bat, '2025-12-15', 100, 600, 'Công ty C', 900),
    (product_dua, '2025-12-20', 400, 100, 'Công ty D', 150);

    -- January 2026
    INSERT INTO nhap_hang (product_id, ngay_thang, so_luong, don_gia, nha_cung_cap, gia_ban_goi_y) VALUES
    (product_coc_140, '2026-01-10', 350, 400, 'Công ty A', 600),
    (product_tui_nilon, '2026-01-10', 30, 35000, 'Công ty A', 50000),
    (product_ly_500, '2026-01-15', 300, 500, 'Công ty B', 750),
    (product_coc_2_lo, '2026-01-20', 150, 800, 'Công ty C', 1200),
    (product_thia, '2026-01-25', 250, 150, 'Công ty D', 225);

    -- 3. Insert SALES data for multiple months
    
    -- September 2025
    INSERT INTO ban_hang (product_id, ngay_ban, so_luong, gia_nhap, gia_ban, khach_hang) VALUES
    (product_coc_140, '2025-09-12', 80, 400, 600, 'Khách lẻ'),
    (product_coc_140, '2025-09-18', 50, 400, 600, 'Shop A'),
    (product_tui_nilon, '2025-09-20', 5, 35000, 50000, 'Khách lẻ'),
    (product_ly_500, '2025-09-25', 60, 500, 750, 'Shop B');

    -- October 2025
    INSERT INTO ban_hang (product_id, ngay_ban, so_luong, gia_nhap, gia_ban, khach_hang) VALUES
    (product_coc_140, '2025-10-15', 100, 400, 600, 'Khách lẻ'),
    (product_coc_140, '2025-10-20', 70, 400, 600, 'Shop A'),
    (product_tui_nilon, '2025-10-18', 8, 35000, 50000, 'Shop B'),
    (product_dua, '2025-10-22', 150, 100, 150, 'Khách lẻ'),
    (product_thia, '2025-10-25', 80, 150, 225, 'Shop C'),
    (product_bat, '2025-10-28', 40, 600, 900, 'Khách lẻ');

    -- November 2025
    INSERT INTO ban_hang (product_id, ngay_ban, so_luong, gia_nhap, gia_ban, khach_hang) VALUES
    (product_coc_140, '2025-11-08', 120, 400, 600, 'Shop A'),
    (product_coc_140, '2025-11-15', 90, 400, 600, 'Khách lẻ'),
    (product_ly_500, '2025-11-12', 80, 500, 750, 'Shop B'),
    (product_tui_nilon, '2025-11-18', 10, 35000, 50000, 'Shop C'),
    (product_nia, '2025-11-22', 120, 120, 180, 'Khách lẻ'),
    (product_coc_2_lo, '2025-11-25', 60, 800, 1200, 'Shop A');

    -- December 2025
    INSERT INTO ban_hang (product_id, ngay_ban, so_luong, gia_nhap, gia_ban, khach_hang) VALUES
    (product_coc_140, '2025-12-05', 150, 400, 600, 'Shop A'),
    (product_coc_140, '2025-12-12', 100, 400, 600, 'Khách lẻ'),
    (product_tui_nilon, '2025-12-08', 12, 35000, 50000, 'Shop B'),
    (product_ly_500, '2025-12-15', 100, 500, 750, 'Shop C'),
    (product_bat, '2025-12-20', 50, 600, 900, 'Khách lẻ'),
    (product_dua, '2025-12-25', 200, 100, 150, 'Shop A');

    -- January 2026
    INSERT INTO ban_hang (product_id, ngay_ban, so_luong, gia_nhap, gia_ban, khach_hang) VALUES
    (product_coc_140, '2026-01-12', 130, 400, 600, 'Shop A'),
    (product_coc_140, '2026-01-18', 80, 400, 600, 'Khách lẻ'),
    (product_tui_nilon, '2026-01-15', 15, 35000, 50000, 'Shop C'),
    (product_ly_500, '2026-01-20', 120, 500, 750, 'Shop B'),
    (product_coc_2_lo, '2026-01-25', 70, 800, 1200, 'Khách lẻ'),
    (product_thia, '2026-01-28', 100, 150, 225, 'Shop A');

    -- Add more data for 2024 for year-over-year comparison (FULL YEAR)
    INSERT INTO nhap_hang (product_id, ngay_thang, so_luong, don_gia, nha_cung_cap, gia_ban_goi_y) VALUES
    (product_coc_140, '2024-01-15', 300, 380, 'Công ty A', 570),
    (product_tui_nilon, '2024-01-15', 20, 33000, 'Công ty A', 47000),
    (product_ly_500, '2024-03-10', 200, 480, 'Công ty B', 720),
    (product_coc_2_lo, '2024-06-20', 150, 750, 'Công ty C', 1125),
    (product_bat, '2024-08-10', 100, 580, 'Công ty C', 870),
    (product_dua, '2024-09-15', 400, 95, 'Công ty D', 143);

    INSERT INTO ban_hang (product_id, ngay_ban, so_luong, gia_nhap, gia_ban, khach_hang) VALUES
    (product_coc_140, '2024-02-20', 200, 380, 570, 'Shop A'),
    (product_coc_140, '2024-04-15', 150, 380, 570, 'Shop B'),
    (product_tui_nilon, '2024-03-15', 18, 33000, 47000, 'Khách lẻ'),
    (product_ly_500, '2024-05-10', 150, 480, 720, 'Shop B'),
    (product_ly_500, '2024-07-20', 100, 480, 720, 'Shop A'),
    (product_coc_2_lo, '2024-08-15', 120, 750, 1125, 'Shop C'),
    (product_bat, '2024-09-20', 80, 580, 870, 'Khách lẻ'),
    (product_dua, '2024-10-25', 350, 95, 143, 'Shop A');

    -- Add more data for 2025 (FULL YEAR with profit)
    INSERT INTO nhap_hang (product_id, ngay_thang, so_luong, don_gia, nha_cung_cap, gia_ban_goi_y) VALUES
    (product_coc_140, '2025-02-10', 250, 400, 'Công ty A', 600),
    (product_ly_500, '2025-04-15', 200, 500, 'Công ty B', 750),
    (product_tui_nilon, '2025-06-20', 18, 35000, 'Công ty A', 50000),
    (product_bat, '2025-08-10', 90, 600, 'Công ty C', 900);

    INSERT INTO ban_hang (product_id, ngay_ban, so_luong, gia_nhap, gia_ban, khach_hang) VALUES
    (product_coc_140, '2025-02-25', 200, 400, 600, 'Shop A'),
    (product_coc_140, '2025-04-18', 180, 400, 600, 'Shop B'),
    (product_ly_500, '2025-05-22', 160, 500, 750, 'Shop C'),
    (product_ly_500, '2025-07-15', 140, 500, 750, 'Shop A'),
    (product_tui_nilon, '2025-08-20', 16, 35000, 50000, 'Khách lẻ'),
    (product_bat, '2025-09-25', 75, 600, 900, 'Shop B');

    -- Add more 2023 data for better year comparison
    INSERT INTO nhap_hang (product_id, ngay_thang, so_luong, don_gia, nha_cung_cap, gia_ban_goi_y) VALUES
    (product_coc_140, '2023-03-15', 200, 360, 'Công ty A', 540),
    (product_tui_nilon, '2023-05-20', 15, 31000, 'Công ty A', 44000),
    (product_ly_500, '2023-08-10', 150, 460, 'Công ty B', 690);

    INSERT INTO ban_hang (product_id, ngay_ban, so_luong, gia_nhap, gia_ban, khach_hang) VALUES
    (product_coc_140, '2023-04-20', 150, 360, 540, 'Shop A'),
    (product_coc_140, '2023-06-15', 100, 360, 540, 'Shop B'),
    (product_tui_nilon, '2023-07-10', 12, 31000, 44000, 'Khách lẻ'),
    (product_ly_500, '2023-09-20', 120, 460, 690, 'Shop C');

    RAISE NOTICE 'Sample data inserted successfully!';
END $$;
