'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { name: 'Tổng quan', href: '/', icon: '🏠' },
    { name: 'Nhập hàng', href: '/nhap-hang', icon: '➕', highlight: true, color: 'blue' },
    { name: 'Bán hàng', href: '/ban-hang', icon: '💰', highlight: true, color: 'green' },
    { name: 'Tồn kho', href: '/ton-kho', icon: '📦' },
    { name: 'Báo cáo', href: '/bao-cao', icon: '📊' },
    { name: 'Cài đặt', href: '/cai-dat', icon: '⚙️' },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 pb-safe">
            <div className="flex justify-around items-center max-w-2xl mx-auto h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const colorClass = item.color === 'green' ? 'green' : 'blue';
                    const activeColor = colorClass === 'green' ? 'text-green-600' : 'text-blue-600';
                    const bgColor = colorClass === 'green' ? 'bg-green-100' : 'bg-blue-100';
                    const hoverColor = colorClass === 'green' ? 'hover:bg-green-50' : 'hover:bg-blue-50';

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${isActive ? activeColor + ' font-semibold' : 'text-gray-500'
                                } ${item.highlight && !isActive ? hoverColor : ''}`}
                        >
                            <span className={`text-2xl ${item.highlight ? `${bgColor} rounded-full w-10 h-10 flex items-center justify-center` : ''}`}>
                                {item.icon}
                            </span>
                            <span className="text-xs">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
