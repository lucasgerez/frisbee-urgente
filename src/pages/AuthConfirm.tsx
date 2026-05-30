import { useEffect, useState } from 'react'
import type { EmailOtpType } from '@supabase/supabase-js'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { LoadingScreen } from '../components/ui/Spinner'
import { supabase } from '../lib/supabase'

const allowedOtpTypes = new Set<string>([
  'email',
  'signup',
  'magiclink',
  'recovery',
  'invite',
  'email_change',
])

export function AuthConfirm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const confirmEmail = async () => {
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (!tokenHash || !type || !allowedOtpTypes.has(type)) {
        if (isMounted) {
          setError('Link de confirmacao invalido ou incompleto.')
        }
        return
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType,
      })

      if (!isMounted) return

      if (verifyError) {
        setError(verifyError.message)
        return
      }

      navigate('/login?confirmed=1', { replace: true })
    }

    void confirmEmail()

    return () => {
      isMounted = false
    }
  }, [navigate, searchParams])

  if (!error) return <LoadingScreen />

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Confirmar email</h1>
        <p className="text-sm text-gray-500 mt-1">
          Nao foi possivel confirmar seu cadastro com este link.
        </p>
      </div>

      <ErrorMessage message={error} />

      <div className="space-y-2 text-center">
        <Link to="/signup" className="block text-sm font-medium text-cobalt-700">
          Criar conta novamente
        </Link>
        <Link to="/login" className="block text-sm font-medium text-cobalt-700">
          Voltar para entrar
        </Link>
      </div>
    </div>
  )
}
