'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { useCallback, useMemo, useTransition } from 'react'
import { cn } from '@/lib/utils'

type Language = {
  readonly code: string
  readonly label: string
  readonly fullLabel: string
  readonly flag: string
}

const LANGUAGES: readonly Language[] = [
  { code: 'fr', label: 'FR', fullLabel: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'EN', fullLabel: 'English', flag: '🇺🇸' },
] as const

const BUTTON_STYLES = {
  base: 'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50',
  active: 'bg-white text-gray-900 shadow-sm',
  inactive: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
} as const

const DEFAULT_LOCALE = 'fr'

/**
 * Génère le nouveau chemin avec la locale mise à jour
 */
function generateNewPath(currentPath: string, oldLocale: string, newLocale: string): string {
  return currentPath.replace(`/${oldLocale}`, `/${newLocale}`)
}

/**
 * Composant de sélection de langue avec préservation du chemin actuel
 */
export function LanguageSelector() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const currentLocale = (params?.locale as string) || DEFAULT_LOCALE

  const handleLanguageChange = useCallback(
    (newLocale: string) => {
      if (newLocale === currentLocale || isPending) return

      startTransition(() => {
        const newPath = generateNewPath(pathname, currentLocale, newLocale)
        router.push(newPath)
      })
    },
    [currentLocale, pathname, router, isPending]
  )

  const languageButtons = useMemo(
    () =>
      LANGUAGES.map((language) => {
        const isActive = currentLocale === language.code

        return (
          <button
            key={language.code}
            type="button"
            onClick={() => handleLanguageChange(language.code)}
            disabled={isPending}
            className={cn(
              BUTTON_STYLES.base,
              isActive ? BUTTON_STYLES.active : BUTTON_STYLES.inactive
            )}
            title={language.fullLabel}
            aria-label={`Switch to ${language.fullLabel}`}
            aria-pressed={isActive}
          >
            <span className="text-base leading-none" role="img" aria-label={language.fullLabel}>
              {language.flag}
            </span>
            <span className="hidden sm:inline">{language.label}</span>
          </button>
        )
      }),
    [currentLocale, isPending, handleLanguageChange]
  )

  return (
    <div
      className="flex items-center bg-gray-100 rounded-lg p-1 gap-1"
      role="group"
      aria-label="Language selection"
    >
      {languageButtons}
    </div>
  )
}
