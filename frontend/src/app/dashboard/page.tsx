'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  TrendingUp, 
  Receipt, 
  AlertTriangle, 
  Package, 
  ArrowRight, 
  ShoppingCart,
  PlusCircle,
  Clock
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { formatRupiah } from '@/lib/formatters';

interface DashboardSummary {
  total_transactions: number;
  total_sales: number;
  top_products: Array<{
    product_id: number;
    product_code: string;
    product_name: string;
    total_sold: number;
  }>;
  low_stock_products: Array<{
    id: number;
    product_code: string;
    product_name: string;
    stock: number;
    price: number;
  }>;
}

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery<DashboardSummary>({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res.data.data;
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ringkasan Penjualan</h1>
            <p className="mt-1 text-sm text-blue-100">
              Pantau performa penjualan, ketersediaan stok, dan transaksi harian toko online.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/orders/create"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-xs hover:bg-blue-50 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              Buat Transaksi
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-800/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Kelola Produk
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-white p-6 shadow-xs border border-slate-200/80"></div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            <p className="font-semibold">Gagal memuat ringkasan data dashboard</p>
            <p className="text-sm mt-1 text-red-600">{(error as any)?.message || 'Terjadi kesalahan pada server'}</p>
            <button
              onClick={() => refetch()}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Summary Metric Cards */}
        {data && (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Transaksi */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-hover hover:border-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Transaksi</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Receipt className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-bold tracking-tight text-slate-900">{data.total_transactions}</h3>
                  <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Semua transaksi tercatat
                  </p>
                </div>
              </div>

              {/* Total Penjualan */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-hover hover:border-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Omset</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900">{formatRupiah(data.total_sales)}</h3>
                  <p className="mt-1 text-xs text-emerald-600 font-medium">Akumulasi pendapatan order</p>
                </div>
              </div>

              {/* Total Produk Terlaris Top */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-hover hover:border-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Top Produk Terlaris</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Package className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 truncate">
                    {data.top_products[0]?.product_name || '-'}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {data.top_products[0] ? `Terjual ${data.top_products[0].total_sold} unit` : 'Belum ada data'}
                  </p>
                </div>
              </div>

              {/* Peringatan Stok Menipis */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-hover hover:border-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stok Kritis (&lt; 5)</span>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    data.low_stock_products.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className={`text-3xl font-bold tracking-tight ${data.low_stock_products.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {data.low_stock_products.length}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">Produk perlu restock segera</p>
                </div>
              </div>
            </div>

            {/* Bento Grid: 5 Top Products & Low Stock Alert */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 5 Produk Terlaris */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">5 Produk Terlaris</h3>
                    <p className="text-xs text-slate-500">Berdasarkan total volume penjualan</p>
                  </div>
                  <Link href="/products" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100">
                  {data.top_products.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400">Belum ada riwayat produk terjual</p>
                  ) : (
                    data.top_products.map((item, index) => (
                      <div key={item.product_id} className="flex items-center justify-between py-3.5">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            index === 0 ? 'bg-amber-100 text-amber-800' :
                            index === 1 ? 'bg-slate-200 text-slate-700' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{item.product_name}</p>
                            <p className="text-xs text-slate-400 font-mono">{item.product_code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {item.total_sold} terjual
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Peringatan Stok Menipis */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Peringatan Stok Rendah</h3>
                      <p className="text-xs text-slate-500">Stok tersisa kurang dari 5 unit</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                    {data.low_stock_products.length} Item
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {data.low_stock_products.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm font-medium text-emerald-600">Semua stok produk dalam kondisi aman! (≥ 5)</p>
                    </div>
                  ) : (
                    data.low_stock_products.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-3.5">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{item.product_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-slate-400">{item.product_code}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{formatRupiah(item.price)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800">
                            Sisa {item.stock} unit
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
