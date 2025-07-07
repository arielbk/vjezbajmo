import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { CompletedExerciseRecord, ExerciseType } from '@/types/exercise'

// Define the progress data structure
interface UserExerciseProgress {
  completedExercises: string[]
  completedRecords: CompletedExerciseRecord[]
  lastUpdated: number
}

// GET /api/user/progress/stats - Get user's performance statistics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const exerciseType = searchParams.get('exerciseType') as ExerciseType | null

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    // Get progress from user's metadata
    const progressData: UserExerciseProgress = (user.privateMetadata?.exerciseProgress as UserExerciseProgress) || {
      completedExercises: [],
      completedRecords: [],
      lastUpdated: Date.now(),
    }

    const records = progressData.completedRecords

    if (exerciseType) {
      // Get stats for specific exercise type
      const filteredRecords = records.filter(r => r.exerciseType === exerciseType)
      const totalCompleted = filteredRecords.length
      const averageScore = totalCompleted > 0 
        ? filteredRecords.reduce((sum, r) => sum + r.score.percentage, 0) / totalCompleted 
        : 0

      return NextResponse.json({
        totalCompleted,
        averageScore: Math.round(averageScore),
        byExerciseType: {
          verbTenses: { completed: 0, averageScore: 0 },
          nounDeclension: { completed: 0, averageScore: 0 },
          verbAspect: { completed: 0, averageScore: 0 },
          relativePronouns: { completed: 0, averageScore: 0 },
          [exerciseType]: { 
            completed: totalCompleted, 
            averageScore: Math.round(averageScore) 
          },
        },
      })
    }

    // Get overall stats
    const totalCompleted = records.length
    const averageScore = totalCompleted > 0 
      ? records.reduce((sum, r) => sum + r.score.percentage, 0) / totalCompleted 
      : 0

    const byExerciseType: Record<ExerciseType, { completed: number; averageScore: number; lastAttempted?: number }> = {
      verbTenses: { completed: 0, averageScore: 0 },
      nounDeclension: { completed: 0, averageScore: 0 },
      verbAspect: { completed: 0, averageScore: 0 },
      relativePronouns: { completed: 0, averageScore: 0 },
    }

    // Calculate stats by exercise type
    const exerciseTypes: ExerciseType[] = ['verbTenses', 'nounDeclension', 'verbAspect', 'relativePronouns']

    exerciseTypes.forEach(type => {
      const typeRecords = records.filter(r => r.exerciseType === type)
      byExerciseType[type] = {
        completed: typeRecords.length,
        averageScore: typeRecords.length > 0
          ? Math.round(typeRecords.reduce((sum, r) => sum + r.score.percentage, 0) / typeRecords.length)
          : 0,
        lastAttempted: typeRecords.length > 0 
          ? Math.max(...typeRecords.map(r => r.completedAt)) 
          : undefined,
      }
    })

    return NextResponse.json({
      totalCompleted,
      averageScore: Math.round(averageScore),
      byExerciseType,
    })
  } catch (error) {
    console.error('Error fetching user performance stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance stats' },
      { status: 500 }
    )
  }
}
