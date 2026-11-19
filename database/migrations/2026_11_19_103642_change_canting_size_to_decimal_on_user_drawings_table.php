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
            $table->decimal('canting_size', total: 4, places: 2)
                ->unsigned()
                ->nullable()
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_drawings', function (Blueprint $table): void {
            $table->unsignedSmallInteger('canting_size')
                ->nullable()
                ->change();
        });
    }
};
