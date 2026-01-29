'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('products').select('*')
      if (data) setProducts(data)
    }
    fetchData()
  }, [])

  return (
    <div className="p-5 font-sans">
      <h1 className="text-2xl font-bold mb-5 text-blue-600">Quản lý bán hàng - Chị Hồng</h1>
      
      <div className="bg-green-100 p-4 rounded-lg mb-5">
        ✅ Hệ thống đã kết nối thành công với Supabase!
      </div>

      <h2 className="text-xl font-semibold mb-3">Danh sách sản phẩm mẫu:</h2>
      {products.length === 0 ? (
        <p className="text-gray-500 italic">Chưa có sản phẩm nào. Hãy thêm ở Supabase!</p>
      ) : (
        <ul className="space-y-2">
          {products.map(p => (
            <li key={p.id} className="border-b py-2 flex justify-between">
              <span>{p.ten_hang}</span>
              <span className="font-mono text-green-700">{p.gia_nhap_gan_nhat.toLocaleString()}đ</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}