'use server'
import { google } from 'googleapis';

export const appendToSheet = async (values: any[]) => {
  try {
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

    if (!rawPrivateKey || !clientEmail) {
      throw new Error('Thiếu biến môi trường: GOOGLE_PRIVATE_KEY hoặc GOOGLE_SERVICE_ACCOUNT_EMAIL');
    }

    // --- XỬ LÝ KHÓA (ROBUST MODE) ---
    // 1. Trim khoảng trắng thừa đầu đuôi
    // 2. Loại bỏ dấu ngoặc kép bao quanh (nếu có)
    // 3. Chuyển đổi \n thành xuống dòng thực
    const privateKey = rawPrivateKey
      .trim()
      .replace(/^["']|["']$/g, '') 
      .replace(/\\n/g, '\n');

    console.log('--- DEBUG GOOGLE AUTH ---');
    console.log('Client Email:', clientEmail);
    console.log('Private Key Length:', privateKey.length);
    console.log('Key Header:', privateKey.substring(0, 30));
    console.log('Key Footer:', privateKey.substring(privateKey.length - 30));
    // Kiểm tra xem key có hợp lệ không
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
      console.error('ERROR: Key không đúng định dạng PEM!');
    }
    console.log('-------------------------');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const range = 'Nhập hàng!A:E'; 

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Lỗi Google Sheets:', error.message);
    // Trả về lỗi chi tiết để hiển thị lên UI cho dễ debug
    return { success: false, error: `Lỗi: ${error.message}` };
  }
};