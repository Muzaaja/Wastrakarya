<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public const ADMIN_EMAIL = 'admin@example.com';

    public const NON_PREMIUM_EMAIL = 'nonpremium@example.com';

    public const PREMIUM_EMAIL = 'premium@example.com';

    public const DEFAULT_PASSWORD = 'password';

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => self::ADMIN_EMAIL],
            [
                'name' => 'WastraKarya Admin',
                'email_verified_at' => now(),
                'password' => self::DEFAULT_PASSWORD,
                'is_admin' => true,
                'is_subscribed' => false,
                'subscription_expires_at' => null,
            ],
        );

        User::query()->updateOrCreate(
            ['email' => self::NON_PREMIUM_EMAIL],
            [
                'name' => 'Non-Premium User',
                'email_verified_at' => now(),
                'password' => self::DEFAULT_PASSWORD,
                'is_admin' => false,
                'is_subscribed' => false,
                'subscription_expires_at' => null,
            ],
        );

        User::query()->updateOrCreate(
            ['email' => self::PREMIUM_EMAIL],
            [
                'name' => 'Premium User',
                'email_verified_at' => now(),
                'password' => self::DEFAULT_PASSWORD,
                'is_admin' => false,
                'is_subscribed' => true,
                'subscription_expires_at' => now()->addYear(),
            ],
        );
    }
}
