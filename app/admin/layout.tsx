import AdminLoginGate from '@/app/admin/_components/AdminLoginGate'
import AdminNav from '@/app/admin/_components/AdminNav'
import AdminSignOutButton from '@/app/admin/_components/AdminSignOutButton'
import ThemeToggle from '@/app/admin/_components/ThemeToggle'
import { getAdminViewer } from '@/lib/admin-auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const gate = await getAdminViewer()

  if (!gate.ok) {
    if (gate.reason === 'not_logged_in') return <AdminLoginGate />

    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div
          className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-zinc-100 mb-2">Access denied</h1>
          <p className="text-sm text-zinc-500 mb-6">
            Your account doesn&apos;t have permission. Contact an admin to request access.
          </p>
          <AdminSignOutButton />
        </div>
      </div>
    )
  }

  const emailInitial = (gate.viewer.email ?? '?')[0].toUpperCase()

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <aside
        className="w-56 shrink-0 fixed inset-y-0 flex flex-col"
        style={{ background: '#0d0d0f', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Brand */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-100 leading-tight">Prompt Chain</div>
              <div className="text-[10px] text-zinc-600 leading-tight mt-0.5">Admin Tool</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <AdminNav />
        </div>

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <ThemeToggle />
          <div className="flex items-center gap-2.5 mb-2.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-violet-300 shrink-0"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              {emailInitial}
            </div>
            <div className="text-xs text-zinc-500 truncate min-w-0">
              {gate.viewer.email ?? gate.viewer.userId}
            </div>
          </div>
          <AdminSignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-56 flex-1 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  )
}
