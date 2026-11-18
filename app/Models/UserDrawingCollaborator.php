<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_drawing_id', 'user_id', 'email'])]
class UserDrawingCollaborator extends Model
{
    /**
     * @return BelongsTo<UserDrawing, UserDrawingCollaborator>
     */
    public function drawing(): BelongsTo
    {
        return $this->belongsTo(UserDrawing::class, 'user_drawing_id');
    }

    /**
     * @return BelongsTo<User, UserDrawingCollaborator>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
