'use server'
import { google } from 'googleapis';

export const appendToSheet = async (values: any[]) => {
  try {
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!rawPrivateKey) {
      throw new Error('Chưa cài đặt biến môi trường GOOGLE_PRIVATE_KEY');
    }

    // XỬ LÝ KHÓA: Cách an toàn nhất cho Vercel
    // Nếu key chứa ký tự \n (dạng text), replace nó bằng ký tự xuống dòng thật
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Tên Sheet phải khớp CHÍNH XÁC với tên tab dưới đáy Google Sheet của bạn
    // Mặc định là 'Sheet1' nếu bạn chưa đổi tên
    // Bạn đang dùng 'Nhập hàng', hãy chắc chắn tab đó tên là 'Nhập hàng'
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
    return { success: false, error: error.message };
  }
};