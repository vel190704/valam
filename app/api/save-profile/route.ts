export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as {
      name: string; age: number; income: string; savingsRate: string
      investments: string; experience: string; goal: string
      valamScore: number; valamLevel: number; valamLevelName: string
      breakdown: {
        savingsScore: number; investmentsScore: number; incomeScore: number
        experienceScore: number; ageScore: number
      }
    }

    const required = ['name','age','income','savingsRate','investments',
                      'experience','goal','valamScore','valamLevel','valamLevelName']
    for (const field of required) {
      if (body[field as keyof typeof body] === undefined ||
          body[field as keyof typeof body] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` }, { status: 400 }
        )
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id:           null,
        name:              body.name,
        age:               body.age,
        income:            body.income,
        savings_rate:      body.savingsRate,
        investments:       body.investments,
        experience:        body.experience,
        goal:              body.goal,
        valam_score:       body.valamScore,
        valam_level:       body.valamLevel,
        valam_level_name:  body.valamLevelName,
        savings_score:     body.breakdown.savingsScore,
        investments_score: body.breakdown.investmentsScore,
        income_score:      body.breakdown.incomeScore,
        experience_score:  body.breakdown.experienceScore,
        age_score:         body.breakdown.ageScore,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase insert error:', JSON.stringify(error))
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }

    return NextResponse.json({ profileId: data.id }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}
