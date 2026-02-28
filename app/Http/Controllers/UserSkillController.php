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
        $query = UserSkill::orderBy('skill_name');
        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }
        return response()->json($query->get());
    }

    /**
     * Add or update a user's skill.
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_id'    => 'required|exists:users,id',
            'skill_name' => 'required|string|max:255',
            'proficiency'=> 'required|in:Beginner,Intermediate,Expert,Professional',
        ]);

        $skill = UserSkill::updateOrCreate(
            ['user_id' => $request->user_id, 'skill_name' => $request->skill_name],
            ['proficiency' => $request->proficiency]
        );

        return response()->json($skill, $skill->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Update an existing skill's proficiency.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'skill_name'  => 'sometimes|string|max:255',
            'proficiency' => 'sometimes|in:Beginner,Intermediate,Expert,Professional',
        ]);

        $skill = UserSkill::findOrFail($id);
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