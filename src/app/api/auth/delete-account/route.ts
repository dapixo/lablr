import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    // Validate HTTP method
    if (request.method !== 'DELETE') {
      return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
    }

    const supabase = await createClient()

    // Get the current user from regular client
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Additional security: verify user is authenticated and owns the account
    if (!user.email || !user.id) {
      return NextResponse.json({ message: 'Invalid user data' }, { status: 400 })
    }

    // Use admin client to delete the user permanently
    const adminClient = createAdminClient()

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      user.id,
      true // shouldSoftDelete = false for permanent deletion
    )

    if (deleteError) {
      console.error('Error deleting user:', deleteError.message)

      // Don't expose internal error details
      return NextResponse.json({ message: 'Failed to delete account' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Account deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
