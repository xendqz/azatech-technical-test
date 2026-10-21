<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['customer', 'creator', 'items.product']);

        if ($request->has('from') && $request->has('to')) {
            $query->whereBetween('order_date', [$request->from, $request->to]);
        }

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        $orders = $query->latest('order_date')->paginate($request->get('per_page', 10));

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => $orders->items(),
            'meta' => [
                'page' => $orders->currentPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
                'total_pages' => $orders->lastPage(),
            ],
        ]);
    }

    public function show($id)
    {
        $order = Order::with(['customer', 'creator', 'items.product'])->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => $order,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($request) {
            $totalAmount = 0;
            $itemsToCreate = [];
            $errors = [];

            foreach ($request->items as $index => $item) {
                // Lock product record for update inside transaction
                $product = Product::lockForUpdate()->find($item['product_id']);

                if ($product->stock < $item['quantity']) {
                    $errors["items.{$index}.quantity"] = [
                        "Stok {$product->product_name} tersisa {$product->stock}, diminta {$item['quantity']}"
                    ];
                } else {
                    $subtotal = $product->price * $item['quantity'];
                    $totalAmount += $subtotal;

                    $itemsToCreate[] = [
                        'product_id' => $product->id,
                        'quantity' => $item['quantity'],
                        'unit_price' => $product->price,
                        'subtotal' => $subtotal,
                        'product_model' => $product,
                    ];
                }
            }

            // Jika ada stok yang kurang, rollback seluruh transaksi
            if (!empty($errors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stok tidak mencukupi',
                    'errors' => $errors,
                ], 422);
            }

            // Format order_number INV-YYYYMMDD-XXXX
            $dateStr = now()->format('Ymd');
            $todayCount = Order::whereDate('created_at', now()->today())->count() + 1;
            $orderNumber = 'INV-' . $dateStr . '-' . str_pad($todayCount, 4, '0', STR_PAD_LEFT);

            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $request->customer_id,
                'created_by' => auth()->id(),
                'order_date' => now(),
                'total_amount' => $totalAmount,
            ]);

            foreach ($itemsToCreate as $itemData) {
                // Deduct stock
                $itemData['product_model']->decrement('stock', $itemData['quantity']);

                $order->items()->create([
                    'product_id' => $itemData['product_id'],
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'subtotal' => $itemData['subtotal'],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Order berhasil dibuat',
                'data' => $order->load(['customer', 'items.product']),
            ], 201);
        });
    }
}