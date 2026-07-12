import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

  if (userError || !user) return json({ error: 'Unauthorized' }, 401)
  if (user.app_metadata?.role !== 'admin') return json({ error: 'Forbidden' }, 403)

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    if (error) return json({ error: error.message }, 500)

    const users = data.users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      full_name: typeof u.user_metadata?.full_name === 'string' ? u.user_metadata.full_name : null,
      role: typeof u.app_metadata?.role === 'string' ? u.app_metadata.role : null,
      created_at: u.created_at,
    }))

    return json({ users })
  }

  if (req.method === 'PATCH') {
    const body = await req.json().catch(() => null)
    if (!body?.userId) return json({ error: 'userId obrigatorio' }, 400)

    const role = typeof body.role === 'string' ? body.role : null
    const { error } = await supabaseAdmin.auth.admin.updateUserById(body.userId, {
      app_metadata: { role },
    })

    if (error) return json({ error: error.message }, 500)
    return json({ success: true })
  }

  return json({ error: 'Metodo nao permitido' }, 405)
})
