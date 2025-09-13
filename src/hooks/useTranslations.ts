import { useMemo } from 'react'
import enMessages from '../../messages/en.json'
import frMessages from '../../messages/fr.json'

type Messages = typeof frMessages
type MessageKey = string

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  return (
    (path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key]
      }
      return undefined
    }, obj) as string) || path
  )
}

export function useTranslations(locale: string) {
  return useMemo(() => {
    const messages: Messages = locale === 'en' ? enMessages : frMessages

    return (key: MessageKey): string => {
      return getNestedValue(messages, key)
    }
  }, [locale])
}

