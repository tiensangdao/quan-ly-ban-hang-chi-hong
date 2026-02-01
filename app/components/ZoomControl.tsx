'use client';

import { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function ZoomControl() {
    const [zoom, setZoom] = useState(80); // Default 80%
    const [isOpen, setIsOpen] = useState(false);

    // Load saved zoom level on mount, or apply default 80%
    useEffect(() => {
        const savedZoom = localStorage.getItem('app-zoom-level');
        if (savedZoom) {
            const zoomValue = parseInt(savedZoom);
            setZoom(zoomValue);
            applyZoom(zoomValue);
        } else {
            // Apply default 80% on first visit
            applyZoom(80);
            localStorage.setItem('app-zoom-level', '80');
        }
    }, []);

    const applyZoom = (zoomLevel: number) => {
        const main = document.querySelector('main');
        if (main) {
            (main as HTMLElement).style.transform = `scale(${zoomLevel / 100})`;
            (main as HTMLElement).style.transformOrigin = 'top center';
            // Adjust height to prevent clipping
            if (zoomLevel !== 100) {
                (main as HTMLElement).style.minHeight = `${100 / (zoomLevel / 100)}vh`;
            } else {
                (main as HTMLElement).style.minHeight = '';
            }
        }
    };

    const handleZoom = (direction: 'in' | 'out' | 'reset') => {
        let newZoom = zoom;

        if (direction === 'in') {
            newZoom = Math.min(zoom + 10, 150); // Max 150%
        } else if (direction === 'out') {
            newZoom = Math.max(zoom - 10, 70); // Min 70%
        } else {
            newZoom = 100; // Reset
        }

        setZoom(newZoom);
        applyZoom(newZoom);
        localStorage.setItem('app-zoom-level', newZoom.toString());
    };

    return (
        <div className="fixed top-4 right-4 z-[100]" suppressHydrationWarning>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 bg-white/90 backdrop-blur-lg border-2 border-orange-200 rounded-full shadow-lg flex items-center justify-center text-primary hover:bg-orange-50 transition-all"
                title="Điều chỉnh zoom"
            >
                <ZoomIn className="w-5 h-5" />
            </button>

            {/* Zoom Controls Panel */}
            {isOpen && (
                <div className="absolute top-12 right-0 bg-white/95 backdrop-blur-lg border-2 border-orange-200 rounded-xl shadow-xl p-3 min-w-[140px]" suppressHydrationWarning>
                    <div className="text-center text-xs font-bold text-gray-600 mb-2">
                        Zoom: {zoom}%
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => handleZoom('out')}
                            disabled={zoom <= 70}
                            className="w-9 h-9 bg-orange-100 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center text-primary transition-all"
                            title="Thu nhỏ"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleZoom('reset')}
                            className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-all"
                            title="Về mặc định"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleZoom('in')}
                            disabled={zoom >= 150}
                            className="w-9 h-9 bg-orange-100 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center text-primary transition-all"
                            title="Phóng to"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="text-center text-[10px] text-gray-500 mt-2">
                        Nhấn ra ngoài để đóng
                    </div>
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
