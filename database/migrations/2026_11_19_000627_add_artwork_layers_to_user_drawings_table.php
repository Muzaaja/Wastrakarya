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
        Schema::table('user_drawings', function (Blueprint $table): void {
            $table->longText('pencil_data_url')->nullable()->after('data_url');
            $table->longText('wax_data_url')->nullable()->after('pencil_data_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_drawings', function (Blueprint $table): void {
            $table->dropColumn(['pencil_data_url', 'wax_data_url']);
        });
    }
};
