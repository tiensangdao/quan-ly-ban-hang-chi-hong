'use server'
import { google } from 'googleapis';

export const appendToSheet = async (values: any[], sheetName: string = 'Tổng hợp') => {
  try {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const base64Key = process.env.GOOGLE_PRIVATE_KEY_BASE64; // Ưu tiên dùng key base64
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!clientEmail) throw new Error('Thiếu GOOGLE_SERVICE_ACCOUNT_EMAIL');

    let privateKey = '';

    // CÁCH 1: GIẢI MÃ BASE64 (Ưu tiên số 1 - An toàn tuyệt đối)
    if (base64Key) {
      try {
        const decoded = atob(base64Key); // Giải mã base64
        privateKey = decoded;
        console.log('✅ Sử dụng khóa Base64 thành công');
      } catch (e) {
        console.error('❌ Lỗi giải mã Base64:', e);
      }
    }

    // CÁCH 2: FALLBACK VỀ CÁCH CŨ (Nếu không có base64)
    if (!privateKey && rawPrivateKey) {
      privateKey = rawPrivateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '');
      console.log('⚠️ Đang dùng khóa dạng Raw Text (dễ lỗi)');
    }

    if (!privateKey) throw new Error('Không tìm thấy Private Key hợp lệ (Base64 hoặc Raw)');

    // Xử lý nốt nếu key sau khi decode vẫn còn dạng \n text (trường hợp hiếm)
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const range = `'${sheetName}'!A:K`; // Dynamic sheet name, columns A-K (11 columns) 
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Lỗi Google Sheets:', error.message);
    return { success: false, error: error.message };
  }
};