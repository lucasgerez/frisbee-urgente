import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface AdminUser {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  created_at: string
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-users', { method: 'GET' })
      if (error) throw error
      return data.users as AdminUser[]
    },
  })
}

export function useUpdateUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string | null }) => {
      const { error } = await supabase.functions.invoke('admin-users', {
        method: 'PATCH',
        body: { userId, role },
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}
