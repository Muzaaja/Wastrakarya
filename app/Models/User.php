<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'is_admin', 'is_subscribed', 'subscription_expires_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * @var array<int, string>
     */
    protected $appends = [
        'has_active_subscription',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'is_subscribed' => 'boolean',
            'subscription_expires_at' => 'datetime',
        ];
    }

    public function hasActiveSubscription(): bool
    {
        if (! $this->is_subscribed) {
            return false;
        }

        if ($this->subscription_expires_at !== null && $this->subscription_expires_at->isPast()) {
            return false;
        }

        return true;
    }

    public function getHasActiveSubscriptionAttribute(): bool
    {
        return $this->hasActiveSubscription();
    }

    /**
     * @return HasMany<UserDrawing, User>
     */
    public function drawings(): HasMany
    {
        return $this->hasMany(UserDrawing::class)->latest();
    }

    /**
     * @return HasMany<UserDrawingCollaborator, User>
     */
    public function collaborations(): HasMany
    {
        return $this->hasMany(UserDrawingCollaborator::class);
    }

    public function classrooms(): BelongsToMany
    {
        return $this->belongsToMany(Classroom::class)->withTimestamps();
    }
}
