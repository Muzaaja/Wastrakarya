<?php

namespace App\Http\Controllers;

use App\Models\UserDrawing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class CanvasController extends Controller
{
    /**
     * Endpoint utama /canvas.
     * Mengarahkan ke kanvas dengan ID khusus (seperti Google Docs / Canva).
     */
    public function index(Request $request): RedirectResponse|Response
    {
        // Kompatibilitas query string lama: ?drawing=ID atau ?share=TOKEN
        if ($request->filled('drawing')) {
            return redirect()->route('canvas.show', ['drawing' => $request->query('drawing')]);
        }

        if ($request->filled('share')) {
            return redirect()->route('canvas.show', ['drawing' => $request->query('share')]);
        }

        $user = $request->user();

        // Jika sudah login, buatkan kanvas baru dengan ID unik (seperti Google Docs / Canva)
        if ($user) {
            $drawing = $user->drawings()->create([
                'title' => 'Karya tanpa judul',
                'motif' => 'kawung',
                'wax_color' => '#CDB988',
                'wax_color_name' => 'Emas tua',
                'fabric_color' => '#F5EFEB',
                'canting_size' => 3.5,
                'data_url' => '',
                'pencil_data_url' => null,
                'wax_data_url' => null,
                'share_type' => UserDrawing::SHARE_PRIVATE,
                'share_token' => Str::random(32),
            ]);

            return redirect()->route('canvas.show', ['drawing' => $drawing->id]);
        }

        // Pengguna tamu tanpa ID kanvas
        return Inertia::render('WastraCanvas', [
            'initialDrawing' => null,
            'canvasId' => null,
        ]);
    }

    /**
     * Buka kanvas dengan link tersendiri /canvas/{drawing}
     */
    public function show(Request $request, string $drawing): Response|HttpResponse
    {
        $user = $request->user();

        $item = is_numeric($drawing)
            ? UserDrawing::with(['user:id,name,email', 'collaborators.user:id,name,email'])->find($drawing)
            : UserDrawing::with(['user:id,name,email', 'collaborators.user:id,name,email'])->where('share_token', $drawing)->first();

        if (! $item) {
            abort(404, 'Karya tidak ditemukan.');
        }

        // Cek izin akses
        if (! $item->canUserAccess($user)) {
            return Inertia::render('CanvasForbidden', [
                'message' => 'Anda tidak memiliki izin untuk membuka kanvas ini.',
            ])->toResponse($request)->setStatusCode(HttpResponse::HTTP_FORBIDDEN);
        }

        $isOwner = $item->isOwner($user);
        $canCollaborate = $item->canUserCollaborate($user);

        $formatted = [
            'id' => $item->id,
            'user_id' => $item->user_id,
            'title' => $item->title,
            'motif' => $item->motif,
            'wax_color' => $item->wax_color,
            'wax_color_name' => $item->wax_color_name,
            'fabric_color' => $item->fabric_color,
            'canting_size' => $item->canting_size,
            'data_url' => $item->data_url,
            'pencil_data_url' => $item->pencil_data_url,
            'wax_data_url' => $item->wax_data_url,
            'updated_at' => $item->updated_at?->toISOString(),
            'share_type' => $item->share_type ?? UserDrawing::SHARE_PRIVATE,
            'share_token' => $item->share_token,
            'share_url' => url('/canvas/'.$item->id),
            'is_owner' => $isOwner,
            'can_collaborate' => $canCollaborate,
            'owner' => $item->user ? [
                'id' => $item->user->id,
                'name' => $item->user->name,
                'email' => $item->user->email,
            ] : null,
            'collaborators' => $item->collaborators->map(fn ($c) => [
                'id' => $c->id,
                'email' => $c->email,
                'user_id' => $c->user_id,
                'name' => $c->user?->name,
                'registered' => $c->user_id !== null,
            ]),
        ];

        return Inertia::render('WastraCanvas', [
            'initialDrawing' => $formatted,
            'canvasId' => $item->id,
        ]);
    }
}
