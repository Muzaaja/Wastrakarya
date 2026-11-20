<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_creates_repeatable_data_for_both_user_types(): void
    {
        $this->travelTo('2026-11-20 12:00:00');

        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $nonPremiumUser = User::query()
            ->where('email', UserSeeder::NON_PREMIUM_EMAIL)
            ->sole();
        $premiumUser = User::query()
            ->where('email', UserSeeder::PREMIUM_EMAIL)
            ->sole();

        $this->assertDatabaseCount('users', 2);
        $this->assertFalse($nonPremiumUser->hasActiveSubscription());
        $this->assertNull($nonPremiumUser->subscription_expires_at);
        $this->assertTrue(Hash::check(UserSeeder::DEFAULT_PASSWORD, $nonPremiumUser->password));
        $this->assertTrue($premiumUser->hasActiveSubscription());
        $this->assertSame('2027-11-20 12:00:00', $premiumUser->subscription_expires_at?->format('Y-m-d H:i:s'));
        $this->assertTrue(Hash::check(UserSeeder::DEFAULT_PASSWORD, $premiumUser->password));
    }
}
