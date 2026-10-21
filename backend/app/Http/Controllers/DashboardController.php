<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $totalTransactions = Order::count();
        $totalSales = Order::sum('total_amount');

        // 5 Produk Terlaris berdasarkan total quantity terjual
        $topProducts = OrderItem::select('product_id', DB::raw('SUM(quantity) as total_sold'))
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->with('product')
            ->get()
            ->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'product_code' => $item->product?->product_code,
                    'product_name' => $item->product?->product_name,
                    'total_sold' => (int) $item->total_sold,
                ];
            });

        // Produk dengan stok < 5
        $lowStockProducts = Product::where('stock', '<', 5)
            ->get(['id', 'product_code', 'product_name', 'stock', 'price']);

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => [
                'total_transactions' => $totalTransactions,
                'total_sales' => (float) $totalSales,
                'top_products' => $topProducts,
                'low_stock_products' => $lowStockProducts,
            ],
        ]);
    }
}