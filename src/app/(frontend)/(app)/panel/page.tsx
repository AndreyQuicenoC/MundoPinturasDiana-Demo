import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'

export default async function PanelIndex() {
  const user = await appAuth.currentUser()
  redirect(user ? `/panel/${user.role}` : '/login')
}
