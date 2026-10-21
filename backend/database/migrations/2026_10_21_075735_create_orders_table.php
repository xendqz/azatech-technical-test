<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('orders', function (Blueprint $table) {
        $table->id();
        $table->string('order_number', 30)->unique();
        $table->foreignUuid('customer_id')->constrained('customers')->cascadeOnDelete();
        $table->foreignId('created_by')->constrained('users'); // Foreign key ke tabel users
        $table->timestamp('order_date');
        $table->decimal('total_amount', 14, 2);
        $table->timestamps();

        $table->index('order_number');
        $table->index('order_date');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
