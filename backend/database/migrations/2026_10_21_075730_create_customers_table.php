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
    Schema::create('customers', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->string('customer_name', 150);
        $table->string('customer_address', 255);
        $table->enum('gender', ['Pria', 'Wanita']);
        $table->date('birth_date');
        $table->string('phone', 20)->nullable();
        $table->timestamps();
        $table->softDeletes();

        $table->index('customer_name');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
