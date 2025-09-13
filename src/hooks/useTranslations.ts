import { useMemo } from 'react'
import enMessages from '../../messages/en.json'
import frMessages from '../../messages/fr.json'

type Messages = typeof frMessages
type MessageKey = string
export type TranslationVariables = Record<string, string | number | boolean>

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

function interpolateMessage(message: string, variables?: TranslationVariables): string {
  if (!variables) return message

  return message.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key]?.toString() || match
  })
}

export function useTranslations(locale: string) {
  return useMemo(() => {
    const messages: Messages = locale === 'en' ? enMessages : frMessages

    return (key: MessageKey, variables?: TranslationVariables): string => {
      const message = getNestedValue(messages, key)
      return interpolateMessage(message, variables)
    }
  }, [locale])
}

