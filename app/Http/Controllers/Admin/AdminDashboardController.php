<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $subscription = $request->string('subscription')->toString();
        $currentTime = now();

        $customers = User::query()
            ->where('is_admin', false)
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->whereLike('name', "%{$search}%")
                        ->orWhereLike('email', "%{$search}%");
                });
            })
            ->when($subscription === 'active', fn (Builder $query): Builder => $query
                ->where('is_subscribed', true)
                ->where(function (Builder $query) use ($currentTime): void {
                    $query
                        ->whereNull('subscription_expires_at')
                        ->orWhere('subscription_expires_at', '>=', $currentTime);
                }))
            ->when($subscription === 'inactive', fn (Builder $query): Builder => $query
                ->where(function (Builder $query) use ($currentTime): void {
                    $query
                        ->where('is_subscribed', false)
                        ->orWhere('subscription_expires_at', '<', $currentTime);
                }))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (User $customer): array => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'is_subscribed' => $customer->is_subscribed,
                'has_active_subscription' => $customer->hasActiveSubscription(),
                'subscription_expires_at' => $customer->subscription_expires_at?->toDateString(),
                'created_at' => $customer->created_at->toDateString(),
            ]);

        return Inertia::render('Admin/Dashboard', [
            'customers' => $customers,
            'filters' => [
                'search' => $search,
                'subscription' => in_array($subscription, ['active', 'inactive'], true)
                    ? $subscription
                    : 'all',
            ],
            'stats' => [
                'customers' => User::query()->where('is_admin', false)->count(),
                'active_subscriptions' => User::query()
                    ->where('is_admin', false)
                    ->where('is_subscribed', true)
                    ->where(function (Builder $query) use ($currentTime): void {
                        $query
                            ->whereNull('subscription_expires_at')
                            ->orWhere('subscription_expires_at', '>=', $currentTime);
                    })
                    ->count(),
                'new_this_month' => User::query()
                    ->where('is_admin', false)
                    ->where('created_at', '>=', now()->startOfMonth())
                    ->count(),
            ],
        ]);
    }
}
