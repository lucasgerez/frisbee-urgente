import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { LoadingScreen } from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isLoading, isEditor, session, user, profile, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = searchParams.get('redirectTo') || '/jogos'

  useEffect(() => {
    if (!isLoading && session && isEditor) {
      navigate(redirectTo, { replace: true })
    }
  }, [isLoading, isEditor, navigate, redirectTo, session])

  if (isLoading) return <LoadingScreen />

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setIsSubmitting(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    if (data.session?.user.app_metadata?.role !== 'editor') {
      setError('Sua conta não tem permissão de editor.')
      return
    }

    navigate(redirectTo, { replace: true })
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao sair')
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Entrar</h1>
        <p className="text-sm text-gray-500 mt-1">
          Acesso necessario para criar, editar e anotar jogos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            required
            autoComplete="current-password"
          />
        </div>

        {session && !isEditor && (
          <ErrorMessage message="Sua conta esta autenticada, mas nao tem permissao de editor." />
        )}
        {error && <ErrorMessage message={error} />}
        {session && user && (
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700 space-y-1">
            <div><span className="font-semibold">Usuario:</span> {profile?.full_name || user.email}</div>
            <div><span className="font-semibold">Email:</span> {user.email}</div>
            <div><span className="font-semibold">Role:</span> {isEditor ? 'editor' : 'sem permissao'}</div>
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" loading={isSubmitting} className="flex-1">
            Entrar
          </Button>
          {session && (
            <Button type="button" variant="secondary" onClick={handleSignOut}>
              Sair
            </Button>
          )}
        </div>
      </form>

      <Link to="/jogos" className="block text-center text-sm font-medium text-cobalt-700">
        Voltar para jogos
      </Link>
    </div>
  )
}
