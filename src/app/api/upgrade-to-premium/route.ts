import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PlanUpgradeResponse } from '@/types/user'

/**
 * POST /api/upgrade-to-premium - Simule un upgrade vers Premium
 * Cette route simule un paiement réussi en attendant l'intégration Lemon Squeezy
 */
export async function POST(): Promise<NextResponse<PlanUpgradeResponse>> {
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

    // Mettre à jour ou créer le profil utilisateur avec plan premium
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          plan: 'premium',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error upgrading to premium:', error)
      return NextResponse.json({ success: false, error: 'Failed to upgrade plan' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data,
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/upgrade-to-premium:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
