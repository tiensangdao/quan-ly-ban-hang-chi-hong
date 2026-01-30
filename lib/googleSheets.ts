'use server'
import { google } from 'googleapis';
import credentials from './google-key.json'; // Import trực tiếp file JSON

export const appendToSheet = async (values: any[]) => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key, // JSON tự xử lý \n chuẩn 100%
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Lưu ý: Nếu tên sheet có khoảng trắng, nên bao quanh bằng dấu nháy đơn '...'
    const range = "'Nhập hàng'!A:E"; 

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID, // Vẫn lấy ID từ env
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Lỗi Google Sheets:', error.message);
    return { success: false, error: error.message };
  }
};