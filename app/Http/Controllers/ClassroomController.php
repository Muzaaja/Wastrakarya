<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\UserDrawing;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClassroomController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $classroom = Classroom::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'code' => strtoupper(Str::random(6)),
        ]);

        $request->user()->classrooms()->attach($classroom->id);

        return back()->with('success', 'Kelas berhasil dibuat!');
    }

    public function join(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $classroom = Classroom::where('code', strtoupper(trim($request->code)))->first();

        if (! $classroom) {
            return back()->withErrors(['code' => 'Kode kelas tidak ditemukan']);
        }

        $request->user()->classrooms()->syncWithoutDetaching([$classroom->id]);

        return back()->with('success', 'Berhasil bergabung ke kelas '.$classroom->name);
    }

    public function show(Request $request, string $code)
    {
        $classroom = Classroom::with([
            'users:id,name,email',
            'owner:id,name',
            'drawings' => fn ($q) => $q->with('user:id,name')->latest(),
        ])
            ->where('code', $code)
            ->firstOrFail();

        $isMember = $classroom->users->contains('id', $request->user()->id);

        if (! $isMember) {
            abort(403, 'Anda bukan anggota kelas ini.');
        }

        $isAdmin = (int) $classroom->user_id === (int) $request->user()->id;

        return inertia('Classroom/Show', [
            'classroom' => $classroom,
            'isAdmin' => $isAdmin,
            'members' => $classroom->users,
            'drawings' => $classroom->drawings,
        ]);
    }

    public function createDrawing(Request $request, string $code)
    {
        $classroom = Classroom::where('code', $code)->firstOrFail();

        $isMember = $classroom->users->contains('id', $request->user()->id);
        if (! $isMember) {
            abort(403, 'Anda bukan anggota kelas ini.');
        }

        $drawing = $request->user()->drawings()->create([
            'classroom_id' => $classroom->id,
            'title' => 'Karya Bersama '.$classroom->name,
            'motif' => 'polos',
            'tile_free_drawing' => false,
            'wax_color' => '#CDB988',
            'wax_color_name' => 'Emas tua',
            'fabric_color' => '#F5EFEB',
            'canting_size' => 3.5,
            'data_url' => '',
            'pencil_data_url' => null,
            'wax_data_url' => null,
            'share_type' => UserDrawing::SHARE_PUBLIC,
            'share_token' => Str::random(32),
        ]);

        return redirect()->route('canvas.show', ['drawing' => $drawing->id]);
    }

    public function destroy(Request $request, string $code)
    {
        $classroom = Classroom::where('code', $code)->firstOrFail();

        if ($classroom->user_id != $request->user()->id) {
            abort(403, 'Hanya pembuat kelas yang dapat menghapus kelas ini.');
        }

        $classroom->delete();

        return redirect('/')->with('success', 'Kelas berhasil dihapus.');
    }
}
