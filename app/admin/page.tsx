import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/server-auth'
import { AdminConsole } from '@/components/admin-console'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  try {
    await requireAdmin()
  } catch (error) {
    // If not authenticated or not the authorized admin email, strictly redirect to home page
    redirect('/')
  }

  return <AdminConsole />
}
