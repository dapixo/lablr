// UI Constants for consistent styling across components

export const HEADER_HEIGHT = 80 // px - Height of sticky header
export const SCROLL_DELAY = 100 // ms - Delay to ensure component rendering

// Common gradients
export const GRADIENTS = {
  primary: 'bg-gradient-to-br from-blue-500 to-blue-600',
  secondary: 'bg-gradient-to-br from-indigo-500 to-purple-600',
  surface: 'bg-gradient-to-r from-blue-50 to-indigo-50',
} as const

// Common shadows
export const SHADOWS = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
} as const

// Common transitions
export const TRANSITIONS = {
  fast: 'transition-all duration-200',
  medium: 'transition-all duration-300',
  slow: 'transition-all duration-500',
} as const

// Common spacing
export const SPACING = {
  section: 'py-16',
  container: 'container mx-auto px-4',
} as const
