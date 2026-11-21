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
            $table->boolean('tile_free_drawing')->default(false)->after('motif');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_drawings', function (Blueprint $table): void {
            $table->dropColumn('tile_free_drawing');
        });
    }
};
