'use client'

import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import type { TranslationVariables } from '@/hooks/useTranslations'

type Messages = Record<string, unknown>
type TranslationFunction = (key: string, variables?: TranslationVariables) => string

interface TranslationsContextType {
  t: TranslationFunction
  locale: string
  loading: boolean
}

const TranslationsContext = createContext<TranslationsContextType | undefined>(undefined)

// Cache global pour éviter de recharger les mêmes fichiers
const messagesCache = new Map<string, Messages>()

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
    if (key in variables) {
      return variables[key]?.toString() || ''
    }
    return match
  })
}

interface TranslationsProviderProps {
  children: ReactNode
  locale: string
}

export function TranslationsProvider({ children, locale }: TranslationsProviderProps) {
  const [messages, setMessages] = useState<Messages | null>(() => {
    // Vérifier le cache au montage
    return messagesCache.get(locale) || null
  })
  const [loading, setLoading] = useState(!messagesCache.has(locale))

  useEffect(() => {
    // ⚡ OPTIMISÉ: Si messages déjà chargés, skip (évite double vérification cache)
    if (messages) {
      setLoading(false)
      return
    }

    // Charger dynamiquement uniquement la langue nécessaire
    setLoading(true)

    import(`../../messages/${locale}.json`)
      .then((module) => {
        const loadedMessages = module.default
        messagesCache.set(locale, loadedMessages)
        setMessages(loadedMessages)
        setLoading(false)
      })
      .catch((error) => {
        console.error(`Failed to load translations for locale: ${locale}`, error)
        // Fallback vers français si erreur
        import('../../messages/fr.json')
          .then((module) => {
            const fallbackMessages = module.default
            messagesCache.set(locale, fallbackMessages)
            setMessages(fallbackMessages)
            setLoading(false)
          })
          .catch((fallbackError) => {
            console.error('Failed to load fallback translations:', fallbackError)
            setMessages({})
            setLoading(false)
          })
      })
  }, [locale, messages])

  const t: TranslationFunction = (key: string, variables?: TranslationVariables): string => {
    if (!messages) {
      // Pendant le chargement, retourner la clé
      return key
    }

    const message = getNestedValue(messages, key)
    return interpolateMessage(message, variables)
  }

  const value: TranslationsContextType = {
    t,
    locale,
    loading,
  }

  return <TranslationsContext.Provider value={value}>{children}</TranslationsContext.Provider>
}

export function useTranslationsContext() {
  const context = useContext(TranslationsContext)
  if (context === undefined) {
    throw new Error('useTranslationsContext must be used within a TranslationsProvider')
  }
  return context
}
