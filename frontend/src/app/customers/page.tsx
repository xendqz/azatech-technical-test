'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { formatDateIndo } from '@/lib/formatters';

interface Customer {
  id: string;
  customer_name: string;
  customer_address: string;
  gender: 'Pria' | 'Wanita';
  birth_date: string;
  phone: string | null;
  created_at: string;
}

interface CustomersResponse {
  data: Customer[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export default function CustomersPage() {
  const queryClient = useQueryClient();

  // Filter & Pagination states
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_address: '',
    gender: 'Pria' as 'Pria' | 'Wanita',
    birth_date: '1995-01-01',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  // Query customers
  const { data, isLoading, isError, error, refetch } = useQuery<CustomersResponse>({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const res = await api.get('/customers', {
        params: {
          page,
          per_page: 10,
          search: search || undefined,
        },
      });
      return res.data;
    },
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({
      customer_name: '',
      customer_address: '',
      gender: 'Pria',
      birth_date: '1995-01-01',
      phone: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      customer_name: c.customer_name,
      customer_address: c.customer_address,
      gender: c.gender,
      birth_date: c.birth_date ? c.birth_date.split('T')[0] : '1995-01-01',
      phone: c.phone || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Save Mutation (Create / Update)
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      if (editingCustomer) {
        return await api.put(`/customers/${editingCustomer.id}`, payload);
      } else {
        return await api.post('/customers', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        alert(err.response?.data?.message || 'Gagal menyimpan data pelanggan');
      }
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeletingCustomer(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Gagal menghapus pelanggan');
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    saveMutation.mutate(formData);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Manajemen Pelanggan</h1>
            <p className="text-sm text-slate-500">Kelola direktori data pelanggan terdaftar untuk transaksi penjualan.</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Pelanggan
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pelanggan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Nama Pelanggan
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Gender & Tgl Lahir
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Kontak / Telepon
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Alamat
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
                      <p className="mt-2 text-xs">Memuat direktori pelanggan...</p>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-red-500">
                      Gagal memuat data pelanggan. Cek server backend.
                    </td>
                  </tr>
                ) : data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Users className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 font-medium">Tidak ada data pelanggan</p>
                    </td>
                  </tr>
                ) : (
                  data?.data.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{c.customer_name}</p>
                        <p className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]">{c.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.gender === 'Pria' ? 'bg-sky-50 text-sky-700' : 'bg-pink-50 text-pink-700'
                          }`}>
                            {c.gender}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {formatDateIndo(c.birth_date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {c.phone ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-mono">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {c.phone}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Tidak ada</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          {c.customer_address}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            title="Edit Pelanggan"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingCustomer(c)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition-colors"
                            title="Hapus Pelanggan"
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
                Menampilkan halaman <span className="font-semibold text-slate-800">{data.meta.page}</span> dari <span className="font-semibold text-slate-800">{data.meta.total_pages || 1}</span> (Total <span className="font-semibold text-slate-800">{data.meta.total}</span> pelanggan)
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

        {/* Modal Add / Edit Customer */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-800">
                  {editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
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
                  <label className="block text-xs font-semibold text-slate-700">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                  {formErrors.customer_name && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.customer_name[0]}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Pria' | 'Wanita' })}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Pria">Pria</option>
                      <option value="Wanita">Wanita</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Tanggal Lahir</label>
                    <input
                      type="date"
                      required
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                    {formErrors.birth_date && (
                      <p className="mt-1 text-xs text-rose-600">{formErrors.birth_date[0]}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">No. Handphone (Opsional)</label>
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.phone[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Alamat Lengkap</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Contoh: Jl. Sudirman No. 45, Jakarta Selatan"
                    value={formData.customer_address}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  ></textarea>
                  {formErrors.customer_address && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.customer_address[0]}</p>
                  )}
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
                    {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-800">Hapus Pelanggan?</h3>
              <p className="mt-2 text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus pelanggan <span className="font-semibold text-slate-700">{deletingCustomer.customer_name}</span>? Data akan di-soft delete dan historis order tetap tersimpan rapi.
              </p>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingCustomer(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(deletingCustomer.id)}
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
