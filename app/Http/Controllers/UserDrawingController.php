<?php

namespace App\Http\Controllers;

use App\Models\UserDrawing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class UserDrawingController extends Controller
{
    public function index()
    {
        return response()->json(
            Auth::user()->drawings()->get()
        );
    }

    public function store(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'motif' => ['nullable', 'string', 'max:255'],
            'wax_color' => ['nullable', 'string', 'max:255'],
            'wax_color_name' => ['nullable', 'string', 'max:255'],
            'canting_size' => ['nullable', 'integer'],
            'data_url' => ['required', 'string'],
        ])->validate();

        $drawing = Auth::user()->drawings()->create($validated);

        return response()->json($drawing, 201);
    }

    public function show($id)
    {
        $drawing = Auth::user()->drawings()->findOrFail($id);

        return response()->json($drawing);
    }

    public function update(Request $request, $id)
    {
        $drawing = Auth::user()->drawings()->findOrFail($id);

        $validated = Validator::make($request->all(), [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'motif' => ['nullable', 'string', 'max:255'],
            'wax_color' => ['nullable', 'string', 'max:255'],
            'wax_color_name' => ['nullable', 'string', 'max:255'],
            'canting_size' => ['nullable', 'integer'],
            'data_url' => ['sometimes', 'required', 'string'],
        ])->validate();

        $drawing->update($validated);

        return response()->json($drawing);
    }

    public function destroy($id)
    {
        $drawing = Auth::user()->drawings()->findOrFail($id);

        $drawing->delete();

        return response()->json(['message' => 'Karya berhasil dihapus.']);
    }
}
