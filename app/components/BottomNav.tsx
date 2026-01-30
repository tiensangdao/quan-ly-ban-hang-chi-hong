'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PackagePlus, ShoppingCart, Package, BarChart3, Settings } from 'lucide-react';

type NavItemType = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    highlight?: boolean;
    color?: 'blue' | 'green';
};

const navItems: NavItemType[] = [
    { name: 'Tổng quan', href: '/', icon: Home },
    { name: 'Nhập hàng', href: '/nhap-hang', icon: PackagePlus, highlight: true, color: 'blue' },
    { name: 'Bán hàng', href: '/ban-hang', icon: ShoppingCart, highlight: true, color: 'green' },
    { name: 'Tồn kho', href: '/ton-kho', icon: Package },
    { name: 'Báo cáo', href: '/bao-cao', icon: BarChart3 },
    { name: 'Cài đặt', href: '/cai-dat', icon: Settings },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-blue-100 shadow-lg z-50 pb-safe">
            <div className="flex justify-around items-center max-w-2xl mx-auto h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    const colorClass = item.color === 'green' ? 'green' : 'blue';
                    const activeColor = colorClass === 'green' ? 'text-green-600' : 'text-blue-600';
                    const bgColor = colorClass === 'green' ? 'bg-green-100' : 'bg-blue-100';
                    const hoverBg = colorClass === 'green' ? 'hover:bg-green-50' : 'hover:bg-blue-50';

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 ${
                                isActive ? activeColor + ' font-semibold scale-105' : 'text-gray-500 hover:text-gray-700'
                            } ${item.highlight && !isActive ? hoverBg : 'hover:bg-gray-50'}`}
                        >
                            <div className={`${item.highlight ? `${bgColor} rounded-full p-2 transition-all duration-200` : ''} ${isActive && item.highlight ? 'shadow-md' : ''}`}>
                                <Icon className={`${item.highlight ? 'w-5 h-5' : 'w-6 h-6'} ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                            </div>
                            <span className="text-[10px] leading-tight">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
