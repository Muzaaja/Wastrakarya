<?php

namespace App\Events;

use App\Models\UserDrawing;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CanvasUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<string, mixed>  $extra
     * @param  array<int, int>  $authorizedCollaboratorIds
     */
    public function __construct(
        public UserDrawing $drawing,
        public int $userId,
        public string $userName,
        public string $action = 'saved',
        public array $extra = [],
        public array $authorizedCollaboratorIds = []
    ) {}

    /**
     * @return array<int, PresenceChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('canvas.'.$this->drawing->id),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'drawing_id' => $this->drawing->id,
            'user_id' => $this->userId,
            'user_name' => $this->userName,
            'action' => $this->action,
            'title' => $this->drawing->title,
            'motif' => $this->drawing->motif,
            'wax_color' => $this->drawing->wax_color,
            'share_type' => $this->drawing->share_type,
            'disconnect_collaborators' => $this->action === 'share_type_changed'
                && $this->drawing->share_type === UserDrawing::SHARE_PRIVATE,
            'authorized_collaborator_ids' => $this->authorizedCollaboratorIds,
            'updated_at' => $this->drawing->updated_at?->toISOString(),
            'extra' => $this->extra,
        ];
    }
}
