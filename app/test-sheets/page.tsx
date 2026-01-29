'use client'
import { appendToSheet } from '@/lib/googleSheets'; // Nếu lỗi đường dẫn hãy dùng '../lib/googleSheets'

export default function TestSheets() {
  const handleTest = async () => {
    const testData = [new Date().toLocaleString(), 'Sản phẩm Test', '10', '50000', 'Ghi chú test'];
    const result = await appendToSheet(testData);
    
    if (result.success) {
      alert('Ghi vào Google Sheet THÀNH CÔNG! ✅');
    } else {
      alert('Thất bại: ' + result.error);
    }
  };

  return (
    <div className="p-10">
      <button 
        onClick={handleTest}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Bấm để Test Google Sheets
      </button>
    </div>
  );
}