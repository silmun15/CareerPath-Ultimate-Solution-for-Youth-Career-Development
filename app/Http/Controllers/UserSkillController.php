<?php

namespace App\Http\Controllers;

use App\Models\UserSkill;
use Illuminate\Http\Request;

class UserSkillController extends Controller
{
    /**
     * List skills – optionally filter by user_id.
     */
    public function index(Request $request)
    {
        $userId = $request->query('user_id');

        if ($userId) {
            return response()->json(
                UserSkill::where('user_id', $userId)->orderBy('skill_name')->get()
            );
        }

        return response()->json(UserSkill::orderBy('skill_name')->get());
    }

    /**
     * Add a new skill for a user.
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_id'     => 'required|exists:users,id',
            'skill_name'  => 'required|string|max:255',
            'proficiency'  => 'required|in:Beginner,Intermediate,Expert,Professional',
        ]);

        $existing = UserSkill::where('user_id', $request->user_id)
            ->where('skill_name', $request->skill_name)
            ->first();

        if ($existing) {
            $existing->update(['proficiency' => $request->proficiency]);
            return response()->json($existing, 200);
        }

        $skill = UserSkill::create([
            'user_id'    => $request->user_id,
            'skill_name' => $request->skill_name,
            'proficiency' => $request->proficiency,
        ]);

        return response()->json($skill, 201);
    }

    /**
     * Update an existing skill's proficiency.
     */
    public function update(Request $request, $id)
    {
        $skill = UserSkill::findOrFail($id);

        $request->validate([
            'skill_name'  => 'sometimes|string|max:255',
            'proficiency'  => 'sometimes|in:Beginner,Intermediate,Expert,Professional',
        ]);

        $skill->update($request->only(['skill_name', 'proficiency']));

        return response()->json($skill);
    }

    /**
     * Delete a skill.
     */
    public function destroy($id)
    {
        UserSkill::findOrFail($id)->delete();
        return response()->json(['message' => 'Skill removed successfully']);
    }
}