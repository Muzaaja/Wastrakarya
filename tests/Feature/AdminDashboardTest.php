<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/admin/dashboard')
            ->assertRedirect(route('login'));
    }

    public function test_customer_cannot_access_admin_dashboard_or_update_subscriptions(): void
    {
        $customer = User::factory()->create();
        $otherCustomer = User::factory()->create();

        $this->actingAs($customer)
            ->get('/admin/dashboard')
            ->assertForbidden();

        $this->actingAs($customer)
            ->patch(route('admin.customers.subscription.update', $otherCustomer), [
                'is_subscribed' => true,
                'subscription_expires_at' => now()->addMonth()->toDateString(),
            ])
            ->assertForbidden();

        $this->assertFalse($otherCustomer->refresh()->is_subscribed);
    }

    public function test_admin_can_view_customer_subscription_details(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->subscribed()->create([
            'name' => 'Sari Customer',
            'email' => 'sari@example.com',
        ]);

        $this->actingAs($admin)
            ->get('/admin/dashboard?search=sari&subscription=active')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dashboard')
                ->where('filters.search', 'sari')
                ->where('filters.subscription', 'active')
                ->where('stats.customers', 1)
                ->where('stats.active_subscriptions', 1)
                ->has('customers.data', 1)
                ->where('customers.data.0.id', $customer->id)
                ->where('customers.data.0.name', 'Sari Customer')
                ->where('customers.data.0.has_active_subscription', true));
    }

    public function test_admin_can_enable_and_disable_a_customer_subscription(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();
        $expiresAt = now()->addMonth()->toDateString();

        $this->actingAs($admin)
            ->from(route('admin.dashboard'))
            ->patch(route('admin.customers.subscription.update', $customer), [
                'is_subscribed' => true,
                'subscription_expires_at' => $expiresAt,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('admin.dashboard'));

        $this->assertTrue($customer->refresh()->is_subscribed);
        $this->assertSame($expiresAt, $customer->subscription_expires_at?->toDateString());

        $this->actingAs($admin)
            ->patch(route('admin.customers.subscription.update', $customer), [
                'is_subscribed' => false,
                'subscription_expires_at' => $expiresAt,
            ])
            ->assertSessionHasNoErrors();

        $customer->refresh();
        $this->assertFalse($customer->is_subscribed);
        $this->assertNull($customer->subscription_expires_at);
    }

    public function test_subscription_expiring_today_remains_active_until_the_end_of_the_day(): void
    {
        $this->travelTo('2026-11-20 12:00:00');

        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $this->actingAs($admin)
            ->patch(route('admin.customers.subscription.update', $customer), [
                'is_subscribed' => true,
                'subscription_expires_at' => '2026-11-20',
            ])
            ->assertSessionHasNoErrors();

        $customer->refresh();

        $this->assertTrue($customer->hasActiveSubscription());
        $this->assertSame('2026-11-20 23:59:59', $customer->subscription_expires_at?->format('Y-m-d H:i:s'));

        $this->actingAs($admin)
            ->get('/admin/dashboard?subscription=active')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.active_subscriptions', 1)
                ->has('customers.data', 1)
                ->where('customers.data.0.id', $customer->id));
    }

    public function test_expired_subscription_is_reported_as_inactive(): void
    {
        $this->travelTo('2026-11-20 12:00:00');

        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create([
            'is_subscribed' => true,
            'subscription_expires_at' => '2026-11-20 10:00:00',
        ]);

        $this->actingAs($admin)
            ->get('/admin/dashboard?subscription=inactive')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.active_subscriptions', 0)
                ->has('customers.data', 1)
                ->where('customers.data.0.id', $customer->id)
                ->where('customers.data.0.has_active_subscription', false));
    }

    public function test_subscription_expiry_cannot_be_in_the_past(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $this->actingAs($admin)
            ->from(route('admin.dashboard'))
            ->patch(route('admin.customers.subscription.update', $customer), [
                'is_subscribed' => true,
                'subscription_expires_at' => now()->subDay()->toDateString(),
            ])
            ->assertSessionHasErrors('subscription_expires_at')
            ->assertRedirect(route('admin.dashboard'));

        $this->assertFalse($customer->refresh()->is_subscribed);
    }

    public function test_admin_account_cannot_be_managed_as_a_customer(): void
    {
        $admin = User::factory()->admin()->create();
        $otherAdmin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->patch(route('admin.customers.subscription.update', $otherAdmin), [
                'is_subscribed' => true,
                'subscription_expires_at' => now()->addMonth()->toDateString(),
            ])
            ->assertNotFound();
    }
}
