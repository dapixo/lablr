import LocaleRedirect from '@/components/LocaleRedirect'

/**
 * Page de redirection /pricing → /[locale]/pricing
 * Nécessaire car Dodo Payments redirige vers /pricing sans locale
 */
export default function PricingRedirectPage() {
  return <LocaleRedirect targetPath="/pricing" />
}
