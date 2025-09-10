/**
 * Utilitaires pour la gestion du localStorage de manière sécurisée (SSR-safe)
 */

// Clés de stockage centralisées
export const STORAGE_KEYS = {
  SELECTED_FORMAT: 'lablr-selected-format',
  PRINT_PANEL_COLLAPSED: 'lablr-print-panel-collapsed',
  PREVIEW_PANEL_COLLAPSED: 'lablr-preview-panel-collapsed',
  ADDRESSES_PANEL_COLLAPSED: 'lablr-addresses-panel-collapsed',
} as const

/**
 * Vérifie si localStorage est disponible (SSR-safe)
 */
export function isStorageAvailable(): boolean {
  return typeof window !== 'undefined' && window.localStorage !== undefined
}

/**
 * Récupère une valeur du localStorage de manière sécurisée
 */
export function getStorageItem(key: string): string | null {
  if (!isStorageAvailable()) return null
  
  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.warn(`Erreur lors de la lecture du localStorage pour la clé "${key}":`, error)
    return null
  }
}

/**
 * Sauvegarde une valeur dans localStorage de manière sécurisée
 */
export function setStorageItem(key: string, value: string): boolean {
  if (!isStorageAvailable()) return false
  
  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    console.warn(`Erreur lors de l'écriture du localStorage pour la clé "${key}":`, error)
    return false
  }
}

/**
 * Récupère un booléen du localStorage
 */
export function getStorageBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = getStorageItem(key)
  return value === 'true' ? true : value === 'false' ? false : defaultValue
}

/**
 * Sauvegarde un booléen dans localStorage
 */
export function setStorageBoolean(key: string, value: boolean): boolean {
  return setStorageItem(key, value.toString())
}

/**
 * Hook personnalisé pour gérer l'état d'un panel collapsible avec persistance
 */
import { useCallback, useState } from 'react'

export function useCollapsiblePanel(storageKey: string, defaultCollapsed: boolean = false) {
  const [isCollapsed, setIsCollapsed] = useState(() => 
    getStorageBoolean(storageKey, defaultCollapsed)
  )

  const toggle = useCallback(() => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    setStorageBoolean(storageKey, newState)
  }, [isCollapsed, storageKey])

  return { isCollapsed, toggle }
}

/**
 * Hook personnalisé pour gérer la sélection persistante avec validation
 */
export function usePersistedSelection<T extends string>(
  storageKey: string, 
  defaultValue: T, 
  validator?: (value: string) => value is T
) {
  const [value, setValue] = useState<T>(() => {
    const saved = getStorageItem(storageKey)
    if (saved && (!validator || validator(saved))) {
      return saved as T
    }
    return defaultValue
  })

  const updateValue = useCallback((newValue: T) => {
    setValue(newValue)
    setStorageItem(storageKey, newValue)
  }, [storageKey])

  return { value, updateValue }
}