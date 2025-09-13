'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCallback, useMemo, useTransition } from 'react'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { code: 'fr', label: 'FR', fullLabel: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'EN', fullLabel: 'English', flag: '🇺🇸' },
] as const

const BASE_BUTTON_CLASSES =
  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50'
const ACTIVE_BUTTON_CLASSES = 'bg-white text-gray-900 shadow-sm'
const INACTIVE_BUTTON_CLASSES = 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'

export function LanguageSelector() {
  const params = useParams()
  const locale = (params?.locale as string) || 'fr'
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLanguageChange = useCallback(
    (newLocale: string) => {
      if (newLocale === locale || isPending) return

      startTransition(() => {
        router.push(`/${newLocale}`)
      })
    },
    [locale, router, isPending]
  )

  const languageButtons = useMemo(
    () =>
      LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          disabled={isPending}
          className={cn(
            BASE_BUTTON_CLASSES,
            locale === lang.code ? ACTIVE_BUTTON_CLASSES : INACTIVE_BUTTON_CLASSES
          )}
          title={lang.fullLabel}
        >
          <span className="text-base leading-none">{lang.flag}</span>
          <span className="hidden sm:inline">{lang.label}</span>
        </button>
      )),
    [locale, isPending, handleLanguageChange]
  )

  return <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">{languageButtons}</div>
}
