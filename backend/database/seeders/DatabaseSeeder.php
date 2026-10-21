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
        $admin = User::create([
            'name' => 'Admin AZA',
            'email' => 'admin@azatech.id',
            'password' => Hash::make('password123'),
        ]);

        // 2. 20 Produk Dummy
        $products = collect();
        for ($i = 1; $i <= 20; $i++) {
            $products->push(Product::create([
                'product_code' => 'P' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'product_name' => 'Produk AzaTech ' . $i,
                'stock' => rand(10, 50),
                'price' => rand(10, 100) * 1000,
            ]));
        }

        // 3. 15 Customer Dummy
        $customers = collect();
        for ($i = 1; $i <= 15; $i++) {
            $customers->push(Customer::create([
                'customer_name' => 'Pelanggan ' . $i,
                'customer_address' => 'Jl. Merdeka No. ' . $i . ', Jakarta',
                'gender' => $i % 2 == 0 ? 'Pria' : 'Wanita',
                'birth_date' => '199' . ($i % 10) . '-05-15',
                'phone' => '0812345678' . str_pad((string)$i, 2, '0', STR_PAD_LEFT),
            ]));
        }

        // 4. 30 Order Tersebar dalam 30 Hari Terakhir
        for ($i = 1; $i <= 30; $i++) {
            $randomCustomer = $customers->random();
            $randomDaysAgo = rand(0, 29);
            $orderDate = now()->subDays($randomDaysAgo);

            $order = Order::create([
                'order_number' => 'INV-' . $orderDate->format('Ymd') . '-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'customer_id' => $randomCustomer->id,
                'created_by' => $admin->id,
                'order_date' => $orderDate,
                'total_amount' => 0,
                'created_at' => $orderDate,
                'updated_at' => $orderDate,
            ]);

            // Ambil 1-3 produk acak untuk order ini
            $selectedProducts = $products->random(rand(1, 3));
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

            // Update total_amount order
            $order->update(['total_amount' => $totalAmount]);
        }
    }
}
