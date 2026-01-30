'use server'
import { google } from 'googleapis';

// Helper function to get auth
async function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const base64Key = process.env.GOOGLE_PRIVATE_KEY_BASE64;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail) throw new Error('Thiếu GOOGLE_SERVICE_ACCOUNT_EMAIL');

  let privateKey = '';

  if (base64Key) {
    try {
      privateKey = atob(base64Key);
    } catch (e) {
      console.error('❌ Lỗi giải mã Base64:', e);
    }
  }

  if (!privateKey && rawPrivateKey) {
    privateKey = rawPrivateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '');
  }

  if (!privateKey) throw new Error('Không tìm thấy Private Key hợp lệ');

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// Clear all data in a sheet (except header row 1)
export const clearSheet = async (sheetName: string) => {
  try {
    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Clear from row 2 onwards (keep header)
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${sheetName}'!A2:L1000`
    });

    console.log(`✅ Đã xóa dữ liệu cũ trong sheet "${sheetName}"`);
    return { success: true };
  } catch (error: any) {
    console.error('Lỗi xóa sheet:', error.message);
    return { success: false, error: error.message };
  }
};

export const appendToSheet = async (values: any[], sheetName: string = 'Tổng hợp') => {
  try {
    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const range = `'${sheetName}'!A:L`; // Columns A-L (12 columns including Tháng)
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