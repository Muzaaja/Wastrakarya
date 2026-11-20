<?php

namespace Tests\Feature;

use App\Events\CanvasUpdated;
use App\Models\User;
use App\Models\UserDrawing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CanvasCollaborationTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_canvas_defaults_to_tanpa_pola_without_tiling(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/canvas');

        $drawing = UserDrawing::query()->where('user_id', $user->id)->sole();

        $response->assertRedirect(route('canvas.show', $drawing));
        $this->assertSame('polos', $drawing->motif);
        $this->assertFalse($drawing->tile_free_drawing);
    }

    public function test_user_can_create_drawing_with_default_private_share_type(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/user-drawings', [
            'title' => 'Batik Megamendung',
            'motif' => 'megamendung',
            'wax_color' => '#CDB988',
            'wax_color_name' => 'Emas tua',
            'fabric_color' => '#315B74',
            'canting_size' => 3.5,
            'data_url' => 'data:image/png;base64,sample',
            'pencil_data_url' => 'data:image/png;base64,pencil',
            'wax_data_url' => 'data:image/png;base64,wax',
        ]);

        $response->assertCreated()
            ->assertJsonPath('title', 'Batik Megamendung')
            ->assertJsonPath('motif', 'megamendung')
            ->assertJsonPath('fabric_color', '#315B74')
            ->assertJsonPath('canting_size', 3.5)
            ->assertJsonPath('pencil_data_url', 'data:image/png;base64,pencil')
            ->assertJsonPath('wax_data_url', 'data:image/png;base64,wax')
            ->assertJsonPath('share_type', UserDrawing::SHARE_PRIVATE)
            ->assertJsonPath('is_owner', true);

        $this->assertDatabaseHas('user_drawings', [
            'user_id' => $user->id,
            'title' => 'Batik Megamendung',
            'motif' => 'megamendung',
            'fabric_color' => '#315B74',
            'canting_size' => 3.5,
            'pencil_data_url' => 'data:image/png;base64,pencil',
            'wax_data_url' => 'data:image/png;base64,wax',
            'share_type' => UserDrawing::SHARE_PRIVATE,
        ]);
    }

    public function test_saved_artwork_layers_are_loaded_again(): void
    {
        $owner = User::factory()->create();
        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'pencil_data_url' => null,
            'wax_data_url' => null,
        ]);

        $this->actingAs($owner)
            ->putJson("/api/user-drawings/{$drawing->id}", [
                'data_url' => 'data:image/png;base64,composite',
                'pencil_data_url' => 'data:image/png;base64,pencil-layer',
                'wax_data_url' => 'data:image/png;base64,wax-layer',
            ])
            ->assertOk()
            ->assertJsonPath('pencil_data_url', 'data:image/png;base64,pencil-layer')
            ->assertJsonPath('wax_data_url', 'data:image/png;base64,wax-layer');

        $this->actingAs($owner)
            ->get("/canvas/{$drawing->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('WastraCanvas')
                ->where('initialDrawing.data_url', 'data:image/png;base64,composite')
                ->where('initialDrawing.pencil_data_url', 'data:image/png;base64,pencil-layer')
                ->where('initialDrawing.wax_data_url', 'data:image/png;base64,wax-layer'));
    }

    public function test_drawing_list_omits_editable_layers_until_selected(): void
    {
        $owner = User::factory()->create();
        UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'pencil_data_url' => 'data:image/png;base64,large-pencil-layer',
            'wax_data_url' => 'data:image/png;base64,large-wax-layer',
        ]);

        $this->actingAs($owner)
            ->getJson('/api/user-drawings')
            ->assertOk()
            ->assertJsonMissingPath('own.0.pencil_data_url')
            ->assertJsonMissingPath('own.0.wax_data_url')
            ->assertJsonPath('own.0.data_url', UserDrawing::query()->value('data_url'));
    }

    public function test_drawing_list_returns_own_drawings_newest_first(): void
    {
        $owner = User::factory()->create();
        $olderDrawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'updated_at' => now()->subDay(),
        ]);
        $newerDrawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'updated_at' => now(),
        ]);

        $this->actingAs($owner)
            ->getJson('/api/user-drawings')
            ->assertOk()
            ->assertJsonPath('own.0.id', $newerDrawing->id)
            ->assertJsonPath('own.1.id', $olderDrawing->id);
    }

    public function test_legacy_composite_update_discards_stale_editable_layers(): void
    {
        $owner = User::factory()->create();
        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'pencil_data_url' => 'data:image/png;base64,stale-pencil',
            'wax_data_url' => 'data:image/png;base64,stale-wax',
        ]);

        $this->actingAs($owner)
            ->putJson("/api/user-drawings/{$drawing->id}", [
                'data_url' => 'data:image/png;base64,legacy-composite-update',
            ])
            ->assertOk()
            ->assertJsonPath('data_url', 'data:image/png;base64,legacy-composite-update')
            ->assertJsonPath('pencil_data_url', null)
            ->assertJsonPath('wax_data_url', null);

        $this->assertDatabaseHas('user_drawings', [
            'id' => $drawing->id,
            'data_url' => 'data:image/png;base64,legacy-composite-update',
            'pencil_data_url' => null,
            'wax_data_url' => null,
        ]);
    }

    public function test_saved_motif_is_applied_when_drawing_is_loaded_again(): void
    {
        $owner = User::factory()->create();
        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'motif' => 'kawung',
        ]);

        $this->actingAs($owner)
            ->putJson("/api/user-drawings/{$drawing->id}", [
                'motif' => 'parang',
                'data_url' => 'data:image/png;base64,saved_with_parang',
            ])
            ->assertOk()
            ->assertJsonPath('motif', 'parang');

        $this->actingAs($owner)
            ->get("/canvas/{$drawing->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('WastraCanvas')
                ->where('initialDrawing.motif', 'parang'));
    }

    public function test_tanpa_pola_tiling_preference_is_applied_when_drawing_is_loaded_again(): void
    {
        $owner = User::factory()->create();
        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'motif' => 'polos',
            'tile_free_drawing' => false,
        ]);

        $this->actingAs($owner)
            ->putJson("/api/user-drawings/{$drawing->id}", [
                'tile_free_drawing' => true,
            ])
            ->assertOk()
            ->assertJsonPath('tile_free_drawing', true);

        $this->actingAs($owner)
            ->get("/canvas/{$drawing->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('WastraCanvas')
                ->where('initialDrawing.motif', 'polos')
                ->where('initialDrawing.tile_free_drawing', true));
    }

    public function test_saved_fabric_color_is_applied_when_drawing_is_loaded_again(): void
    {
        $owner = User::factory()->create();
        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'fabric_color' => '#F5EFEB',
        ]);

        $this->actingAs($owner)
            ->putJson("/api/user-drawings/{$drawing->id}", [
                'fabric_color' => '#315B74',
            ])
            ->assertOk()
            ->assertJsonPath('fabric_color', '#315B74');

        $this->actingAs($owner)
            ->get("/canvas/{$drawing->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('WastraCanvas')
                ->where('initialDrawing.fabric_color', '#315B74'));
    }

    public function test_update_rejects_invalid_fabric_color_with_422(): void
    {
        $owner = User::factory()->create();
        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'fabric_color' => '#F5EFEB',
        ]);

        $this->actingAs($owner)
            ->putJson("/api/user-drawings/{$drawing->id}", [
                'fabric_color' => 'biru nila',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('fabric_color');

        $this->assertDatabaseHas('user_drawings', [
            'id' => $drawing->id,
            'fabric_color' => '#F5EFEB',
        ]);
    }

    public function test_private_drawing_cannot_be_accessed_by_other_users(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'share_type' => UserDrawing::SHARE_PRIVATE,
        ]);

        // Owner can access
        $this->actingAs($owner)
            ->getJson("/api/user-drawings/{$drawing->id}")
            ->assertOk();

        // Other user is forbidden
        $this->actingAs($otherUser)
            ->getJson("/api/user-drawings/{$drawing->id}")
            ->assertForbidden();
    }

    public function test_unpermitted_user_sees_canvas_forbidden_page(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'share_type' => UserDrawing::SHARE_PRIVATE,
        ]);

        $this->actingAs($otherUser)
            ->get("/canvas/{$drawing->id}")
            ->assertForbidden()
            ->assertInertia(fn (Assert $page) => $page
                ->component('CanvasForbidden')
                ->where('message', 'Anda tidak memiliki izin untuk membuka kanvas ini.')
                ->missing('initialDrawing'));
    }

    public function test_subscribed_collaborator_can_access_but_cannot_save_public_drawing(): void
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->subscribed()->create();

        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'share_type' => UserDrawing::SHARE_PUBLIC,
        ]);

        // Collaborator can access
        $this->actingAs($collaborator)
            ->getJson("/api/user-drawings/{$drawing->id}")
            ->assertOk()
            ->assertJsonPath('is_owner', false)
            ->assertJsonPath('owner.name', $owner->name);

        $this->actingAs($collaborator)
            ->get("/canvas/{$drawing->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('WastraCanvas')
                ->where('initialDrawing.is_owner', false)
                ->where('initialDrawing.owner.name', $owner->name));

        $this->actingAs($collaborator)
            ->putJson("/api/user-drawings/{$drawing->id}", [
                'data_url' => 'data:image/png;base64,updated_by_collaborator',
                'motif' => 'parang',
            ])
            ->assertForbidden()
            ->assertJsonPath('message', 'Hanya pemilik kanvas yang dapat menyimpan perubahan.');

        $this->assertDatabaseHas('user_drawings', [
            'id' => $drawing->id,
            'data_url' => $drawing->data_url,
            'motif' => $drawing->motif,
        ]);
    }

    public function test_specific_users_drawing_accessible_only_by_invited_emails(): void
    {
        $owner = User::factory()->create();
        $invitedUser = User::factory()->subscribed()->create(['email' => 'collaborator@example.com']);
        $uninvitedUser = User::factory()->create(['email' => 'stranger@example.com']);

        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'share_type' => UserDrawing::SHARE_SPECIFIC,
        ]);

        $drawing->collaborators()->create([
            'email' => 'collaborator@example.com',
            'user_id' => $invitedUser->id,
        ]);

        // Invited user can access
        $this->actingAs($invitedUser)
            ->getJson("/api/user-drawings/{$drawing->id}")
            ->assertOk();

        // Uninvited user is forbidden
        $this->actingAs($uninvitedUser)
            ->getJson("/api/user-drawings/{$drawing->id}")
            ->assertForbidden();
    }

    public function test_owner_can_update_share_type(): void
    {
        $owner = User::factory()->subscribed()->create();
        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'share_type' => UserDrawing::SHARE_PRIVATE,
        ]);

        // Change to public
        $this->actingAs($owner)
            ->putJson("/api/user-drawings/{$drawing->id}/share", [
                'share_type' => UserDrawing::SHARE_PUBLIC,
            ])
            ->assertOk()
            ->assertJsonPath('share_type', UserDrawing::SHARE_PUBLIC);

        $this->assertDatabaseHas('user_drawings', [
            'id' => $drawing->id,
            'share_type' => UserDrawing::SHARE_PUBLIC,
        ]);

        // Change to specific_users
        $this->actingAs($owner)
            ->putJson("/api/user-drawings/{$drawing->id}/share", [
                'share_type' => UserDrawing::SHARE_SPECIFIC,
            ])
            ->assertOk()
            ->assertJsonPath('share_type', UserDrawing::SHARE_SPECIFIC);
    }

    public function test_setting_shared_drawing_to_private_broadcasts_collaborator_disconnect(): void
    {
        $owner = User::factory()->subscribed()->create();
        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'share_type' => UserDrawing::SHARE_PUBLIC,
        ]);
        Event::fake([CanvasUpdated::class]);

        $this->actingAs($owner)
            ->putJson("/api/user-drawings/{$drawing->id}/share", [
                'share_type' => UserDrawing::SHARE_PRIVATE,
            ])
            ->assertOk()
            ->assertJsonPath('share_type', UserDrawing::SHARE_PRIVATE);

        $this->assertDatabaseHas('user_drawings', [
            'id' => $drawing->id,
            'share_type' => UserDrawing::SHARE_PRIVATE,
        ]);

        Event::assertDispatched(
            CanvasUpdated::class,
            function (CanvasUpdated $event) use ($drawing, $owner): bool {
                $payload = $event->broadcastWith();

                return $event->drawing->is($drawing)
                    && $event->userId === $owner->id
                    && $event->action === 'share_type_changed'
                    && $payload['share_type'] === UserDrawing::SHARE_PRIVATE
                    && $payload['disconnect_collaborators'] === true;
            }
        );
    }

    public function test_non_private_share_change_does_not_broadcast_collaborator_disconnect(): void
    {
        $owner = User::factory()->subscribed()->create();
        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'share_type' => UserDrawing::SHARE_PRIVATE,
        ]);
        Event::fake([CanvasUpdated::class]);

        $this->actingAs($owner)
            ->putJson("/api/user-drawings/{$drawing->id}/share", [
                'share_type' => UserDrawing::SHARE_PUBLIC,
            ])
            ->assertOk()
            ->assertJsonPath('share_type', UserDrawing::SHARE_PUBLIC);

        $this->assertDatabaseHas('user_drawings', [
            'id' => $drawing->id,
            'share_type' => UserDrawing::SHARE_PUBLIC,
        ]);

        Event::assertDispatched(
            CanvasUpdated::class,
            fn (CanvasUpdated $event): bool => $event->broadcastWith()['disconnect_collaborators'] === false
        );
    }

    public function test_setting_shared_drawing_to_specific_users_broadcasts_authorized_collaborator_ids(): void
    {
        $owner = User::factory()->subscribed()->create();
        $invitedUser = User::factory()->subscribed()->create([
            'email' => 'invited@example.com',
        ]);
        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'share_type' => UserDrawing::SHARE_PUBLIC,
        ]);
        $drawing->collaborators()->create([
            'email' => $invitedUser->email,
            'user_id' => null,
        ]);
        Event::fake([CanvasUpdated::class]);

        $this->actingAs($owner)
            ->putJson("/api/user-drawings/{$drawing->id}/share", [
                'share_type' => UserDrawing::SHARE_SPECIFIC,
            ])
            ->assertOk()
            ->assertJsonPath('share_type', UserDrawing::SHARE_SPECIFIC);

        $this->assertDatabaseHas('user_drawings', [
            'id' => $drawing->id,
            'share_type' => UserDrawing::SHARE_SPECIFIC,
        ]);

        Event::assertDispatched(
            CanvasUpdated::class,
            function (CanvasUpdated $event) use ($invitedUser): bool {
                $payload = $event->broadcastWith();

                return $event->action === 'share_type_changed'
                    && $payload['share_type'] === UserDrawing::SHARE_SPECIFIC
                    && $payload['authorized_collaborator_ids'] === [$invitedUser->id];
            }
        );
    }

    public function test_removing_email_collaborator_broadcasts_remaining_authorized_collaborator_ids(): void
    {
        $owner = User::factory()->subscribed()->create();
        $removedUser = User::factory()->subscribed()->create([
            'email' => 'removed@example.com',
        ]);
        $remainingUser = User::factory()->subscribed()->create([
            'email' => 'remaining@example.com',
        ]);
        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'share_type' => UserDrawing::SHARE_SPECIFIC,
        ]);
        $removedCollaborator = $drawing->collaborators()->create([
            'email' => $removedUser->email,
            'user_id' => $removedUser->id,
        ]);
        $drawing->collaborators()->create([
            'email' => $remainingUser->email,
            'user_id' => $remainingUser->id,
        ]);
        Event::fake([CanvasUpdated::class]);

        $this->actingAs($owner)
            ->deleteJson("/api/user-drawings/{$drawing->id}/collaborators/{$removedCollaborator->id}")
            ->assertOk();

        $this->assertDatabaseMissing('user_drawing_collaborators', [
            'id' => $removedCollaborator->id,
        ]);

        Event::assertDispatched(
            CanvasUpdated::class,
            function (CanvasUpdated $event) use ($remainingUser): bool {
                $payload = $event->broadcastWith();

                return $event->action === 'collaborator_removed'
                    && $payload['share_type'] === UserDrawing::SHARE_SPECIFIC
                    && $payload['authorized_collaborator_ids'] === [$remainingUser->id];
            }
        );
    }

    public function test_owner_can_add_and_remove_collaborator_by_email(): void
    {
        $owner = User::factory()->subscribed()->create();
        $friend = User::factory()->create(['email' => 'friend@example.com']);

        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'share_type' => UserDrawing::SHARE_SPECIFIC,
        ]);

        // Add collaborator
        $response = $this->actingAs($owner)
            ->postJson("/api/user-drawings/{$drawing->id}/collaborators", [
                'email' => 'friend@example.com',
            ])
            ->assertOk();

        $collaboratorId = $response->json('collaborator.id');

        $this->assertDatabaseHas('user_drawing_collaborators', [
            'user_drawing_id' => $drawing->id,
            'email' => 'friend@example.com',
            'user_id' => $friend->id,
        ]);

        // Remove collaborator
        $this->actingAs($owner)
            ->deleteJson("/api/user-drawings/{$drawing->id}/collaborators/{$collaboratorId}")
            ->assertOk();

        $this->assertDatabaseMissing('user_drawing_collaborators', [
            'id' => $collaboratorId,
        ]);
    }

    public function test_non_owner_cannot_modify_sharing_settings(): void
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->create(['email' => 'collab@example.com']);

        $drawing = UserDrawing::factory()->create([
            'user_id' => $owner->id,
            'share_type' => UserDrawing::SHARE_PUBLIC,
        ]);

        // Attempt to change share type
        $this->actingAs($collaborator)
            ->putJson("/api/user-drawings/{$drawing->id}/share", [
                'share_type' => UserDrawing::SHARE_PRIVATE,
            ])
            ->assertForbidden();

        // Attempt to add collaborator
        $this->actingAs($collaborator)
            ->postJson("/api/user-drawings/{$drawing->id}/collaborators", [
                'email' => 'someone@example.com',
            ])
            ->assertForbidden();
    }
}
