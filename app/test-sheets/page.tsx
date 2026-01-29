'use server'
import { google } from 'googleapis';

export const appendToSheet = async (values: any[]) => {
  try {
    // 1. Cấu hình xác thực (Dùng Object để sửa lỗi 0-1 arguments)
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
    console.error('Google Sheets Error:', error);
    return { success: false, error: error.message };
  }
};