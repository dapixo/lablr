'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { InputOtp } from 'primereact/inputotp'
import { Message } from 'primereact/message'
import { useCallback, useEffect, useState } from 'react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from '@/hooks/useTranslations'
import { extractRateLimitDelay, getErrorMessage, isRateLimitError } from '@/lib/auth-helpers'
import { validateEmailDomain } from '@/lib/disposable-email-domains'

export default function LoginPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) || 'fr'
  const t = useTranslations(locale)
  const { user, loading: authLoading, sendOtpCode, verifyOtpCode } = useAuth()

  // États du formulaire
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [resendCountdown, setResendCountdown] = useState(0)
  const [canResend, setCanResend] = useState(true)

  /**
   * Rediriger vers Mon compte si l'utilisateur est déjà connecté
   */
  useEffect(() => {
    if (!authLoading && user) {
      router.push(`/${locale}/account`)
    }
  }, [user, authLoading, router, locale])

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
          setErrorCode(authError.message)
        } else {
          setStep('code')
          // Pas de countdown initial - laisser l'utilisateur décider quand renvoyer
        }
      } catch {
        setError(t('auth.errors.unexpected'))
        setErrorCode(null)
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
          setErrorCode(authError.message)
        }
        // Si pas d'erreur, la connexion se fera automatiquement via useEffect
      } catch {
        setError(t('auth.errors.unexpected'))
        setErrorCode(null)
      }

      setLoading(false)
    },
    [email, otpCode, verifyOtpCode, t]
  )


  const goBackToEmail = useCallback(() => {
    setOtpCode('')
    setError(null)
    setErrorCode(null)
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
    if (error && step === 'code' && errorCode) {
      const timer = setTimeout(() => {
        // Vérifier les codes d'erreur OTP de Supabase pour reset automatique
        const shouldReset =
          errorCode.includes('invalid_otp') ||
          errorCode.includes('otp_expired') ||
          errorCode.includes('Token has expired or is invalid')

        if (shouldReset) {
          setOtpCode('')
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error, step, errorCode])

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
                <i className={`pi ${step === 'code' ? 'pi-key' : 'pi-envelope'} text-blue-500 text-xl`}></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {step === 'code' ? t('auth.otp.enterCode') : t('auth.title.signIn')}
              </h1>
              <p className="text-gray-600 text-sm">
                {step === 'code' ? t('auth.otp.codeDescription') : t('auth.page.description')}
              </p>
            </div>

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

                <form onSubmit={handleCodeSubmit} className="space-y-5">
                  <div className="flex justify-center otp-container">
                    <InputOtp
                      value={otpCode}
                      onChange={(e) => setOtpCode(String(e.value || ''))}
                      length={6}
                      integerOnly
                      disabled={loading}
                      style={{ gap: '0.5rem' }}
                    />
                  </div>
                  <style jsx>{`
                    .otp-container :global(.p-inputotp input) {
                      width: 3rem;
                      height: 3rem;
                      text-align: center;
                      font-size: 1.125rem;
                      border: 2px solid #e5e7eb;
                      border-radius: 0.5rem;
                      outline: none;
                      transition: all 0.2s;
                      margin: 0 0.25rem;
                    }
                    .otp-container :global(.p-inputotp input:focus) {
                      border-color: #3b82f6;
                      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                    }
                    .otp-container :global(.p-inputotp input:disabled) {
                      background-color: #f9fafb;
                      cursor: not-allowed;
                    }
                  `}</style>

                  {error && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <Message
                        severity="error"
                        text={error}
                        className="w-full"
                        icon="pi pi-exclamation-triangle"
                      />
                    </div>
                  )}

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
                    className="w-full py-3 text-base font-semibold"
                  />
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
              /* Formulaire d'email */
              <form onSubmit={handleEmailSubmit} className="space-y-5">
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

                {error && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <Message
                      severity="error"
                      text={error}
                      className="w-full"
                      icon="pi pi-exclamation-triangle"
                    />
                  </div>
                )}

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
                  className="w-full py-3 text-base font-semibold"
                />
              </form>
            )}

            {step === 'email' && (
              /* Section inférieure */
              <div className="mt-8 pt-6 border-t border-gray-100">

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-center text-sm text-gray-600">
                    <p className="font-medium mb-2">{t('auth.otp.howItWorks.title')}</p>
                    <ul className="space-y-1 text-xs">
                      <li>• {t('auth.otp.howItWorks.step1')}</li>
                      <li>• {t('auth.otp.howItWorks.step2')}</li>
                      <li>• {t('auth.otp.howItWorks.step3')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>

      <Footer t={t} />
    </div>
  )
}