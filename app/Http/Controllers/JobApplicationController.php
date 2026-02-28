<?php

namespace App\Http\Controllers;

use App\Models\JobApplication;
use Illuminate\Http\Request;

class JobApplicationController extends Controller
{
    /**
     * List applications — optionally filter by user_id.
     */
    public function index(Request $request)
    {
        $userId = $request->query('user_id');

        if ($userId) {
            return response()->json(
                JobApplication::where('user_id', $userId)->with('job')->latest()->get()
            );
        }

        return response()->json(JobApplication::with('job')->latest()->get());
    }

    /**
     * Apply to a job.
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'job_id'  => 'required|exists:jobs,id',
        ]);

        $existing = JobApplication::where('user_id', $request->user_id)
            ->where('job_id', $request->job_id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Already applied to this job'], 409);
        }

        $application = JobApplication::create([
            'user_id'    => $request->user_id,
            'job_id'     => $request->job_id,
            'status'     => 'Pending',
            'applied_at' => now(),
        ]);

        return response()->json($application->load('job'), 201);
    }

    /**
     * Withdraw / delete an application.
     */
    public function destroy($id)
    {
        JobApplication::findOrFail($id)->delete();
        return response()->json(['message' => 'Application withdrawn']);
    }
}
