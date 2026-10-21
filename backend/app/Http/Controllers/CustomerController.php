<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();

        if ($request->filled('search')) {
            $query->where('customer_name', 'like', "%{$request->search}%");
        }

        $customers = $query->latest()->paginate($request->get('per_page', 10));

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => $customers->items(),
            'meta' => [
                'page' => $customers->currentPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
                'total_pages' => $customers->lastPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:150',
            'customer_address' => 'required|string|max:255',
            'gender' => 'required|in:Pria,Wanita',
            'birth_date' => 'required|date',
            'phone' => 'nullable|string|max:20',
        ]);

        $customer = Customer::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Pelanggan berhasil ditambahkan',
            'data' => $customer,
        ], 201);
    }

    public function show($id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Pelanggan tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => $customer,
        ]);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Pelanggan tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'customer_name' => 'required|string|max:150',
            'customer_address' => 'required|string|max:255',
            'gender' => 'required|in:Pria,Wanita',
            'birth_date' => 'required|date',
            'phone' => 'nullable|string|max:20',
        ]);

        $customer->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Pelanggan berhasil diperbarui',
            'data' => $customer,
        ]);
    }

    public function destroy($id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Pelanggan tidak ditemukan',
            ], 404);
        }

        $customer->delete(); // Soft delete

        return response()->json([
            'success' => true,
            'message' => 'Pelanggan berhasil dihapus',
        ]);
    }
}