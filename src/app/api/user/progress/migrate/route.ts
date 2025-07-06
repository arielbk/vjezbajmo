import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CompletedExerciseRecord } from '@/types/exercise'

// Define the progress data structure
interface UserExerciseProgress {
  completedExercises: string[]
  completedRecords: CompletedExerciseRecord[]
  lastUpdated: number
}

// Schema for migration data
const migrationSchema = z.object({
  localProgress: z.object({
    completedExercises: z.array(z.string()),
    completedRecords: z.array(z.any()), // We'll validate the structure manually
    lastUpdated: z.number(),
  }),
  userId: z.string(),
})

// POST /api/user/progress/migrate - Migrate local storage progress to user account
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = migrationSchema.parse(body)
    const { localProgress } = parsed

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    // Get current server progress
    const currentProgress: UserExerciseProgress = (user.privateMetadata?.exerciseProgress as UserExerciseProgress) || {
      completedExercises: [],
      completedRecords: [],
      lastUpdated: Date.now(),
    }

    // Merge local progress with server progress
    const mergedCompletedExercises = new Set([
      ...currentProgress.completedExercises,
      ...localProgress.completedExercises,
    ])

    const mergedRecords = [
      ...currentProgress.completedRecords,
      ...localProgress.completedRecords,
    ]

    // Remove duplicates from records (keep the most recent attempt for each exercise)
    const recordsMap = new Map<string, CompletedExerciseRecord>()
    mergedRecords.forEach(record => {
      const key = `${record.exerciseId}-${record.exerciseType}-${record.cefrLevel}-${record.theme || 'default'}`
      const existing = recordsMap.get(key)
      if (!existing || record.completedAt > existing.completedAt) {
        recordsMap.set(key, record)
      }
    })

    const finalProgress: UserExerciseProgress = {
      completedExercises: Array.from(mergedCompletedExercises),
      completedRecords: Array.from(recordsMap.values()),
      lastUpdated: Date.now(),
    }

    // Update user metadata with merged progress
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        exerciseProgress: finalProgress,
      },
    })

    return NextResponse.json({ 
      success: true,
      migratedExercises: localProgress.completedExercises.length,
      migratedRecords: localProgress.completedRecords.length,
      totalExercises: finalProgress.completedExercises.length,
      totalRecords: finalProgress.completedRecords.length,
    })
  } catch (error) {
    console.error('Error migrating user progress:', error)
    return NextResponse.json(
      { error: 'Failed to migrate progress' },
      { status: 500 }
    )
  }
}
