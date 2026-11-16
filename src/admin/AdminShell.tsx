import { RequireAdmin } from './components/RequireAdmin'
import { AdminLayout } from './components/AdminLayout'

/** Every /admin/* route (except login) renders inside this guard + layout. */
export default function AdminShell() {
  return (
    <RequireAdmin>
      <AdminLayout />
    </RequireAdmin>
  )
}
