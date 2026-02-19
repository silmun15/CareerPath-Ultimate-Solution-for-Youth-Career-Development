<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->query('user_id');

        if ($userId) {
            return response()->json(
                Enrollment::where('user_id', $userId)->with('course')->get()
            );
        }

        return response()->json(Enrollment::with('course')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'course_id' => 'required|exists:courses,id',
        ]);

        $existing = Enrollment::where('user_id', $request->user_id)
            ->where('course_id', $request->course_id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Already enrolled'], 409);
        }

        $enrollment = Enrollment::create([
            'user_id' => $request->user_id,
            'course_id' => $request->course_id,
        ]);

        return response()->json($enrollment->load('course'), 201);
    }

    public function destroy($id)
    {
        Enrollment::findOrFail($id)->delete();
        return response()->json(['message' => 'Unenrolled successfully']);
    }
}
