'use server'
import { google } from 'googleapis';

export const appendToSheet = async (values: any[]) => {
  try {
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!rawPrivateKey) {
      throw new Error('Chưa cài đặt biến môi trường GOOGLE_PRIVATE_KEY');
    }

    // Xử lý Private Key mạnh mẽ hơn
    // 1. Loại bỏ dấu ngoặc kép bao quanh nếu có
    // 2. Chuyển đổi \n thành xuống dòng thực
    const privateKey = rawPrivateKey
      .replace(/^"|"$/g, '') 
      .replace(/\\n/g, '\n');

    console.log('--- Debug Google Auth ---');
    console.log('Email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('Key Length:', privateKey.length);
    console.log('Key Starts With:', privateKey.substring(0, 30));
    console.log('Key Ends With:', privateKey.substring(privateKey.length - 30));
    console.log('-------------------------');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
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
    console.error('Lỗi chi tiết:', error);
    return { success: false, error: error.message || JSON.stringify(error) };
  }
};