'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  User,
  Package,
  Receipt
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
}

interface Customer {
  id: string;
  customer_name: string;
  phone: string | null;
  customer_address: string;
}

interface OrderItemRow {
  product_id: number | '';
  quantity: number;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<OrderItemRow[]>([
    { product_id: '', quantity: 1 },
  ]);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');

  // Fetch customers (dropdown)
  const { data: customersData, isLoading: loadingCustomers } = useQuery<{ data: Customer[] }>({
    queryKey: ['allCustomers'],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { per_page: 100 } });
      return res.data;
    },
  });

  // Fetch products (dropdown)
  const { data: productsData, isLoading: loadingProducts } = useQuery<{ data: Product[] }>({
    queryKey: ['allProducts'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { per_page: 100, sort_by: 'product_name', sort_order: 'asc' } });
      return res.data;
    },
  });

  const productsList = productsData?.data || [];
  const customersList = customersData?.data || [];

  // Add Item Row
  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity: 1 }]);
  };

  // Remove Item Row
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
    // Clear errors associated with this index
    const newErrors = { ...serverErrors };
    delete newErrors[`items.${index}.quantity`];
    delete newErrors[`items.${index}.product_id`];
    setServerErrors(newErrors);
  };

  // Update Item Row
  const handleItemChange = (index: number, field: keyof OrderItemRow, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: field === 'quantity' ? Math.max(1, Number(value)) : value,
    };
    setItems(updated);

    // Clear specific error on change
    if (serverErrors[`items.${index}.${field}`]) {
      const newErrors = { ...serverErrors };
      delete newErrors[`items.${index}.${field}`];
      setServerErrors(newErrors);
    }
  };

  // Calculate estimated total on client side for UX preview
  const estimatedTotal = items.reduce((sum, item) => {
    if (!item.product_id) return sum;
    const prod = productsList.find((p) => p.id === Number(item.product_id));
    return sum + (prod ? Number(prod.price) * item.quantity : 0);
  }, 0);

  // Submit Order Mutation
  const orderMutation = useMutation({
    mutationFn: async (payload: { customer_id: string; items: { product_id: number; quantity: number }[] }) => {
      const res = await api.post('/orders', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      router.push('/orders');
    },
    onError: (err: any) => {
      const responseData = err.response?.data;
      if (responseData?.errors) {
        setServerErrors(responseData.errors);
      }
      setGeneralError(responseData?.message || 'Gagal membuat order. Periksa data kembali.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerErrors({});
    setGeneralError('');

    if (!customerId) {
      setGeneralError('Silakan pilih pelanggan terlebih dahulu.');
      return;
    }

    const invalidItems = items.some((it) => !it.product_id || it.quantity < 1);
    if (invalidItems) {
      setGeneralError('Pastikan seluruh baris produk telah dipilih dengan jumlah yang valid.');
      return;
    }

    orderMutation.mutate({
      customer_id: customerId,
      items: items.map((it) => ({
        product_id: Number(it.product_id),
        quantity: it.quantity,
      })),
    });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Breadcrumb / Back button */}
        <div className="flex items-center gap-2">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Riwayat
          </Link>
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Buat Transaksi Penjualan</h1>
            <p className="text-sm text-slate-500">
              Input pesanan penjualan. Validasi ketersediaan stok produk akan diverifikasi secara atomik oleh sistem backend.
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {generalError && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">{generalError}</p>
              <p className="text-xs text-rose-600 mt-0.5">
                Silakan sesuaikan item produk yang stoknya tidak mencukupi sebelum mengirim ulang.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Customer Selection */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                1
              </div>
              <h2 className="text-base font-bold text-slate-800">Pilih Pelanggan</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Pelanggan (Customer)
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={loadingCustomers}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Pilih Pelanggan --</option>
                {customersList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name} {c.phone ? `(${c.phone})` : ''} - {c.customer_address}
                  </option>
                ))}
              </select>
              {serverErrors.customer_id && (
                <p className="mt-1 text-xs text-rose-600">{serverErrors.customer_id[0]}</p>
              )}
            </div>
          </div>

          {/* Step 2: Product Items Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                  2
                </div>
                <h2 className="text-base font-bold text-slate-800">Item Produk yang Dipesan</h2>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Baris
              </button>
            </div>

            <div className="space-y-3">
              {items.map((row, index) => {
                const selectedProd = productsList.find((p) => p.id === Number(row.product_id));
                const rowSubtotal = selectedProd ? Number(selectedProd.price) * row.quantity : 0;
                const rowQtyError = serverErrors[`items.${index}.quantity`];
                const rowProdError = serverErrors[`items.${index}.product_id`];

                return (
                  <div
                    key={index}
                    className={`rounded-xl border p-4 transition-all ${
                      rowQtyError || rowProdError
                        ? 'border-rose-300 bg-rose-50/50'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center">
                      {/* Product Selector */}
                      <div className="sm:col-span-6">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Produk #{index + 1}
                        </label>
                        <select
                          required
                          value={row.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          disabled={loadingProducts}
                          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">-- Pilih Produk --</option>
                          {productsList.map((p) => (
                            <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                              [{p.product_code}] {p.product_name} — {formatRupiah(p.price)} (Stok: {p.stock})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Jumlah
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={row.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none text-center"
                        />
                      </div>

                      {/* Subtotal (preview) */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Estimasi Subtotal
                        </label>
                        <p className="p-2 text-sm font-semibold text-slate-800 font-mono">
                          {formatRupiah(rowSubtotal)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <div className="sm:col-span-1 flex justify-end sm:pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          disabled={items.length <= 1}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-rose-600 disabled:opacity-30 transition-colors"
                          title="Hapus Baris"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Server Error Highlight on specific item */}
                    {(rowQtyError || rowProdError) && (
                      <div className="mt-3 flex items-center gap-1.5 rounded-md bg-rose-100 p-2 text-xs font-semibold text-rose-800">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                        <span>{rowQtyError?.[0] || rowProdError?.[0]}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Checkout Summary & Total */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Transaksi Pembayaran
                </span>
                <h3 className="text-3xl font-extrabold text-blue-700 tracking-tight mt-0.5">
                  {formatRupiah(estimatedTotal)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  *Total dihitung di server secara presisi berdasarkan harga master produk.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/orders"
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={orderMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Receipt className="h-4 w-4" />
                  {orderMutation.isPending ? 'Memproses Order...' : 'Konfirmasi & Buat Order'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
