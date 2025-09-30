import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, withRateLimitHeaders } from '@/lib/rate-limit'

export interface DailyUsage {
  id: string
  user_id: string
  usage_date: string
  labels_used: number
  created_at: string
  updated_at: string
}

export interface UsageResponse {
  success: boolean
  data?: DailyUsage
  error?: string
}

export interface UsageRequest {
  labelCount: number
}

/**
 * GET /api/usage - Récupère l'usage quotidien de l'utilisateur
 */
export async function GET(request: NextRequest): Promise<NextResponse<UsageResponse>> {
  // Appliquer rate limiting
  const rateLimitResult = await checkRateLimit(request, 'usage')
  if (!rateLimitResult.success) {
    return rateLimitResult.response as NextResponse<UsageResponse>
  }

  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer ou créer l'usage quotidien
    const { data, error } = await supabase
      .from('daily_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('usage_date', new Date().toISOString().split('T')[0])
      .single()

    let usageData = data

    // Si aucun enregistrement trouvé, en créer un
    if (error?.code === 'PGRST116') {
      const { data: newData, error: insertError } = await supabase
        .from('daily_usage')
        .insert({
          user_id: user.id,
          usage_date: new Date().toISOString().split('T')[0],
          labels_used: 0,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating daily usage:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to create usage record' },
          { status: 500 }
        )
      }
      usageData = newData
    } else if (error) {
      console.error('Error fetching daily usage:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch usage' }, { status: 500 })
    }

    const response = NextResponse.json({
      success: true,
      data: usageData as DailyUsage,
    })

    return withRateLimitHeaders(response, rateLimitResult.headers) as NextResponse<UsageResponse>
  } catch (error) {
    console.error('Unexpected error in GET /api/usage:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/usage - Incrémente l'usage quotidien
 */
export async function POST(request: NextRequest): Promise<NextResponse<UsageResponse>> {
  // Appliquer rate limiting
  const rateLimitResult = await checkRateLimit(request, 'usage')
  if (!rateLimitResult.success) {
    return rateLimitResult.response as NextResponse<UsageResponse>
  }

  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Parser le body
    let body: UsageRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
    }

    const { labelCount } = body

    // Valider labelCount
    if (!Number.isInteger(labelCount) || labelCount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid labelCount: must be a positive integer' },
        { status: 400 }
      )
    }

    // Incrémenter l'usage - d'abord récupérer l'existant, puis incrémenter
    const today = new Date().toISOString().split('T')[0]

    // Récupérer l'enregistrement existant ou en créer un
    const { data: existing, error: fetchError } = await supabase
      .from('daily_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .single()

    let resultData: {
      id: string
      user_id: string
      usage_date: string
      labels_used: number
      created_at: string
      updated_at: string
    }

    if (fetchError?.code === 'PGRST116') {
      // Aucun enregistrement trouvé, en créer un
      const { data: newData, error: insertError } = await supabase
        .from('daily_usage')
        .insert({
          user_id: user.id,
          usage_date: today,
          labels_used: labelCount,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating daily usage:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to create usage' },
          { status: 500 }
        )
      }
      resultData = newData
    } else if (fetchError) {
      console.error('Error fetching daily usage:', fetchError)
      return NextResponse.json({ success: false, error: 'Failed to fetch usage' }, { status: 500 })
    } else {
      // Enregistrement existant trouvé, l'incrémenter
      const { data: updated, error: updateError } = await supabase
        .from('daily_usage')
        .update({
          labels_used: existing.labels_used + labelCount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating daily usage:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update usage' },
          { status: 500 }
        )
      }
      resultData = updated
    }

    const response = NextResponse.json({
      success: true,
      data: resultData as DailyUsage,
    })

    return withRateLimitHeaders(response, rateLimitResult.headers) as NextResponse<UsageResponse>
  } catch (error) {
    console.error('Unexpected error in POST /api/usage:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
