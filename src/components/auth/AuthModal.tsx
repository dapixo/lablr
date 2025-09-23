'use client'

import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { InputOtp } from 'primereact/inputotp'
import { Message } from 'primereact/message'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { extractRateLimitDelay, getErrorMessage, isRateLimitError } from '@/lib/auth-helpers'
import { validateEmailDomain } from '@/lib/disposable-email-domains'

interface AuthModalProps {
  visible: boolean
  onHide: () => void
  onSuccess: () => void
  t: (key: string) => string
}

export function AuthModal({ visible, onHide, onSuccess, t }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [waitingForAuth, setWaitingForAuth] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [canResend, setCanResend] = useState(true)

  const { sendOtpCode, verifyOtpCode, loading: authLoading, user } = useAuth()

  // Surveiller la fin du loading auth après connexion réussie
  useEffect(() => {
    if (waitingForAuth && !authLoading && user) {
      // Context mis à jour, exécuter l'action et fermer la modal
      setLoading(false)
      setWaitingForAuth(false)
      onSuccess()
      onHide()
    }
  }, [waitingForAuth, authLoading, user, onSuccess, onHide])

  // Fonction pour démarrer le countdown adaptatif
  const startResendCountdown = useCallback((seconds: number) => {
    setResendCountdown(seconds)
    setCanResend(false)

    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError(null)

      // Validation côté client de l'email
      const emailValidation = validateEmailDomain(email)

      if (!emailValidation.isValid) {
        setError(t('auth.errors.invalidEmail'))
        setLoading(false)
        return
      }

      if (emailValidation.isDisposable) {
        setError(t('auth.errors.disposableEmail'))
        setLoading(false)
        return
      }

      try {
        const { error: authError } = await sendOtpCode(email)

        if (authError) {
          setError(getErrorMessage(authError.message, t))
        } else {
          setStep('code')
          // Pas de countdown initial - laisser l'utilisateur décider quand renvoyer
        }
      } catch {
        setError(t('auth.errors.unexpected'))
      }

      setLoading(false)
    },
    [email, sendOtpCode, t]
  )

  const handleCodeSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError(null)

      try {
        const { error: authError } = await verifyOtpCode(email, otpCode)

        if (authError) {
          setError(getErrorMessage(authError.message, t))
          setLoading(false)
        } else {
          // Connexion réussie - attendre que le context soit à jour
          setWaitingForAuth(true)
          // Le loading reste à true jusqu'à ce que le useEffect se déclenche
        }
      } catch {
        setError(t('auth.errors.unexpected'))
        setLoading(false)
      }
    },
    [email, otpCode, verifyOtpCode, t]
  )

  const resetForm = useCallback(() => {
    setEmail('')
    setOtpCode('')
    setError(null)
    setLoading(false)
    setStep('email')
    setWaitingForAuth(false)
    setResendCountdown(0)
    setCanResend(true)
  }, [])

  const goBackToEmail = useCallback(() => {
    setOtpCode('')
    setError(null)
    setStep('email')
    setResendCountdown(0)
    setCanResend(true)
  }, [])

  // Fonction pour gérer le resend avec countdown
  const handleResendCode = useCallback(async () => {
    if (!canResend || loading) return

    setLoading(true)
    setError(null)
    try {
      const { error: resendError } = await sendOtpCode(email)
      if (resendError) {
        if (isRateLimitError(resendError.message)) {
          const delay = extractRateLimitDelay(resendError.message)
          startResendCountdown(delay || 30) // Fallback 30s si parsing échoue
        }
        setError(getErrorMessage(resendError.message, t))
      } else {
        // Succès, pas de countdown - laisser l'utilisateur libre
      }
    } catch {
      setError(t('auth.errors.unexpected'))
    }
    setLoading(false)
  }, [canResend, loading, email, sendOtpCode, t, startResendCountdown])

  // Reset automatique du code OTP en cas d'erreur après 3 secondes
  useEffect(() => {
    if (error && step === 'code') {
      const timer = setTimeout(() => {
        // Vérifier les codes d'erreur OTP de Supabase pour reset automatique
        if (
          error.includes('invalid_otp') ||
          error.includes('otp_expired') ||
          error.includes('Token has expired or is invalid') ||
          error.includes('invalid') ||
          error.includes('expired') ||
          error.includes(t('auth.errors.invalidCode')) ||
          error.includes(t('auth.errors.expiredCode'))
        ) {
          setOtpCode('')
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error, step, t])

  const handleHide = useCallback(() => {
    resetForm()
    onHide()
  }, [resetForm, onHide])

  const headerContent = useMemo(
    () => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
          <i className={`pi ${step === 'code' ? 'pi-key' : 'pi-envelope'} text-white text-sm`}></i>
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">
            {step === 'code' ? t('auth.otp.enterCode') : t('auth.title.signIn')}
          </span>
          <p className="text-xs text-gray-500 mt-0">{t('auth.tagline')}</p>
        </div>
      </div>
    ),
    [step, t]
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
        {step === 'email' && (
          <Button
            type="submit"
            label={
              loading
                ? t('auth.buttons.loading')
                : t('auth.otp.sendCode')
            }
            icon={loading ? undefined : 'pi pi-send'}
            loading={loading}
            disabled={loading}
            className="flex-1"
            form="auth-form"
          />
        )}
        {step === 'code' && (
          <Button
            type="submit"
            label={
              loading
                ? t('auth.buttons.loading')
                : t('auth.otp.verify')
            }
            icon={loading ? undefined : 'pi pi-check'}
            loading={loading}
            disabled={loading || otpCode.length < 6}
            className="flex-1"
            form="auth-form"
          />
        )}
      </div>
    ),
    [loading, step, otpCode.length, handleHide, t]
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
        :global(.auth-modal .p-inputotp input) {
          width: 2.5rem !important;
          height: 2.5rem !important;
          text-align: center !important;
          font-size: 1rem !important;
          border: 2px solid #e5e7eb !important;
          border-radius: 0.5rem !important;
          outline: none !important;
          transition: all 0.2s !important;
          margin: 0 0.25rem !important;
        }
        :global(.auth-modal .p-inputotp input:focus) {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
        }
        :global(.auth-modal .p-inputotp input:disabled) {
          background-color: #f9fafb !important;
          cursor: not-allowed !important;
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
        {step === 'code' ? (
          /* Formulaire de saisie du code */
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <i className="pi pi-envelope text-green-500 text-2xl"></i>
              </div>
              <p className="text-gray-700 font-medium mb-2">
                {t('auth.otp.codeSent')}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {t('auth.otp.codeSentTo').replace('{email}', email)}
              </p>
            </div>

            <form id="auth-form" onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 flex items-center justify-center gap-2">
                  <i className="pi pi-key text-gray-400 text-xs"></i>
                  {t('auth.otp.codeLabel')}
                </label>
                <div className="flex justify-center">
                  <InputOtp
                    value={otpCode}
                    onChange={(e) => setOtpCode(String(e.value || ''))}
                    length={6}
                    integerOnly
                    disabled={loading}
                    style={{ gap: '0.5rem' }}
                  />
                </div>
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

            <div className="flex flex-col gap-3">
              <Button
                label={
                  resendCountdown > 0
                    ? `${t('auth.otp.resendCode')} (${resendCountdown}s)`
                    : t('auth.otp.resendCode')
                }
                icon={resendCountdown > 0 ? "pi pi-clock" : "pi pi-refresh"}
                outlined
                onClick={handleResendCode}
                disabled={loading || !canResend}
                className="w-full"
              />
              <Button
                label={t('auth.otp.changeEmail')}
                icon="pi pi-arrow-left"
                text
                onClick={goBackToEmail}
                className="w-full"
              />
            </div>
          </div>
        ) : (
          <>
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

            {/* Formulaire d'email */}
            <form id="auth-form" onSubmit={handleEmailSubmit} className="space-y-4">
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

              {error && (
                <Message
                  severity="error"
                  text={error}
                  className="w-full mt-1"
                  icon="pi pi-exclamation-triangle"
                />
              )}
            </form>

            {/* Information sur le processus OTP */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <div className="text-center text-sm text-gray-600">
                <p className="font-medium mb-2">{t('auth.otp.howItWorks.title')}</p>
                <ul className="space-y-1 text-xs">
                  <li>• {t('auth.otp.howItWorks.step1')}</li>
                  <li>• {t('auth.otp.howItWorks.step2')}</li>
                  <li>• {t('auth.otp.howItWorks.step3')}</li>
                </ul>
              </div>
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
          </>
        )}
      </Dialog>
    </>
  )
}