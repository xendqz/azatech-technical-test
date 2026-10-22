# AZATECH — Sistem Online Shop & Order Management

> **Technical Test — Medior Fullstack Developer**  
> **PT LAKSMADA AZA SIMETRI**

Aplikasi fullstack sistem online shop untuk mengelola produk, pelanggan, dan transaksi penjualan dengan validasi stok atomik, historical snapshot pricing, dan dashboard ringkasan penjualan harian.

---

## 1. Tech Stack & Alasan Pemilihan

### Backend: Laravel 13 (Track B)
- **Framework**: Laravel 13 running on PHP 8.3+.
- **Alasan Pemilihan**:
  - **Database Transactions & Locking**: Memiliki dukungan bawaan untuk `DB::transaction` dan `lockForUpdate()` (pessimistic locking) guna mencegah kondisi balapan (*race condition*) pada pengecekan stok produk saat transaksi concurrent.
  - **Eloquent ORM & Relasi Kuat**: Memudahkan penanganan relasi kompleks seperti *Soft Deletes* (`withTrashed()` pada riwayat item transaksi) serta historical price snapshotting.
  - **Laravel Sanctum**: Menyediakan API Token authentication yang ringan, aman, dan stateless untuk konsumsi SPA / frontend service.
  - **Automated Testing Suite**: Terintegrasi langsung dengan PHPUnit untuk menguji transaksi atomik, validasi payload, dan skenario kegagalan stok.

### Frontend: Next.js 16 (App Router) + React 19 + TypeScript
- **Framework & Runtime**: Next.js 16 + React 19 + TypeScript (Strict Mode).
- **Styling**: Tailwind CSS untuk UI yang responsif dan fleksibel.
- **Data Fetching & State**: TanStack Query (React Query) v5 + Axios untuk declarative caching, refetching, serta response interceptor autentikasi.
- **Icons & Formatters**: Lucide React + custom Indonesian Date & Rupiah Currency Formatters.
- **Alasan Pemilihan**:
  - Arsitektur modular dan pemisahan service yang tegas antara client/SPA dan REST API backend.
  - Penanganan dinamis form pembuatan order multi-baris (*dynamic item rows*) dengan real-time reactive calculations dan item-specific server validation mapping.

---

## 2. Panduan Setup (Quick Setup Guide)

Aplikasi dapat dijalankan dari repositori baru melalui langkah singkat berikut:

### Prasyarat
- PHP >= 8.3 & Composer
- Node.js >= 20 & NPM
- MySQL 8 atau PostgreSQL (default: MySQL port 3306, nama database `azatech_shop`)

### Langkah Menjalankan Aplikasi (Maksimal 6 Perintah)

```bash
# 1. Masuk ke folder backend & pasang dependensi
cd backend && composer install

# 2. Setup environment & app key
cp .env.example .env && php artisan key:generate

# 3. Jalankan migrasi dan seeder database
php artisan migrate:fresh --seed

# 4. Jalankan backend server (berjalan di http://127.0.0.1:8000)
php artisan serve

# 5. Pada terminal baru, masuk ke frontend & pasang dependensi
cd ../frontend && npm install

# 6. Jalankan frontend development server (berjalan di http://localhost:3000)
npm run dev
```

### Akun Login Seeder
- **Email**: `admin@azatech.id`
- **Password**: `password123`
*(Kredensial ini otomatis tersedia melalui `DatabaseSeeder`)*

---

## 3. Penjelasan Logika Bisnis & Desain Teknis

### A. Alur Pembuatan Order & Penanganan Stok (Atomik)
1. **Validasi Request Awal**: Server memeriksa keberadaan customer dan struktur array item produk (`customer_id`, `items.*.product_id`, `items.*.quantity`).
2. **Pessimistic Locking (`lockForUpdate`)**:
   - Untuk mencegah *race condition* atau *overselling* saat banyak transaksi diproses bersamaan, sistem mengunci baris produk di database dalam satu transaksi (`DB::transaction`).
   - Sistem mengakumulasi kuantitas produk jika ada produk yang sama diinput lebih dari satu kali dalam baris order.
3. **All-or-Nothing Stock Validation**:
   - Jika satu saja item memiliki stok lebih kecil dari kuantitas yang diminta, transaksi langsung di-rollback dan server mengembalikan response error HTTP `422 Unprocessable Content` dengan pemetaan indeks item yang bermasalah:
     ```json
     {
       "success": false,
       "message": "Stok tidak mencukupi",
       "errors": {
         "items.0.quantity": ["Stok Hydrococo 150ml tersisa 3, diminta 5"]
       }
     }
     ```
4. **Server-side Calculation**:
   - Harga satuan (`unit_price`) dan `subtotal` per item serta `total_amount` seluruh order **dihitung 100% di server** berdasarkan data harga master produk pada database. Server tidak mempercayai input harga dari client.
5. **Historical Price Snapshot (`unit_price`)**:
   - Harga produk pada tabel master bisa berubah sewaktu-waktu di kemudian hari. Nilai harga saat transaksi disimpan ke kolom `unit_price` pada tabel `order_items` untuk menjaga validitas historis laporan keuangan dan audit penjualan.
6. **Unique Order Number Generation**:
   - Format nomor order otomatis dibuat oleh server: `INV-YYYYMMDD-XXXX`.
   - Nomor sequence dihitung dari suffix numerik order tertinggi pada tanggal tersebut untuk mencegah tabrakan ID unik.
7. **Pengurangan Stok**:
   - Setelah validasi lolos dan baris `order` terbuat, stok produk dikurangi dengan `decrement('stock', $qty)`.

### B. Soft Delete & Integritas Relasi Produk
- Produk dan pelanggan menggunakan fitur **Soft Delete** (`deleted_at`).
- Model `OrderItem` mendefinisikan relasi:
  ```php
  public function product()
  {
      return $this->belongsTo(Product::class)->withTrashed();
  }
  ```
- Dengan menggunakan `withTrashed()`, produk yang telah dihapus (*soft deleted*) tetap dapat ditampilkan secara utuh pada riwayat detail transaksi tanpa merusak integritas tampilan.

---

## 4. Cara Menjalankan Automated Test

Automated testing telah dibuat menggunakan PHPUnit di backend dengan cakupan skenario wajib:

```bash
cd backend
./vendor/bin/phpunit
# atau menggunakan artisan:
php artisan test
```

### Skenario Uji yang Dicakup:
1. `test_access_orders_without_token_returns_unauthorized`: Menguji route protection & pengembalian status 401 saat unauthenticated.
2. `test_create_order_validation_fails_with_invalid_payload`: Menguji kegagalan validasi form saat payload tidak lengkap (status 422).
3. `test_create_order_successfully_and_deducts_stock`: Menguji alur sukses pembuatan order, pembentukan order_number `INV-YYYYMMDD-XXXX`, perhitungan total server-side, dan pemotongan stok aktual di DB.
4. `test_create_order_fails_when_stock_insufficient_and_rolls_back`: Menguji kondisi stok tidak cukup, memastikan seluruh transaksi di-rollback secara atomik dan stok tidak berkurang sama sekali.
5. `test_get_order_list_and_detail`: Menguji endpoint list dengan filter customer serta endpoint detail order.
6. `test_user_can_login_with_valid_credentials`: Menguji penerbitan Sanctum access token saat kredensial benar.
7. `test_user_cannot_login_with_invalid_credentials`: Menguji penolakan kredensial salah (status 401).
8. `test_authenticated_user_can_access_me_profile_and_logout`: Menguji endpoint `/me` dan proses logout.

---

## 5. Dokumentasi API (Postman Collection)

File Postman collection telah disediakan di root repository:
- **`Azatech_API.postman_collection.json`**

File ini mencakup dokumentasi seluruh endpoint:
- **Authentication**: Login, Logout, Profile (`/me`)
- **Products**: List (search & sort), Create, Detail, Update, Soft Delete
- **Customers**: List (search), Create, Detail, Update, Soft Delete
- **Orders**: List (date & customer filters), Create (atomic transaction), Detail with items
- **Dashboard**: Ringkasan penjualan, top 5 produk, stok < 5

Collection dilengkapi dengan environment variable `{{base_url}}` dan auto-set bearer `{{token}}` saat login berhasil.

---

## 6. Asumsi, Keterbatasan, & Rencana Pengembangan

### Asumsi
1. Sistem diasumsikan beroperasi dalam zona waktu Indonesia Barat (WIB).
2. Transaksi order yang telah berhasil dibuat dianggap final (tidak ada fitur pembatalan / refund pada spesifikasi dasar).

### Keterbatasan
1. Seluruh proses checkout dilakukan sinkron dalam single request HTTP database transaction.
2. Filter rentang tanggal pada client saat ini dibatasi pada level hari (*startOfDay* hingga *endOfDay*).

### Hal yang Akan Dikerjakan Jika Ada Waktu Lebih (Roadmap)
- [ ] **Grafik Visual Penjualan Harian**: Visualisasi tren omset harian interaktif menggunakan Chart.js / Recharts.
- [ ] **Role-Based Access Control (RBAC)**: Menambahkan role kasir, manager, dan superadmin menggunakan Spatie Permission.
- [ ] **Async Order Processing**: Menambahkan queue worker dengan Redis untuk pesanan dengan volume lalu-lintas sangat tinggi.
- [ ] **Cetak Faktur PDF**: Generate PDF invoice langsung dari tombol detail order.

---

## 7. Fitur Bonus yang Diimplementasikan

1. **Docker Compose**: Tersedia file `docker-compose.yml` untuk menjalankan MySQL, Backend, dan Frontend secara terisolasi.
2. **GitHub Actions CI**: Terkonfigurasi pada `.github/workflows/ci.yml` untuk menjalankan pipeline automated test dan build frontend secara otomatis.
3. **Export CSV Riwayat Order**: Tersedia tombol *Export CSV* pada halaman riwayat order frontend.
4. **Indonesian Localization**: Seluruh mata uang diformat menggunakan standar Rupiah (`Rp 12.000`) dan tanggal menggunakan format lokal Indonesia (`21 Oktober 2026`).

---

## 8. AI Usage Disclosure

Sesuai dengan ketentuan pengerjaan teknis pada panduan soal:
- **Tool**: AI Coding Assistant (GitHub Copilot / LLM Assistant)
- **Bagian Penggunaan**:
  1. **Styling & UI Frontend (Tailwind CSS)**: Membantu percepatan penataan layout antarmuka, *utility classes* Tailwind CSS, styling tabel dinamis, modal dialog, dan desain responsif mobile.
  2. **Generasi Data Dummy (Seeder)**: Membantu penyusunan variasi nama produk ritel/FMCG, harga acuan, serta data profil pelanggan pada `DatabaseSeeder`.
  3. **Penyusunan Dokumentasi**: Membantu merapikan struktur file JSON Postman Collection dan format Markdown README.
