import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { LoadingScreen } from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'

const MIN_PASSWORD_LENGTH = 6

export function Signup() {
  const { isLoading, signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  if (isLoading && !isSubmitting) return <LoadingScreen />

  const validateForm = () => {
    if (!fullName.trim()) return 'Informe seu nome.'
    if (!email.trim()) return 'Informe seu email.'
    if (!password) return 'Informe uma senha.'
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
    }
    if (password !== confirmPassword) return 'As senhas nao conferem.'
    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)

    try {
      await signUp(fullName.trim(), email.trim(), password)
      setIsSuccess(true)
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar conta')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Criar conta</h1>
        <p className="text-sm text-gray-500 mt-1">
          Use seu email para criar um usuario. Voce recebera a confirmacao por email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fullName">
            Nome completo
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            required
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="signupEmail">
            Email
          </label>
          <input
            id="signupEmail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="signupPassword">
            Senha
          </label>
          <input
            id="signupPassword"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
        </div>

        {error && <ErrorMessage message={error} />}
        {isSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
            Conta criada. Verifique seu email para confirmar o cadastro antes de entrar.
          </div>
        )}

        <Button type="submit" loading={isSubmitting} className="w-full">
          Criar conta
        </Button>
      </form>

      <div className="space-y-2 text-center">
        {isSuccess && (
          <Link to="/jogos" className="block text-sm font-medium text-cobalt-700">
            Ir para jogos
          </Link>
        )}
        <Link to="/login" className="block text-sm font-medium text-cobalt-700">
          Ja tenho conta
        </Link>
      </div>
    </div>
  )
}
