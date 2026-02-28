<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('job_applications')) {
            Schema::create('job_applications', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('job_id');
                $table->enum('status', ['Pending', 'Reviewed', 'Shortlisted', 'Accepted', 'Rejected'])->default('Pending');
                $table->timestamp('applied_at')->nullable()->useCurrent();
                $table->timestamps();

                $table->unique(['user_id', 'job_id'], 'unique_application');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('job_id')->references('id')->on('jobs')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('job_applications');
    }
};
