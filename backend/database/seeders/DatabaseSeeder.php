<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@azatech.id'],
            [
                'name' => 'Admin AZA',
                'password' => Hash::make('password123'),
            ]
        );

        // 2. 20+ Produk Realistis
        $productSamples = [
            ['code' => 'P0001', 'name' => 'Hydrococo 150ml', 'stock' => 35, 'price' => 7500],
            ['code' => 'P0002', 'name' => 'Pocari Sweat 500ml', 'stock' => 40, 'price' => 9000],
            ['code' => 'P0003', 'name' => 'Ultra Milk Cokelat 250ml', 'stock' => 50, 'price' => 6500],
            ['code' => 'P0004', 'name' => 'Aqua Air Mineral 600ml', 'stock' => 100, 'price' => 3500],
            ['code' => 'P0005', 'name' => 'Teh Botol Sosro 250ml', 'stock' => 60, 'price' => 4500],
            ['code' => 'P0006', 'name' => 'Indomie Goreng Original 85g', 'stock' => 120, 'price' => 3200],
            ['code' => 'P0007', 'name' => 'Indomie Kuah Ayam Bawang 69g', 'stock' => 80, 'price' => 3100],
            ['code' => 'P0008', 'name' => 'Chitato Sapi Panggang 68g', 'stock' => 25, 'price' => 12500],
            ['code' => 'P0009', 'name' => 'Silverqueen Almond 65g', 'stock' => 15, 'price' => 18000],
            ['code' => 'P0010', 'name' => 'Bear Brand Susu Steril 189ml', 'stock' => 4, 'price' => 10500], // stok < 5 untuk alert
            ['code' => 'P0011', 'name' => 'Kopi Kapal Api Spesial 165g', 'stock' => 30, 'price' => 14000],
            ['code' => 'P0012', 'name' => 'Good Day Cappuccino 10x25g', 'stock' => 3, 'price' => 22000], // stok < 5 untuk alert
            ['code' => 'P0013', 'name' => 'Nescafe Classic Jar 100g', 'stock' => 18, 'price' => 42000],
            ['code' => 'P0014', 'name' => 'Oreo Sandwich Vanilla 133g', 'stock' => 45, 'price' => 9500],
            ['code' => 'P0015', 'name' => 'Tango Wafer Cokelat 130g', 'stock' => 35, 'price' => 8500],
            ['code' => 'P0016', 'name' => 'Buavita Orange Juice 250ml', 'stock' => 2, 'price' => 8000], // stok < 5 untuk alert
            ['code' => 'P0017', 'name' => 'Milo Activ-Go UHT 220ml', 'stock' => 40, 'price' => 9500],
            ['code' => 'P0018', 'name' => 'Pringles Potato Chips Original 107g', 'stock' => 20, 'price' => 24000],
            ['code' => 'P0019', 'name' => 'Cadbury Dairy Milk 62g', 'stock' => 15, 'price' => 17500],
            ['code' => 'P0020', 'name' => 'Nutrisari Jeruk Peras 10 sachet', 'stock' => 50, 'price' => 13500],
            ['code' => 'P0021', 'name' => 'Kusuka Keripik Singkong Barbeque 180g', 'stock' => 30, 'price' => 16000],
        ];

        $products = collect();
        foreach ($productSamples as $item) {
            $products->push(Product::updateOrCreate(
                ['product_code' => $item['code']],
                [
                    'product_name' => $item['name'],
                    'stock' => $item['stock'],
                    'price' => $item['price'],
                ]
            ));
        }

        // 3. 15 Customer Realistis
        $customerSamples = [
            ['name' => 'Budi Santoso', 'address' => 'Jl. Sudirman No. 45, Jakarta Selatan', 'gender' => 'Pria', 'birth' => '1990-03-12', 'phone' => '081234567801'],
            ['name' => 'Siti Aminah', 'address' => 'Jl. MH Thamrin No. 12, Jakarta Pusat', 'gender' => 'Wanita', 'birth' => '1994-07-25', 'phone' => '081234567802'],
            ['name' => 'Ahmad Fauzi', 'address' => 'Jl. Dago No. 110, Bandung', 'gender' => 'Pria', 'birth' => '1988-11-04', 'phone' => '081234567803'],
            ['name' => 'Dewi Lestari', 'address' => 'Jl. Malioboro No. 23, Yogyakarta', 'gender' => 'Wanita', 'birth' => '1995-02-18', 'phone' => '081234567804'],
            ['name' => 'Rizky Pratama', 'address' => 'Jl. Pemuda No. 78, Semarang', 'gender' => 'Pria', 'birth' => '1992-09-30', 'phone' => '081234567805'],
            ['name' => 'Maya Anggraini', 'address' => 'Jl. Basuki Rahmat No. 64, Surabaya', 'gender' => 'Wanita', 'birth' => '1996-01-14', 'phone' => '081234567806'],
            ['name' => 'Hendra Setiawan', 'address' => 'Jl. Gajah Mada No. 89, Denpasar', 'gender' => 'Pria', 'birth' => '1991-06-20', 'phone' => '081234567807'],
            ['name' => 'Putri Ayu', 'address' => 'Jl. Gatot Subroto No. 34, Medan', 'gender' => 'Wanita', 'birth' => '1997-04-09', 'phone' => '081234567808'],
            ['name' => 'Bambang Pamungkas', 'address' => 'Jl. Ahmad Yani No. 15, Surakarta', 'gender' => 'Pria', 'birth' => '1989-12-01', 'phone' => '081234567809'],
            ['name' => 'Rina Wijaya', 'address' => 'Jl. Urip Sumoharjo No. 55, Makassar', 'gender' => 'Wanita', 'birth' => '1993-08-17', 'phone' => '081234567810'],
            ['name' => 'Fajar Nugraha', 'address' => 'Jl. Asia Afrika No. 90, Bandung', 'gender' => 'Pria', 'birth' => '1995-10-10', 'phone' => '081234567811'],
            ['name' => 'Lestari Handayani', 'address' => 'Jl. Margonda Raya No. 120, Depok', 'gender' => 'Wanita', 'birth' => '1992-05-22', 'phone' => '081234567812'],
            ['name' => 'Eko Prasetyo', 'address' => 'Jl. Pajajaran No. 31, Bogor', 'gender' => 'Pria', 'birth' => '1987-04-16', 'phone' => '081234567813'],
            ['name' => 'Fitri Handayani', 'address' => 'Jl. Ahmad Dahlan No. 4, Malang', 'gender' => 'Wanita', 'birth' => '1998-09-05', 'phone' => '081234567814'],
            ['name' => 'Doni Kusuma', 'address' => 'Jl. Diponegoro No. 88, Semarang', 'gender' => 'Pria', 'birth' => '1990-01-29', 'phone' => '081234567815'],
        ];

        $customers = collect();
        foreach ($customerSamples as $item) {
            $customer = Customer::where('customer_name', $item['name'])->first();
            if (!$customer) {
                $customer = Customer::create([
                    'customer_name' => $item['name'],
                    'customer_address' => $item['address'],
                    'gender' => $item['gender'],
                    'birth_date' => $item['birth'],
                    'phone' => $item['phone'],
                ]);
            }
            $customers->push($customer);
        }

        // 4. Minimal 30 Order Tersebar dalam 30 Hari Terakhir
        if (Order::count() < 30) {
            for ($i = 1; $i <= 30; $i++) {
                $randomCustomer = $customers->random();
                $randomDaysAgo = rand(0, 29);
                $orderDate = now()->subDays($randomDaysAgo)->subHours(rand(1, 12))->subMinutes(rand(1, 50));

                $orderNumber = 'INV-' . $orderDate->format('Ymd') . '-' . str_pad((string)$i, 4, '0', STR_PAD_LEFT);

                $order = Order::create([
                    'order_number' => $orderNumber,
                    'customer_id' => $randomCustomer->id,
                    'created_by' => $admin->id,
                    'order_date' => $orderDate,
                    'total_amount' => 0,
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);

                // Ambil 1-4 produk acak
                $selectedProducts = $products->random(rand(1, 4));
                $totalAmount = 0;

                foreach ($selectedProducts as $product) {
                    $qty = rand(1, 3);
                    $subtotal = $product->price * $qty;
                    $totalAmount += $subtotal;

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'quantity' => $qty,
                        'unit_price' => $product->price,
                        'subtotal' => $subtotal,
                        'created_at' => $orderDate,
                        'updated_at' => $orderDate,
                    ]);
                }

                $order->update(['total_amount' => $totalAmount]);
            }
        }
    }
}
