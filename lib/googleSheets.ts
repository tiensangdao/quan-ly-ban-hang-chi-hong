import { google } from 'googleapis';

export const appendToSheet = async (values: any[]) => {
  try {
    // 1. Cấu hình xác thực
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      // Xử lý lỗi định dạng xuống dòng của Private Key trên Vercel
      process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    const range = 'Nhập hàng!A:E'; // Đặt tên Sheet của bạn là "Nhập hàng" 

    // 2. Thực hiện ghi dữ liệu
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
    console.error('Lỗi Google Sheets:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};