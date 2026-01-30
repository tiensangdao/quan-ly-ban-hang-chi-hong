'use client';

export default function CaiDatPage() {
    return (
        <div className="p-5 pb-24 bg-gray-50 min-h-screen flex items-center justify-center">
            <div className="text-center max-w-md">
                <div className="text-6xl mb-4">⚙️</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">Cài đặt</h1>
                <p className="text-gray-600 mb-6">
                    Trang cài đặt đang được phát triển.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
                    <p className="font-semibold text-blue-900 mb-2">Sắp ra mắt:</p>
                    <ul className="space-y-1 text-blue-700">
                        <li>• 💾 Sao lưu dữ liệu</li>
                        <li>• 📤 Xuất báo cáo Excel</li>
                        <li>• 👤 Quản lý tài khoản</li>
                        <li>• 🔧 Cấu hình hệ thống</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
