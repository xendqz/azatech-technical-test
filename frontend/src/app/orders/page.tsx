'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  History, 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  User,
  ShoppingBag,
  Receipt
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { formatRupiah, formatDateIndo } from '@/lib/formatters';

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: {
    id: number;
    product_code: string;
    product_name: string;
  };
}

interface Order {
  id: number;
  order_number: string;
  customer_id: string;
  order_date: string;
  total_amount: number;
  customer?: {
    id: string;
    customer_name: string;
    phone: string | null;
    customer_address: string;
  };
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  items: OrderItem[];
}

interface OrdersResponse {
  data: Order[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

interface Customer {
  id: string;
  customer_name: string;
}

export default function OrdersPage() {
  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [customerId, setCustomerId] = useState('');

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch customers for filter dropdown
  const { data: customersData } = useQuery<{ data: Customer[] }>({
    queryKey: ['filterCustomers'],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { per_page: 100 } });
      return res.data;
    },
  });

  // Query orders
  const { data, isLoading, isError, refetch } = useQuery<OrdersResponse>({
    queryKey: ['orders', page, search, from, to, customerId],
    queryFn: async () => {
      const res = await api.get('/orders', {
        params: {
          page,
          per_page: 10,
          search: search || undefined,
          from: from || undefined,
          to: to || undefined,
          customer_id: customerId || undefined,
        },
      });
      return res.data;
    },
  });

  const handleResetFilter = () => {
    setSearch('');
    setFrom('');
    setTo('');
    setCustomerId('');
    setPage(1);
  };

  // Bonus feature: Export CSV
  const handleExportCSV = () => {
    if (!data?.data || data.data.length === 0) {
      alert('Tidak ada data order untuk diexport.');
      return;
    }

    const headers = ['No. Order', 'Customer', 'Tanggal', 'Total (Rp)', 'Dibuat Oleh'];
    const rows = data.data.map((o) => [
      `"${o.order_number}"`,
      `"${o.customer?.customer_name || '-'}"`,
      `"${formatDateIndo(o.order_date, true)}"`,
      o.total_amount,
      `"${o.creator?.name || 'Admin'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `riwayat_order_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Riwayat Penjualan & Order</h1>
            <p className="text-sm text-slate-500">
              Daftar seluruh transaksi order yang telah diproses dalam sistem online shop.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Export CSV
            </button>
            <Link
              href="/orders/create"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Buat Transaksi Baru
            </Link>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cari No. Order</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Contoh: INV-..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Filter Customer */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pelanggan</label>
              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Semua Pelanggan</option>
                {customersData?.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dari Tanggal */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Sampai Tanggal */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilter}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    No. Order
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Pelanggan
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Tanggal Transaksi
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Total Belanja
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Kasir / Admin
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                      <p className="mt-2 text-xs">Memuat riwayat transaksi...</p>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-red-500">
                      Gagal memuat riwayat order. Cek server backend.
                    </td>
                  </tr>
                ) : data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <History className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 font-medium">Belum ada transaksi ditemukan dengan filter ini</p>
                    </td>
                  </tr>
                ) : (
                  data?.data.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-700">
                        {order.order_number}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{order.customer?.customer_name || '-'}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">{order.customer?.customer_address || '-'}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDateIndo(order.order_date, true)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                        {formatRupiah(order.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" />
                          {order.creator?.name || 'Admin'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" /> Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {data && data.meta && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 px-6 py-4 text-xs text-slate-500 bg-white">
              <div>
                Menampilkan halaman <span className="font-semibold text-slate-800">{data.meta.page}</span> dari <span className="font-semibold text-slate-800">{data.meta.total_pages || 1}</span> (Total <span className="font-semibold text-slate-800">{data.meta.total}</span> order)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={data.meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
                </button>
                <button
                  disabled={data.meta.page >= data.meta.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Selanjutnya <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Detail Order: {selectedOrder.order_number}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Waktu transaksi: {formatDateIndo(selectedOrder.order_date, true)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Customer and Order metadata */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 uppercase">Informasi Pelanggan</span>
                  <p className="font-bold text-slate-800 text-sm mt-1">{selectedOrder.customer?.customer_name || '-'}</p>
                  <p className="text-slate-600 mt-0.5">{selectedOrder.customer?.customer_address || '-'}</p>
                  <p className="text-slate-500 mt-0.5">Telp: {selectedOrder.customer?.phone || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase">Informasi Transaksi</span>
                  <p className="text-slate-600 mt-1">Dibuat oleh: <span className="font-semibold text-slate-800">{selectedOrder.creator?.name || 'Admin'}</span></p>
                  <p className="text-slate-600 mt-0.5">Status: <span className="font-semibold text-emerald-600">Selesai (Lunas)</span></p>
                  <p className="text-slate-600 mt-0.5">Total Item: <span className="font-semibold text-slate-800">{selectedOrder.items?.length || 0} macam produk</span></p>
                </div>
              </div>

              {/* Item details table */}
              <div className="mt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Daftar Item Pembelian
                </h4>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                      <tr>
                        <th className="px-4 py-2.5">Produk</th>
                        <th className="px-4 py-2.5 text-center">Jumlah</th>
                        <th className="px-4 py-2.5 text-right">Harga Satuan (Snapshot)</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">
                              {item.product?.product_name || `Produk ID #${item.product_id}`}
                            </p>
                            <p className="font-mono text-[10px] text-slate-400">
                              {item.product?.product_code || '-'}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-700">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 font-mono">
                            {formatRupiah(item.unit_price)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                            {formatRupiah(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-slate-200 bg-slate-50/80">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-700">
                          Total Pembayaran:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-extrabold text-blue-700 font-mono">
                          {formatRupiah(selectedOrder.total_amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
