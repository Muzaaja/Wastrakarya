<?php

namespace App\Http\Controllers;

use App\Events\CanvasUpdated;
use App\Models\User;
use App\Models\UserDrawing;
use App\Models\UserDrawingCollaborator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserDrawingController extends Controller
{
    public function index(): JsonResponse
    {
        $user = Auth::user();
        $listColumns = [
            'id',
            'user_id',
            'title',
            'motif',
            'wax_color',
            'wax_color_name',
            'fabric_color',
            'canting_size',
            'data_url',
            'share_type',
            'share_token',
            'created_at',
            'updated_at',
        ];

        // Karya milik pengguna sendiri
        $ownDrawings = $user->drawings()
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get($listColumns);

        // Karya yang dibagikan khusus ke pengguna ini
        $sharedDrawings = UserDrawing::query()
            ->select($listColumns)
            ->where('user_id', '!=', $user->id)
            ->where(function ($query) use ($user): void {
                $query->where('share_type', UserDrawing::SHARE_PUBLIC)
                    ->orWhere(function ($q) use ($user): void {
                        $q->where('share_type', UserDrawing::SHARE_SPECIFIC)
                            ->whereHas('collaborators', function ($sub) use ($user): void {
                                $sub->where('email', strtolower($user->email));
                            });
                    });
            })
            ->with('user:id,name,email')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'own' => $ownDrawings,
            'shared' => $sharedDrawings,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'motif' => ['nullable', 'string', 'max:255'],
            'wax_color' => ['nullable', 'string', 'max:255'],
            'wax_color_name' => ['nullable', 'string', 'max:255'],
            'fabric_color' => ['nullable', 'hex_color'],
            'canting_size' => ['nullable', 'numeric', 'min:0.1', 'max:99.99'],
            'data_url' => ['required', 'string'],
            'pencil_data_url' => ['nullable', 'string'],
            'wax_data_url' => ['nullable', 'string'],
            'share_type' => ['nullable', 'string', 'in:private,public,specific_users'],
        ])->validate();

        $validated['share_type'] = $validated['share_type'] ?? UserDrawing::SHARE_PRIVATE;
        $validated['share_token'] = Str::random(32);

        $drawing = Auth::user()->drawings()->create($validated);

        return response()->json($this->formatDrawingResponse($drawing), 201);
    }

    public function show(string $id): JsonResponse
    {
        $drawing = is_numeric($id)
            ? UserDrawing::with(['collaborators.user:id,name,email', 'user:id,name,email'])->find($id)
            : UserDrawing::with(['collaborators.user:id,name,email', 'user:id,name,email'])->where('share_token', $id)->first();

        if (! $drawing) {
            return response()->json(['message' => 'Karya tidak ditemukan.'], 404);
        }

        $user = Auth::user();
        if (! $drawing->canUserAccess($user)) {
            return response()->json(['message' => 'Anda tidak memiliki akses ke karya ini.'], 403);
        }

        // Kolaborator yang mengakses kanvas bersama harus memiliki langganan aktif (kecuali kanvas bersama kelas)
        if (! $drawing->classroom_id && ! $drawing->isOwner($user) && ! $user->hasActiveSubscription()) {
            return response()->json([
                'message' => 'Fitur kolaborasi memerlukan akun dengan paket langganan aktif.',
                'requires_subscription' => true,
            ], 403);
        }

        return response()->json($this->formatDrawingResponse($drawing));
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $drawing = is_numeric($id)
            ? UserDrawing::find($id)
            : UserDrawing::where('share_token', $id)->first();

        if (! $drawing) {
            return response()->json(['message' => 'Karya tidak ditemukan.'], 404);
        }

        $user = Auth::user();
        if (! $drawing->canUserEdit($user)) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk menyimpan perubahan pada kanvas ini.'], 403);
        }

        $rules = [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'motif' => ['nullable', 'string', 'max:255'],
            'wax_color' => ['nullable', 'string', 'max:255'],
            'wax_color_name' => ['nullable', 'string', 'max:255'],
            'fabric_color' => ['nullable', 'hex_color'],
            'canting_size' => ['nullable', 'numeric', 'min:0.1', 'max:99.99'],
            'data_url' => ['sometimes', 'required', 'string'],
            'pencil_data_url' => ['nullable', 'string'],
            'wax_data_url' => ['nullable', 'string'],
        ];

        $validated = Validator::make($request->all(), $rules)->validate();

        if (array_key_exists('data_url', $validated)) {
            $validated['pencil_data_url'] = $validated['pencil_data_url'] ?? null;
            $validated['wax_data_url'] = $validated['wax_data_url'] ?? null;
        }

        $drawing->update($validated);

        // Siarkan pembaruan ke kanvas kolaborasi secara realtime (abaikan jika server broadcast/reverb offline)
        try {
            broadcast(new CanvasUpdated(
                drawing: $drawing,
                userId: $user->id,
                userName: $user->name,
                action: 'updated'
            ))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json($this->formatDrawingResponse($drawing));
    }

    public function destroy(string $id): JsonResponse
    {
        $drawing = is_numeric($id)
            ? UserDrawing::find($id)
            : UserDrawing::where('share_token', $id)->first();

        if (! $drawing) {
            return response()->json(['message' => 'Karya tidak ditemukan.'], 404);
        }

        $user = Auth::user();
        if (! $drawing->canUserDelete($user)) {
            return response()->json(['message' => 'Hanya pemilik atau admin kelas yang dapat menghapus karya ini.'], 403);
        }

        $drawing->delete();

        return response()->json(['message' => 'Karya berhasil dihapus.']);
    }

    public function updateShare(Request $request, string $id): JsonResponse
    {
        $drawing = is_numeric($id)
            ? UserDrawing::find($id)
            : UserDrawing::where('share_token', $id)->first();

        if (! $drawing) {
            return response()->json(['message' => 'Karya tidak ditemukan.'], 404);
        }

        $user = Auth::user();
        if (! $drawing->isOwner($user)) {
            return response()->json(['message' => 'Hanya pemilik karya yang dapat mengatur pembagian.'], 403);
        }

        if (! $user->hasActiveSubscription()) {
            return response()->json([
                'message' => 'Fitur kolaborasi dan berbagi kanvas hanya tersedia untuk pengguna dengan paket langganan aktif.',
                'requires_subscription' => true,
            ], 403);
        }

        $validated = Validator::make($request->all(), [
            'share_type' => ['required', 'string', 'in:private,public,specific_users'],
        ])->validate();

        $drawing->share_type = $validated['share_type'];
        $drawing->ensureShareToken();
        $drawing->save();

        $authorizedCollaboratorIds = $drawing->share_type === UserDrawing::SHARE_SPECIFIC
            ? $this->authorizedCollaboratorIds($drawing)
            : [];

        try {
            broadcast(new CanvasUpdated(
                drawing: $drawing,
                userId: $user->id,
                userName: $user->name,
                action: 'share_type_changed',
                extra: ['share_type' => $drawing->share_type],
                authorizedCollaboratorIds: $authorizedCollaboratorIds
            ))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json($this->formatDrawingResponse($drawing));
    }

    public function getCollaborators(string $id): JsonResponse
    {
        $drawing = is_numeric($id)
            ? UserDrawing::with(['collaborators.user:id,name,email', 'user:id,name,email'])->find($id)
            : UserDrawing::with(['collaborators.user:id,name,email', 'user:id,name,email'])->where('share_token', $id)->first();

        if (! $drawing) {
            return response()->json(['message' => 'Karya tidak ditemukan.'], 404);
        }

        $user = Auth::user();
        if (! $drawing->canUserAccess($user)) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        return response()->json([
            'drawing_id' => $drawing->id,
            'is_owner' => $drawing->isOwner($user),
            'share_type' => $drawing->share_type ?? UserDrawing::SHARE_PRIVATE,
            'share_token' => $drawing->share_token,
            'share_url' => url('/canvas/'.$drawing->id),
            'owner' => [
                'id' => $drawing->user->id,
                'name' => $drawing->user->name,
                'email' => $drawing->user->email,
            ],
            'collaborators' => $drawing->collaborators->map(fn (UserDrawingCollaborator $c) => [
                'id' => $c->id,
                'email' => $c->email,
                'user_id' => $c->user_id,
                'name' => $c->user?->name,
                'registered' => $c->user_id !== null,
            ]),
        ]);
    }

    public function addCollaborator(Request $request, string $id): JsonResponse
    {
        $drawing = is_numeric($id)
            ? UserDrawing::find($id)
            : UserDrawing::where('share_token', $id)->first();

        if (! $drawing) {
            return response()->json(['message' => 'Karya tidak ditemukan.'], 404);
        }

        $user = Auth::user();
        if (! $drawing->isOwner($user)) {
            return response()->json(['message' => 'Hanya pemilik yang dapat menambahkan kolaborator.'], 403);
        }

        if (! $user->hasActiveSubscription()) {
            return response()->json([
                'message' => 'Fitur mengundang kolaborator hanya tersedia untuk pengguna dengan paket langganan aktif.',
                'requires_subscription' => true,
            ], 403);
        }

        $validated = Validator::make($request->all(), [
            'email' => ['required', 'email', 'max:255'],
        ])->validate();

        $email = strtolower(trim($validated['email']));

        if ($email === strtolower($user->email)) {
            return response()->json(['message' => 'Anda adalah pemilik karya ini.'], 422);
        }

        // Cari user yang sudah terdaftar dengan email ini
        $invitedUser = User::where('email', $email)->first();

        $collaborator = $drawing->collaborators()->firstOrCreate(
            ['email' => $email],
            ['user_id' => $invitedUser?->id]
        );

        $drawing->ensureShareToken();

        try {
            broadcast(new CanvasUpdated(
                drawing: $drawing,
                userId: $user->id,
                userName: $user->name,
                action: 'collaborator_added',
                extra: ['email' => $email]
            ))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'message' => "Kolaborator {$email} berhasil ditambahkan.",
            'collaborator' => [
                'id' => $collaborator->id,
                'email' => $collaborator->email,
                'user_id' => $collaborator->user_id,
                'name' => $invitedUser?->name,
                'registered' => $invitedUser !== null,
            ],
        ]);
    }

    public function removeCollaborator(string $drawingId, string $collaboratorId): JsonResponse
    {
        $drawing = is_numeric($drawingId)
            ? UserDrawing::find($drawingId)
            : UserDrawing::where('share_token', $drawingId)->first();

        if (! $drawing) {
            return response()->json(['message' => 'Karya tidak ditemukan.'], 404);
        }

        $user = Auth::user();
        if (! $drawing->isOwner($user)) {
            return response()->json(['message' => 'Hanya pemilik yang dapat menghapus kolaborator.'], 403);
        }

        $collaborator = $drawing->collaborators()->where('id', $collaboratorId)->first();
        if (! $collaborator) {
            return response()->json(['message' => 'Kolaborator tidak ditemukan.'], 404);
        }

        $email = $collaborator->email;
        $collaborator->delete();

        $authorizedCollaboratorIds = $drawing->share_type === UserDrawing::SHARE_SPECIFIC
            ? $this->authorizedCollaboratorIds($drawing)
            : [];

        try {
            broadcast(new CanvasUpdated(
                drawing: $drawing,
                userId: $user->id,
                userName: $user->name,
                action: 'collaborator_removed',
                extra: ['email' => $email],
                authorizedCollaboratorIds: $authorizedCollaboratorIds
            ))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['message' => "Kolaborator {$email} berhasil dihapus."]);
    }

    /**
     * @return array<int, int>
     */
    protected function authorizedCollaboratorIds(UserDrawing $drawing): array
    {
        $collaboratorEmails = $drawing->collaborators()->pluck('email');

        if ($collaboratorEmails->isEmpty()) {
            return [];
        }

        return User::query()
            ->whereIn('email', $collaboratorEmails)
            ->pluck('id')
            ->map(static fn (int|string $id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    protected function formatDrawingResponse(UserDrawing $drawing): array
    {
        $user = Auth::user();

        return [
            'id' => $drawing->id,
            'user_id' => $drawing->user_id,
            'title' => $drawing->title,
            'motif' => $drawing->motif,
            'wax_color' => $drawing->wax_color,
            'wax_color_name' => $drawing->wax_color_name,
            'fabric_color' => $drawing->fabric_color,
            'canting_size' => $drawing->canting_size,
            'data_url' => $drawing->data_url,
            'pencil_data_url' => $drawing->pencil_data_url,
            'wax_data_url' => $drawing->wax_data_url,
            'share_type' => $drawing->share_type ?? UserDrawing::SHARE_PRIVATE,
            'share_token' => $drawing->share_token,
            'share_url' => url('/canvas/'.$drawing->id),
            'is_owner' => $drawing->isOwner($user),
            'owner' => $drawing->user ? [
                'id' => $drawing->user->id,
                'name' => $drawing->user->name,
            ] : null,
            'created_at' => $drawing->created_at?->toISOString(),
            'updated_at' => $drawing->updated_at?->toISOString(),
        ];
    }
}
