/** Application feature flags. */
export const FEATURE_FLAGS = {
  /** When disabled, every account receives Premium access and billing is hidden. */
  PREMIUM_MODE_ENABLED: false,
} as const

export function isPremiumModeEnabled(): boolean {
  return FEATURE_FLAGS.PREMIUM_MODE_ENABLED
}
