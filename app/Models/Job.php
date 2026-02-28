<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'company',
        'location',
        'type',
        'level',
        'description',
        'salary_min',
        'salary_max',
        'track',
        'skills',
    ];

    protected $casts = [
        'skills' => 'array',
    ];
}
