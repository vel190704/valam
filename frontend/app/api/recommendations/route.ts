export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getRecommendation, type GoalKey } from '@/lib/recommendations'

const VALID_GOALS: GoalKey[] = [
  'wealth','retirement','emergency','home','education','business'
]

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const levelParam = searchParams.get('level')
  const goalParam  = searchParams.get('goal')

  if (!levelParam || !goalParam)
    return NextResponse.json(
      { error: 'Missing required params: level and goal' }, { status: 400 }
    )

  const level = parseInt(levelParam, 10)
  if (isNaN(level) || level < 1 || level > 8)
    return NextResponse.json(
      { error: 'Invalid level: must be 1-8' }, { status: 400 }
    )

  if (!(VALID_GOALS as string[]).includes(goalParam))
    return NextResponse.json({ error: 'Invalid goal' }, { status: 400 })

  const recommendation = getRecommendation(level, goalParam as GoalKey)
  return NextResponse.json({ recommendation }, { status: 200 })
}
