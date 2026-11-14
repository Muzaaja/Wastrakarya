<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserDrawingController;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (Request $request) {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
        'drawings' => $request->user()
            ? $request->user()->drawings()->latest()->get(['id', 'title', 'motif', 'data_url', 'updated_at'])
            : [],
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/canvas', function () {
    return Inertia::render('WastraCanvas');
})->name('canvas');

Route::get('/mockup', function () {
    return Inertia::render('WastraMockup');
})->name('mockup');

Route::middleware('auth')->prefix('api/user-drawings')->name('api.user-drawings.')->group(function () {
    Route::get('/', [UserDrawingController::class, 'index']);
    Route::post('/', [UserDrawingController::class, 'store']);
    Route::get('/{drawing}', [UserDrawingController::class, 'show']);
    Route::put('/{drawing}', [UserDrawingController::class, 'update']);
    Route::delete('/{drawing}', [UserDrawingController::class, 'destroy']);
});

require __DIR__.'/auth.php';
