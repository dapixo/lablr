export type UserPlan = 'free' | 'premium'

export interface UserProfile {
  id: string
  user_id: string
  plan: UserPlan
  created_at: string
  updated_at: string
}

export interface PlanUpgradeResponse {
  success: boolean
  data?: UserProfile
  error?: string
}
