<?php

namespace App\Http\Controllers;

use App\Models\UserDrawing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class MockupController extends Controller
{
    public function index(Request $request): RedirectResponse|Response
    {
        $drawing = $request->user()?->drawings()
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if ($drawing) {
            return redirect()->route('mockup.show', ['drawing' => $drawing]);
        }

        return Inertia::render('WastraMockup', [
            'initialDrawing' => null,
            'mockupId' => null,
        ]);
    }

    public function show(Request $request, UserDrawing $drawing): Response|HttpResponse
    {
        if (! $drawing->canUserAccess($request->user())) {
            return Inertia::render('CanvasForbidden', [
                'message' => 'Anda tidak memiliki izin untuk membuka mockup karya ini.',
            ])->toResponse($request)->setStatusCode(HttpResponse::HTTP_FORBIDDEN);
        }

        return Inertia::render('WastraMockup', [
            'initialDrawing' => [
                'id' => $drawing->id,
                'user_id' => $drawing->user_id,
                'title' => $drawing->title,
                'motif' => $drawing->motif,
                'fabric_color' => $drawing->fabric_color,
                'data_url' => $drawing->data_url,
                'updated_at' => $drawing->updated_at?->toISOString(),
            ],
            'mockupId' => $drawing->id,
        ]);
    }
}
