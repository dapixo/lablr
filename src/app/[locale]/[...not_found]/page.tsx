import { notFound } from 'next/navigation'

/**
 * Route catch-all pour déclencher la page 404 multilingue
 * Capture toutes les routes non définies dans [locale]
 */
export default function CatchAllPage() {
  notFound()
}
