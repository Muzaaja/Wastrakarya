<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'title', 'motif', 'wax_color', 'wax_color_name', 'canting_size', 'data_url'])]
class UserDrawing extends Model
{
    protected $casts = [
        'canting_size' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
