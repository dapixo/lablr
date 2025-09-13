'use client'

import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Dialog } from 'primereact/dialog'
import { Divider } from 'primereact/divider'
import { InputText } from 'primereact/inputtext'
import { Message } from 'primereact/message'
import { Password } from 'primereact/password'
import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface AuthModalProps {
  visible: boolean
  onHide: () => void
  onSuccess: () => void
  t: (key: string) => string
}

export function AuthModal({ visible, onHide, onSuccess, t }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signIn, signUp } = useAuth()

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
        } else {
          // Connexion ou inscription réussie, fermer la modal et exécuter l'action
          onSuccess()
          onHide()
        }
      } catch {
        setError(t('auth.errors.unexpected'))
      }

      setLoading(false)
    },
    [email, password, isSignUp, signIn, signUp, onSuccess, onHide, t]
  )

  const resetForm = useCallback(() => {
    setEmail('')
    setPassword('')
    setError(null)
    setLoading(false)
  }, [])

  const handleHide = useCallback(() => {
    resetForm()
    onHide()
  }, [resetForm, onHide])

  const toggleMode = useCallback(() => {
    setIsSignUp(!isSignUp)
    resetForm()
  }, [isSignUp, resetForm])

  const headerContent = useMemo(
    () => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
          <i className="pi pi-tag text-white text-sm"></i>
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">
            {isSignUp ? t('auth.title.signUp') : t('auth.title.signIn')}
          </span>
          <p className="text-xs text-gray-500 mt-0">{t('auth.tagline')}</p>
        </div>
      </div>
    ),
    [isSignUp, t]
  )

  const footerContent = useMemo(
    () => (
      <div className="flex gap-2">
        <Button
          label={t('auth.buttons.cancel')}
          icon="pi pi-times"
          onClick={handleHide}
          outlined
          className="flex-1"
          disabled={loading}
        />
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
          className="flex-1"
          form="auth-form"
        />
      </div>
    ),
    [loading, isSignUp, handleHide, t]
  )

  return (
    <>
      <style jsx>{`
        :global(.auth-modal .p-password) {
          width: 100% !important;
        }
        :global(.auth-modal .p-password .p-inputtext) {
          width: 100% !important;
        }
        :global(.auth-modal .p-password-panel) {
          width: 100% !important;
        }
      `}</style>
      <Dialog
        visible={visible}
        onHide={handleHide}
        header={headerContent}
        footer={footerContent}
        className="auth-modal w-full max-w-lg"
        modal
        draggable={false}
        resizable={false}
      >
        {/* Message d'introduction avec icône */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <i className="pi pi-info-circle text-blue-500 text-xl"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('auth.welcome.title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                {t('auth.welcome.description')}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <i className="pi pi-shield-check text-green-500"></i>
                <span>{t('auth.welcome.privacy')}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Formulaire */}
        <form id="auth-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <i className="pi pi-envelope text-gray-400 text-xs"></i>
              {t('auth.form.email')}
            </label>
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

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <i className="pi pi-lock text-gray-400 text-xs"></i>
              {t('auth.form.password')}
            </label>
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
              className="w-full mt-1"
              icon="pi pi-exclamation-triangle"
            />
          )}
        </form>

        <Divider align="center" className="my-6">
          <span className="text-xs text-gray-400 bg-white px-3">ou</span>
        </Divider>

        {/* Basculer entre connexion/inscription */}
        <div className="text-center mb-4">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            disabled={loading}
          >
            {isSignUp ? t('auth.toggle.toSignIn') : t('auth.toggle.toSignUp')}
          </button>
        </div>

        {/* Garanties de confidentialité */}
        <div className="pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="text-xs text-gray-500 flex flex-col items-center gap-1">
              <i className="pi pi-check-circle text-green-500 text-sm"></i>
              <span>{t('auth.guarantees.free')}</span>
            </div>
            <div className="text-xs text-gray-500 flex flex-col items-center gap-1">
              <i className="pi pi-lock text-blue-500 text-sm"></i>
              <span>{t('auth.guarantees.secure')}</span>
            </div>
            <div className="text-xs text-gray-500 flex flex-col items-center gap-1">
              <i className="pi pi-trash text-red-500 text-sm"></i>
              <span>{t('auth.guarantees.noStorage')}</span>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}

function getErrorMessage(message: string, t: (key: string) => string): string {
  // Traduction des messages d'erreur Supabase
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
