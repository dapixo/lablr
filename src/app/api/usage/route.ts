import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
export async function GET(): Promise<NextResponse<UsageResponse>> {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Récupérer ou créer l'usage quotidien
    const { data, error } = await supabase
      .rpc('get_or_create_daily_usage', { user_uuid: user.id })

    if (error) {
      console.error('Error fetching daily usage:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch usage' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data as DailyUsage
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/usage:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/usage - Incrémente l'usage quotidien
 */
export async function POST(request: NextRequest): Promise<NextResponse<UsageResponse>> {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parser le body
    let body: UsageRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { labelCount } = body

    // Valider labelCount
    if (!Number.isInteger(labelCount) || labelCount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid labelCount: must be a positive integer' },
        { status: 400 }
      )
    }

    // Incrémenter l'usage
    const { data, error } = await supabase
      .rpc('increment_daily_usage', {
        user_uuid: user.id,
        label_count: labelCount
      })

    if (error) {
      console.error('Error incrementing daily usage:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update usage' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data as DailyUsage
    })

  } catch (error) {
    console.error('Unexpected error in POST /api/usage:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}