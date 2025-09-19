'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Message } from 'primereact/message'
import { Password } from 'primereact/password'
import { useCallback, useEffect, useState } from 'react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from '@/hooks/useTranslations'

function getErrorMessage(message: string, t: (key: string) => string): string {
  if (message.includes('Invalid login credentials')) {
    return t('auth.errors.invalidCredentials')
  }
  if (message.includes('Email not confirmed')) {
    return t('auth.errors.emailNotConfirmed')
  }
  if (message.includes('Password should be at least')) {
    return t('auth.errors.passwordTooShort')
  }
  if (message.includes('Unable to validate email address')) {
    return t('auth.errors.invalidEmail')
  }
  if (message.includes('User already registered')) {
    return t('auth.errors.userExists')
  }
  return message
}

export default function LoginPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) || 'fr'
  const t = useTranslations(locale)
  const { user, loading: authLoading, signIn, signUp } = useAuth()

  // États du formulaire
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Rediriger vers Mon compte si l'utilisateur est déjà connecté
   */
  useEffect(() => {
    if (!authLoading && user) {
      router.push(`/${locale}/account`)
    }
  }, [user, authLoading, router, locale])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError(null)

      try {
        const { error: authError } = isSignUp
          ? await signUp(email, password)
          : await signIn(email, password)

        if (authError) {
          setError(getErrorMessage(authError.message, t))
          setLoading(false)
        } else {
          // Connexion réussie - redirection se fera via useEffect
        }
      } catch {
        setError(t('auth.errors.unexpected'))
        setLoading(false)
      }
    },
    [email, password, isSignUp, signIn, signUp, t]
  )

  const resetForm = useCallback(() => {
    setEmail('')
    setPassword('')
    setError(null)
    setLoading(false)
  }, [])

  const toggleMode = useCallback(() => {
    setIsSignUp(!isSignUp)
    resetForm()
  }, [isSignUp, resetForm])

  // Loader pendant la vérification auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header t={t} />
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <i className="pi pi-spin pi-spinner text-4xl text-blue-500 mb-4"></i>
            <p className="text-gray-600">{t('auth.loading')}</p>
          </div>
        </main>
        <Footer t={t} />
      </div>
    )
  }

  // Redirection en cours
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header t={t} />

      <main className="flex-1 bg-gray-50 flex items-center justify-center py-8">
        <div className="w-full max-w-md mx-auto px-4">
          <Card className="p-8">
            {/* Header du formulaire */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <i className="pi pi-user text-blue-500 text-xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isSignUp ? t('auth.title.signUp') : t('auth.title.signIn')}
              </h1>
              <p className="text-gray-600 text-sm">
                {t('auth.page.description')}
              </p>
            </div>

            {/* Formulaire simplifié */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <InputText
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.form.emailPlaceholder')}
                  required
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <div>
                <Password
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isSignUp
                      ? t('auth.form.passwordPlaceholder.signUp')
                      : t('auth.form.passwordPlaceholder.signIn')
                  }
                  required
                  disabled={loading}
                  className="w-full"
                  inputClassName="w-full"
                  feedback={false}
                  toggleMask
                />
              </div>

              {error && (
                <Message
                  severity="error"
                  text={error}
                  className="w-full"
                  icon="pi pi-exclamation-triangle"
                />
              )}

              {/* Bouton de soumission */}
              <Button
                type="submit"
                label={
                  loading
                    ? t('auth.buttons.loading')
                    : isSignUp
                      ? t('auth.buttons.signUp')
                      : t('auth.buttons.signIn')
                }
                icon={loading ? undefined : `pi ${isSignUp ? 'pi-user-plus' : 'pi-sign-in'}`}
                loading={loading}
                disabled={loading}
                className="w-full py-3 text-base font-semibold"
              />
            </form>

            {/* Section inférieure */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="text-center mb-4">
                <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                  ✨ {t('auth.benefits.freeLabels.title')}
                </span>
              </div>

              {/* Toggle mode */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  disabled={loading}
                >
                  {isSignUp ? t('auth.toggle.toSignIn') : t('auth.toggle.toSignUp')}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer t={t} />
    </div>
  )
}