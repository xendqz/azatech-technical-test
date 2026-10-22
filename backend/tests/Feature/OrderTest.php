<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Customer $customer;
    private Product $product1;
    private Product $product2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $this->customer = Customer::create([
            'customer_name' => 'Budi Santoso',
            'customer_address' => 'Jl. Sudirman No. 1, Jakarta',
            'gender' => 'Pria',
            'birth_date' => '1995-02-10',
            'phone' => '081234567890',
        ]);

        $this->product1 = Product::create([
            'product_code' => 'P0001',
            'product_name' => 'Hydrococo 150ml',
            'stock' => 10,
            'price' => 12000,
        ]);

        $this->product2 = Product::create([
            'product_code' => 'P0002',
            'product_name' => 'Pocari Sweat 500ml',
            'stock' => 5,
            'price' => 8000,
        ]);
    }

    /**
     * Skenario 1: Akses tanpa token (Unauthorized)
     */
    public function test_access_orders_without_token_returns_unauthorized(): void
    {
        $response = $this->getJson('/api/orders');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
            ]);
    }

    /**
     * Skenario 2: Validasi input gagal saat membuat order
     */
    public function test_create_order_validation_fails_with_invalid_payload(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/orders', [
            'customer_id' => null,
            'items' => [],
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonValidationErrors(['customer_id', 'items']);
    }

    /**
     * Skenario 3: Buat order sukses, hitung total & potong stok di database
     */
    public function test_create_order_successfully_and_deducts_stock(): void
    {
        $payload = [
            'customer_id' => $this->customer->id,
            'items' => [
                [
                    'product_id' => $this->product1->id,
                    'quantity' => 2,
                ],
                [
                    'product_id' => $this->product2->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->actingAs($this->user)->postJson('/api/orders', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Order berhasil dibuat',
            ]);

        $responseData = $response->json('data');
        $this->assertNotEmpty($responseData['order_number']);
        $this->assertStringStartsWith('INV-' . now()->format('Ymd'), $responseData['order_number']);

        // Total: (12000 * 2) + (8000 * 1) = 32000
        $this->assertEquals(32000, (float) $responseData['total_amount']);

        // Verifikasi stok berkurang di database
        $this->assertEquals(8, $this->product1->fresh()->stock);
        $this->assertEquals(4, $this->product2->fresh()->stock);

        // Verifikasi relasi order items tersimpan
        $this->assertDatabaseHas('orders', [
            'id' => $responseData['id'],
            'customer_id' => $this->customer->id,
            'total_amount' => 32000,
        ]);

        $this->assertDatabaseCount('order_items', 2);
    }

    /**
     * Skenario 4: Stok tidak cukup, seluruh transaksi dibatalkan (atomik)
     */
    public function test_create_order_fails_when_stock_insufficient_and_rolls_back(): void
    {
        $initialStock1 = $this->product1->stock; // 10
        $initialStock2 = $this->product2->stock; // 5

        $payload = [
            'customer_id' => $this->customer->id,
            'items' => [
                [
                    'product_id' => $this->product1->id,
                    'quantity' => 2, // Cukup
                ],
                [
                    'product_id' => $this->product2->id,
                    'quantity' => 10, // Tidak cukup (stok hanya 5)
                ],
            ],
        ];

        $response = $this->actingAs($this->user)->postJson('/api/orders', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Stok tidak mencukupi',
            ])
            ->assertJsonStructure([
                'errors' => [
                    'items.1.quantity',
                ],
            ]);

        // Verifikasi tidak ada order yang dibuat
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);

        // Verifikasi stok awal tidak berkurang sama sekali
        $this->assertEquals($initialStock1, $this->product1->fresh()->stock);
        $this->assertEquals($initialStock2, $this->product2->fresh()->stock);
    }

    /**
     * Skenario 5: Ambil detail order dan list order dengan filter
     */
    public function test_get_order_list_and_detail(): void
    {
        // Buat 1 order via helper/model
        $order = Order::create([
            'order_number' => 'INV-20261021-0001',
            'customer_id' => $this->customer->id,
            'created_by' => $this->user->id,
            'order_date' => now(),
            'total_amount' => 12000,
        ]);

        $order->items()->create([
            'product_id' => $this->product1->id,
            'quantity' => 1,
            'unit_price' => 12000,
            'subtotal' => 12000,
        ]);

        // Test List
        $listResponse = $this->actingAs($this->user)->getJson('/api/orders?customer_id=' . $this->customer->id);
        $listResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'OK',
            ])
            ->assertJsonPath('meta.total', 1);

        // Test Detail
        $detailResponse = $this->actingAs($this->user)->getJson('/api/orders/' . $order->id);
        $detailResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $order->id,
                    'order_number' => 'INV-20261021-0001',
                ],
            ]);
    }
}
