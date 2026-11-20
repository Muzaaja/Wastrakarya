<?php

namespace App\Models;

use Database\Factories\UserDrawingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable(['user_id', 'classroom_id', 'title', 'motif', 'wax_color', 'wax_color_name', 'fabric_color', 'canting_size', 'data_url', 'pencil_data_url', 'wax_data_url', 'share_type', 'share_token'])]
class UserDrawing extends Model
{
    /** @use HasFactory<UserDrawingFactory> */
    use HasFactory;

    public const SHARE_PRIVATE = 'private';

    public const SHARE_PUBLIC = 'public';

    public const SHARE_SPECIFIC = 'specific_users';

    protected $casts = [
        'canting_size' => 'float',
    ];

    /**
     * @return BelongsTo<Classroom, UserDrawing>
     */
    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    /**
     * @return BelongsTo<User, UserDrawing>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<UserDrawingCollaborator, UserDrawing>
     */
    public function collaborators(): HasMany
    {
        return $this->hasMany(UserDrawingCollaborator::class);
    }

    public function isOwner(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return (int) $this->user_id === (int) $user->id;
    }

    public function canUserAccess(?User $user): bool
    {
        if ($this->isOwner($user)) {
            return true;
        }

        // Jika karya milik kelas, semua anggota kelas memiliki akses
        if ($this->classroom_id && $user !== null) {
            $classroom = $this->classroom ?? Classroom::find($this->classroom_id);
            if ($classroom && $classroom->users()->where('users.id', $user->id)->exists()) {
                return true;
            }
        }

        if ($this->share_type === self::SHARE_PUBLIC) {
            return $user !== null;
        }

        if ($this->share_type === self::SHARE_SPECIFIC && $user !== null) {
            return $this->collaborators()->where('email', strtolower($user->email))->exists();
        }

        return false;
    }

    public function canUserCollaborate(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        // Anggota kelas otomatis boleh berkolaborasi pada karya kelas tanpa langganan
        if ($this->classroom_id) {
            return $this->canUserAccess($user);
        }

        if (! $user->hasActiveSubscription()) {
            return false;
        }

        return $this->canUserAccess($user);
    }

    public function canUserEdit(?User $user): bool
    {
        if ($this->isOwner($user)) {
            return true;
        }

        return $this->canUserCollaborate($user);
    }

    public function ensureShareToken(): string
    {
        if (empty($this->share_token)) {
            $this->share_token = Str::random(32);
            $this->save();
        }

        return $this->share_token;
    }
}
