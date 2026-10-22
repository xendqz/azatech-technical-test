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

        if ($request->filled('from')) {
            $query->where('order_date', '>=', \Carbon\Carbon::parse($request->from)->startOfDay());
        }

        if ($request->filled('to')) {
            $query->where('order_date', '<=', \Carbon\Carbon::parse($request->to)->endOfDay());
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('customer_name', 'like', "%{$search}%");
                  });
            });
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
            $productQuantities = [];
            foreach ($request->items as $item) {
                $pId = $item['product_id'];
                $productQuantities[$pId] = ($productQuantities[$pId] ?? 0) + $item['quantity'];
            }

            // Lock products for update inside database transaction
            $products = Product::whereIn('id', array_keys($productQuantities))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $errors = [];
            foreach ($request->items as $index => $item) {
                $pId = $item['product_id'];
                $product = $products->get($pId);

                if (!$product) {
                    $errors["items.{$index}.product_id"] = ["Produk tidak ditemukan"];
                    continue;
                }

                if ($product->stock < $productQuantities[$pId]) {
                    $errors["items.{$index}.quantity"] = [
                        "Stok {$product->product_name} tersisa {$product->stock}, diminta {$productQuantities[$pId]}"
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
            $prefix = 'INV-' . now()->format('Ymd') . '-';
            $latestOrder = Order::where('order_number', 'like', $prefix . '%')
                ->orderByDesc('order_number')
                ->first();

            $nextNumber = 1;
            if ($latestOrder) {
                $lastSeq = (int) substr($latestOrder->order_number, -4);
                $nextNumber = $lastSeq + 1;
            }
            $orderNumber = $prefix . str_pad((string)$nextNumber, 4, '0', STR_PAD_LEFT);

            $totalAmount = 0;
            $itemsData = [];

            foreach ($request->items as $item) {
                $product = $products->get($item['product_id']);
                $subtotal = $product->price * $item['quantity'];
                $totalAmount += $subtotal;

                $itemsData[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'subtotal' => $subtotal,
                ];
            }

            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $request->customer_id,
                'created_by' => $request->user()?->id ?? auth()->id(),
                'order_date' => now(),
                'total_amount' => $totalAmount,
            ]);

            foreach ($itemsData as $itemData) {
                $itemData['product']->decrement('stock', $itemData['quantity']);

                $order->items()->create([
                    'product_id' => $itemData['product']->id,
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