'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Plus, 
  Search, 
  ArrowUpDown, 
  Edit3, 
  Trash2, 
  X, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { formatRupiah } from '@/lib/formatters';

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  stock: number;
  price: number;
  created_at: string;
}

interface ProductsResponse {
  data: Product[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export default function ProductsPage() {
  const queryClient = useQueryClient();

  // Filter & Pagination states
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('product_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    product_code: '',
    product_name: '',
    stock: 0,
    price: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  // Query products
  const { data, isLoading, isError, error, refetch } = useQuery<ProductsResponse>({
    queryKey: ['products', page, search, sortBy, sortOrder],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: {
          page,
          per_page: 10,
          search: search || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      });
      return res.data;
    },
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({ product_code: '', product_name: '', stock: 0, price: 0 });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      product_code: p.product_code,
      product_name: p.product_name,
      stock: p.stock,
      price: Number(p.price),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Submit Add / Edit Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      if (editingProduct) {
        return await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        return await api.post('/products', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        alert(err.response?.data?.message || 'Gagal menyimpan produk');
      }
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setDeletingProduct(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Gagal menghapus produk');
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    saveMutation.mutate(formData);
  };

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Manajemen Produk</h1>
            <p className="text-sm text-slate-500">Kelola katalog produk, stok ketersediaan, dan harga satuan.</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Produk
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode atau nama produk..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Urutkan:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setSortBy(by);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="product_name-asc">Nama Produk (A-Z)</option>
              <option value="product_name-desc">Nama Produk (Z-A)</option>
              <option value="price-asc">Harga Termurah</option>
              <option value="price-desc">Harga Tertinggi</option>
              <option value="stock-asc">Stok Tersedikit</option>
              <option value="stock-desc">Stok Terbanyak</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Kode Produk
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3.5 cursor-pointer hover:text-blue-600 select-none"
                    onClick={() => toggleSort('product_name')}
                  >
                    <div className="flex items-center gap-1.5">
                      Nama Produk
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3.5 cursor-pointer hover:text-blue-600 select-none"
                    onClick={() => toggleSort('price')}
                  >
                    <div className="flex items-center gap-1.5">
                      Harga Satuan
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3.5 cursor-pointer hover:text-blue-600 select-none"
                    onClick={() => toggleSort('stock')}
                  >
                    <div className="flex items-center gap-1.5">
                      Stok
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                      <p className="mt-2 text-xs">Memuat katalog produk...</p>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-red-500">
                      Gagal memuat data produk. Cek koneksi Anda.
                    </td>
                  </tr>
                ) : data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Package className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 font-medium">Tidak ada produk ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  data?.data.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        {product.product_code}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {product.product_name}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {formatRupiah(product.price)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          product.stock < 5 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {product.stock} unit
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            title="Edit Produk"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
                Menampilkan halaman <span className="font-semibold text-slate-800">{data.meta.page}</span> dari <span className="font-semibold text-slate-800">{data.meta.total_pages || 1}</span> (Total <span className="font-semibold text-slate-800">{data.meta.total}</span> produk)
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

        {/* Modal Add / Edit Product */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-800">
                  {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Kode Produk</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: P0025"
                    value={formData.product_code}
                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                  {formErrors.product_code && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.product_code[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Nama Produk</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hydrococo 150ml"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                  {formErrors.product_name && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.product_name[0]}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Harga Satuan (Rp)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="12000"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                    {formErrors.price && (
                      <p className="mt-1 text-xs text-rose-600">{formErrors.price[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Stok Awal</label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="10"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                    {formErrors.stock && (
                      <p className="mt-1 text-xs text-rose-600">{formErrors.stock[0]}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Produk'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-800">Hapus Produk?</h3>
              <p className="mt-2 text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus produk <span className="font-semibold text-slate-700">{deletingProduct.product_name}</span>? Produk akan di-soft delete dan tetap tampil di riwayat transaksi sebelumnya.
              </p>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingProduct(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(deletingProduct.id)}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
