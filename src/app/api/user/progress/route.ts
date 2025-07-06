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

// Schema for saving progress
const saveProgressSchema = z.object({
  exerciseId: z.string(),
  exerciseType: z.enum(['verbTenses', 'nounDeclension', 'verbAspect', 'relativePronouns']),
  cefrLevel: z.enum(['A1', 'A2.1', 'A2.2', 'B1.1']),
  theme: z.string().optional(),
  scoreData: z.object({
    correct: z.number(),
    total: z.number(),
  }).optional(),
  title: z.string().optional(),
})

// GET /api/user/progress - Get user's progress
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    // Get progress from user's metadata
    const progressData: UserExerciseProgress = (user.privateMetadata?.exerciseProgress as UserExerciseProgress) || {
      completedExercises: [],
      completedRecords: [],
      lastUpdated: Date.now(),
    }

    return NextResponse.json(progressData)
  } catch (error) {
    console.error('Error fetching user progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}

// POST /api/user/progress - Save progress for a completed exercise
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = saveProgressSchema.parse(body)
    const { exerciseId, exerciseType, cefrLevel, theme, scoreData, title } = parsed

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    // Get current progress
    const currentProgress: UserExerciseProgress = (user.privateMetadata?.exerciseProgress as UserExerciseProgress) || {
      completedExercises: [],
      completedRecords: [],
      lastUpdated: Date.now(),
    }

    // Add exercise to completed list if not already there
    if (!currentProgress.completedExercises.includes(exerciseId)) {
      currentProgress.completedExercises.push(exerciseId)
    }

    // Create completion record if score data is provided
    if (scoreData) {
      const existingAttempts = currentProgress.completedRecords.filter(
        (r: CompletedExerciseRecord) => r.exerciseId === exerciseId
      )
      
      const completionRecord: CompletedExerciseRecord = {
        exerciseId,
        exerciseType,
        completedAt: Date.now(),
        score: {
          correct: scoreData.correct,
          total: scoreData.total,
          percentage: Math.round((scoreData.correct / scoreData.total) * 100),
        },
        cefrLevel,
        theme,
        attemptNumber: existingAttempts.length + 1,
        title,
      }

      currentProgress.completedRecords.push(completionRecord)
    }

    currentProgress.lastUpdated = Date.now()

    // Update user metadata
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        exerciseProgress: currentProgress,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving user progress:', error)
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    )
  }
}
