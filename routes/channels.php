<?php

use App\Models\User;
use App\Models\UserDrawing;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('canvas.{drawingId}', function (User $user, int $drawingId) {
    $drawing = UserDrawing::find($drawingId);
    if (! $drawing) {
        return false;
    }

    // Kolaborasi real-time hanya untuk pengguna yang memiliki langganan aktif
    if (! $user->hasActiveSubscription()) {
        return false;
    }

    if (! $drawing->canUserAccess($user)) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'is_owner' => $drawing->isOwner($user),
    ];
});
