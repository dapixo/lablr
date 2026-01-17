import LocaleRedirect from '@/components/LocaleRedirect'

/**
 * Page de redirection /account → /[locale]/account
 * Nécessaire car Dodo Payments redirige vers /account sans locale
 */
export default function AccountRedirectPage() {
  return <LocaleRedirect targetPath="/account" />
}
