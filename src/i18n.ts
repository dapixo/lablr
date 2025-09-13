import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'
import { locales } from './i18n/config'

// @ts-expect-error - next-intl configuration issue with TypeScript in Next.js 15
export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as 'fr' | 'en')) notFound()

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
