<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Classroom;
use Illuminate\Support\Str;

class ClassroomController extends Controller
{
    public function store(Request $request) 
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $classroom = Classroom::create([
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

        return back()->with('success', 'Berhasil bergabung ke kelas ' . $classroom->name);
    }
}
