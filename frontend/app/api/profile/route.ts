export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getRecommendation, type GoalKey } from '@/lib/recommendations'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ProfileRow {
  id: string; name: string; age: number; income: string
  savings_rate: string; investments: string; experience: string
  goal: string; valam_score: number; valam_level: number
  valam_level_name: string; savings_score: number
  investments_score: number; income_score: number
  experience_score: number; age_score: number; created_at: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    console.log(id);
    console.log("hi");
    if (!id) return NextResponse.json(
      { error: 'Missing profile id' }, { status: 400 }
    )

    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116')
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    const row = data as ProfileRow
    return NextResponse.json({
      profile: {
        id: row.id, name: row.name, age: row.age,
        income: row.income, savingsRate: row.savings_rate,
        investments: row.investments, experience: row.experience,
        goal: row.goal, valamScore: row.valam_score,
        valamLevel: row.valam_level, valamLevelName: row.valam_level_name,
        breakdown: {
          savingsScore:     row.savings_score,
          investmentsScore: row.investments_score,
          incomeScore:      row.income_score,
          experienceScore:  row.experience_score,
          ageScore:         row.age_score,
        },
        createdAt: row.created_at,
        recommendation: getRecommendation(row.valam_level, row.goal as GoalKey),
      }
    }, { status: 200 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}
