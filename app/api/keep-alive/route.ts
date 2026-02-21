import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simple keep-alive endpoint to prevent Supabase free tier from pausing
// Call this endpoint every 5-6 days via an external cron service (e.g. cron-job.org)
export async function GET() {
    try {
        // Lightweight query - just count products
        const { count, error } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        if (error) {
            return NextResponse.json({
                status: 'error',
                message: error.message,
                time: new Date().toISOString()
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'ok',
            message: 'Database is alive!',
            products: count,
            time: new Date().toISOString()
        });

    } catch (err) {
        return NextResponse.json({
            status: 'error',
            message: String(err),
            time: new Date().toISOString()
        }, { status: 500 });
    }
}
