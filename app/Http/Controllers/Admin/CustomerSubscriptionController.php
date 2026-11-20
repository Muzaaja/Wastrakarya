<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateCustomerSubscriptionRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

class CustomerSubscriptionController extends Controller
{
    public function update(UpdateCustomerSubscriptionRequest $request, User $customer): RedirectResponse
    {
        abort_if($customer->is_admin, 404);

        $subscriptionExpiresAt = $request->boolean('is_subscribed')
            ? $request->date('subscription_expires_at')?->endOfDay()
            : null;

        $customer->update([
            'is_subscribed' => $request->boolean('is_subscribed'),
            'subscription_expires_at' => $subscriptionExpiresAt,
        ]);

        return back()->with('success', "Subscription for {$customer->name} was updated.");
    }
}
