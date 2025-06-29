import { NextRequest, NextResponse } from "next/server";
import { cacheProvider } from "@/lib/cache-provider";

// API endpoint to retrieve a specific exercise by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Exercise ID is required" },
        { status: 400 }
      );
    }

    // Try to find the exercise in cache
    const cachedExercise = await cacheProvider.getExerciseById(id);
    
    if (!cachedExercise) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      exercise: cachedExercise.data,
      exerciseType: cachedExercise.exerciseType,
      cefrLevel: cachedExercise.cefrLevel,
      theme: cachedExercise.theme,
      createdAt: cachedExercise.createdAt,
    });
  } catch (error) {
    console.error("Failed to retrieve exercise by ID:", error);
    return NextResponse.json(
      { error: "Failed to retrieve exercise" },
      { status: 500 }
    );
  }
}
