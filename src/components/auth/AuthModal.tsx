'use client'

import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Dialog } from 'primereact/dialog'
import { Divider } from 'primereact/divider'
import { InputText } from 'primereact/inputtext'
import { Message } from 'primereact/message'
import { Password } from 'primereact/password'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface AuthModalProps {
  visible: boolean
  onHide: () => void
  onSuccess: () => void
}

export function AuthModal({ visible, onHide, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: authError } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password)

      if (authError) {
        setError(getErrorMessage(authError.message))
      } else {
        // Connexion ou inscription réussie, fermer la modal et exécuter l'action
        onSuccess()
        onHide()
      }
    } catch {
      setError("Une erreur inattendue s'est produite")
    }

    setLoading(false)
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setLoading(false)
  }

  const handleHide = () => {
    resetForm()
    onHide()
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    resetForm()
  }

  const headerContent = (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
        <i className="pi pi-tag text-white text-sm"></i>
      </div>
      <div>
        <span className="text-lg font-bold text-gray-900">
          {isSignUp ? 'Créer un compte' : 'Se connecter'}
        </span>
        <p className="text-xs text-gray-500 mt-0">Lablr - Générateur d&apos;étiquettes</p>
      </div>
    </div>
  )

  const footerContent = (
    <div className="flex gap-2">
      <Button 
        label="Annuler" 
        icon="pi pi-times" 
        onClick={handleHide} 
        outlined 
        className="flex-1"
        disabled={loading}
      />
      <Button
        type="submit"
        label={loading 
          ? 'Connexion...' 
          : isSignUp 
            ? 'Créer un compte'
            : 'Se connecter'
        }
        icon={loading ? undefined : `pi ${isSignUp ? 'pi-user-plus' : 'pi-sign-in'}`}
        loading={loading}
        disabled={loading}
        className="flex-1"
        form="auth-form"
      />
    </div>
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
              <h3 className="font-semibold text-gray-900 mb-2">
                🎉 Utilisez Lablr gratuitement
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Une simple connexion vous permet d&apos;accéder à toutes les fonctionnalités d&apos;impression 
                d&apos;étiquettes sans aucun coût.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <i className="pi pi-shield-check text-green-500"></i>
                <span>Vos données d&apos;import ne sont jamais conservées</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Formulaire */}
        <form id="auth-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <i className="pi pi-envelope text-gray-400 text-xs"></i>
              Adresse email
            </label>
            <InputText
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              disabled={loading}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <i className="pi pi-lock text-gray-400 text-xs"></i>
              Mot de passe
            </label>
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? 'Choisissez un mot de passe sécurisé' : 'Votre mot de passe'}
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
            {isSignUp 
              ? '← Vous avez déjà un compte ? Se connecter'
              : '→ Nouveau sur Lablr ? Créer un compte'
            }
          </button>
        </div>

        {/* Garanties de confidentialité */}
        <div className="pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="text-xs text-gray-500 flex flex-col items-center gap-1">
              <i className="pi pi-check-circle text-green-500 text-sm"></i>
              <span>100% Gratuit</span>
            </div>
            <div className="text-xs text-gray-500 flex flex-col items-center gap-1">
              <i className="pi pi-lock text-blue-500 text-sm"></i>
              <span>Données sécurisées</span>
            </div>
            <div className="text-xs text-gray-500 flex flex-col items-center gap-1">
              <i className="pi pi-trash text-red-500 text-sm"></i>
              <span>Aucune conservation</span>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}

function getErrorMessage(message: string): string {
  // Traduction des messages d'erreur Supabase en français
  if (message.includes('Invalid login credentials')) {
    return 'Email ou mot de passe incorrect'
  }
  if (message.includes('Email not confirmed')) {
    return 'Veuillez confirmer votre email avant de vous connecter'
  }
  if (message.includes('Password should be at least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères'
  }
  if (message.includes('Unable to validate email address')) {
    return 'Adresse email invalide'
  }
  if (message.includes('User already registered')) {
    return 'Un compte existe déjà avec cette adresse email'
  }
  return message
}
