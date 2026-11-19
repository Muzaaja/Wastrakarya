<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserDrawing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MockupControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_open_mockup_without_a_canvas_id(): void
    {
        $this->get('/mockup')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('WastraMockup')
                ->where('initialDrawing', null)
                ->where('mockupId', null));
    }

    public function test_mockup_url_uses_the_latest_canvas_id(): void
    {
        $owner = User::factory()->create();
        UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'updated_at' => now()->subDay(),
        ]);
        $latestDrawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'updated_at' => now(),
        ]);

        $this->actingAs($owner)
            ->get('/mockup')
            ->assertRedirect(route('mockup.show', $latestDrawing));
    }

    public function test_owner_can_open_mockup_using_canvas_id(): void
    {
        $owner = User::factory()->create();
        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'title' => 'Batik Kawung',
            'fabric_color' => '#315B74',
            'updated_at' => '2026-11-19 08:30:00',
        ]);

        $this->actingAs($owner)
            ->get("/mockup/{$drawing->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('WastraMockup')
                ->where('mockupId', $drawing->id)
                ->where('initialDrawing.id', $drawing->id)
                ->where('initialDrawing.title', 'Batik Kawung')
                ->where('initialDrawing.fabric_color', '#315B74')
                ->where('initialDrawing.updated_at', $drawing->updated_at->toISOString()));
    }

    public function test_other_user_cannot_open_private_mockup_using_canvas_id(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'share_type' => UserDrawing::SHARE_PRIVATE,
        ]);

        $this->actingAs($otherUser)
            ->get("/mockup/{$drawing->id}")
            ->assertForbidden()
            ->assertInertia(fn (Assert $page) => $page
                ->component('CanvasForbidden')
                ->where('message', 'Anda tidak memiliki izin untuk membuka mockup karya ini.'));
    }
}
