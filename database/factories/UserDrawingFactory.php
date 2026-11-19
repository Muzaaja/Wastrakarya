<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserDrawing;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<UserDrawing>
 */
class UserDrawingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'motif' => 'kawung',
            'wax_color' => '#CDB988',
            'wax_color_name' => 'Emas tua',
            'fabric_color' => '#F5EFEB',
            'canting_size' => 3.5,
            'data_url' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'pencil_data_url' => 'data:image/png;base64,pencil-layer',
            'wax_data_url' => 'data:image/png;base64,wax-layer',
            'share_type' => UserDrawing::SHARE_PRIVATE,
            'share_token' => Str::random(32),
        ];
    }
}
