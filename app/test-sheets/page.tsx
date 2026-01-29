'use client'
import { appendToSheet } from '@/lib/googleSheets';

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
    <div className="p-10 font-sans">
      <h1 className="text-2xl font-bold mb-5">Kiểm tra kết nối Google Sheets</h1>
      <button 
        onClick={handleTest}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow"
      >
        Bấm để Test Ghi Dữ Liệu
      </button>
      <p className="mt-4 text-sm text-gray-600">
        Lưu ý: Dữ liệu sẽ được ghi vào sheet "Nhập hàng".
      </p>
    </div>
  );
}