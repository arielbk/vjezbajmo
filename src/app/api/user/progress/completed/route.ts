import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { CompletedExerciseRecord } from '@/types/exercise'

// Define the progress data structure
interface UserExerciseProgress {
  completedExercises: string[]
  completedRecords: CompletedExerciseRecord[]
  lastUpdated: number
}

// GET /api/user/progress/completed - Get user's completed exercises for a specific type/level
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const exerciseType = searchParams.get('exerciseType')
    const cefrLevel = searchParams.get('cefrLevel')
    const theme = searchParams.get('theme') || 'default'

    if (!exerciseType || !cefrLevel) {
      return NextResponse.json({ error: 'Missing exerciseType or cefrLevel' }, { status: 400 })
    }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    // Get progress from user's metadata
    const progressData: UserExerciseProgress = (user.privateMetadata?.exerciseProgress as UserExerciseProgress) || {
      completedExercises: [],
      completedRecords: [],
      lastUpdated: Date.now(),
    }

    // Filter completed exercises by type, level, and theme
    const filteredRecords = progressData.completedRecords.filter(record => 
      record.exerciseType === exerciseType &&
      record.cefrLevel === cefrLevel &&
      (record.theme || 'default') === theme
    )

    const completedExercises = [...new Set(filteredRecords.map(record => record.exerciseId))]

    return NextResponse.json({ 
      completedExercises,
      recordCount: filteredRecords.length 
    })
  } catch (error) {
    console.error('Error fetching user completed exercises:', error)
    return NextResponse.json(
      { error: 'Failed to fetch completed exercises' },
      { status: 500 }
    )
  }
}
