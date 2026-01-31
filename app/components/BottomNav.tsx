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
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-orange-200 shadow-lg z-50 pb-safe" suppressHydrationWarning>
            <div className="flex justify-around items-center max-w-2xl mx-auto h-16 px-2" suppressHydrationWarning>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    // Use primary orange for active, gray for inactive
                    const activeColor = 'text-primary';
                    const inactiveColor = 'text-gray-400 hover:text-foreground';
                    const bgColor = 'bg-orange-100'; // soft orange background

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 ${isActive ? activeColor + ' font-bold scale-105' : inactiveColor
                                }`}
                            suppressHydrationWarning
                        >
                            <div
                                className={`${item.highlight ? `${bgColor} rounded-full p-2 clay-icon-bg transition-all duration-200` : ''} ${isActive && item.highlight ? 'shadow-sm ring-1 ring-orange-200' : ''}`}
                                suppressHydrationWarning
                            >
                                <Icon className={`${item.highlight ? 'w-5 h-5' : 'w-6 h-6'} ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                            </div>
                            <span className="text-[10px] leading-tight font-medium" suppressHydrationWarning>{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
