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
        Schema::table('user_drawings', function (Blueprint $table) {
            $table->string('share_type')->default('private')->after('data_url');
            $table->string('share_token', 64)->nullable()->unique()->after('share_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_drawings', function (Blueprint $table) {
            $table->dropColumn(['share_type', 'share_token']);
        });
    }
};
