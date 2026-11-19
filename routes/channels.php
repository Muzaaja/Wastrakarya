<?php

use App\Models\User;
use App\Models\UserDrawing;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('canvas.{drawingId}', function (User $user, int $drawingId) {
    $drawing = UserDrawing::with('classroom.users')->find($drawingId);
    if (! $drawing) {
        return false;
    }

    // Jika ini kanvas bersama kelas, izinkan semua anggota kelas untuk kolaborasi live
    if ($drawing->classroom_id && $drawing->classroom) {
        $isClassMember = $drawing->classroom->users->contains('id', $user->id);
        if ($isClassMember) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_owner' => $drawing->isOwner($user),
            ];
        }
    }

    // Kolaborasi umum di luar kelas hanya untuk pengguna yang memiliki langganan aktif
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
