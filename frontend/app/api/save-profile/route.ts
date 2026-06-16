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

    // Get auth token from Authorization header
    const authHeader = request.headers.get('Authorization')
    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (!error && user) {
        userId = user.id
        console.log('Authenticated user:', userId)
      }
    }

    const fields = {
      name:                 body.name,
      age:                  body.age,
      income:               body.income,
      savings_rate:         body.savingsRate,
      investments:          body.investments,
      experience:           body.experience,
      goal:                 body.goal,
      valam_score:          body.valamScore,
      valam_level:          body.valamLevel,
      valam_level_name:     body.valamLevelName,
      savings_score:        body.breakdown.savingsScore,
      investments_score:    body.breakdown.investmentsScore,
      income_score:         body.breakdown.incomeScore,
      experience_score:     body.breakdown.experienceScore,
      age_score:            body.breakdown.ageScore,
      potential_score:      (body as any).potentialScore      ?? null,
      potential_level:      (body as any).potentialLevel      ?? null,
      potential_level_name: (body as any).potentialLevelName  ?? null,
    }

    if (userId) {
      // Check if profile already exists for this user
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (existing) {
        // UPDATE existing profile
        const { data, error } = await supabase
          .from('profiles')
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .select('id')
          .single()

        if (error) {
          console.error('Update error:', JSON.stringify(error))
          return NextResponse.json(
            { error: 'Failed to save profile' }, { status: 500 }
          )
        }
        return NextResponse.json({ profileId: data.id }, { status: 200 })
      }
    }

    // INSERT new profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({ user_id: userId ?? null, ...fields })
      .select('id')
      .single()

    if (error) {
      console.error('Insert error:', JSON.stringify(error))
      return NextResponse.json(
        { error: 'Failed to save profile' }, { status: 500 }
      )
    }

    return NextResponse.json({ profileId: data.id }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Failed to save profile' }, { status: 500 }
    )
  }
}
