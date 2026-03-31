'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

const links = [
  { href: '/',            label: 'Dashboard' },
  { href: '/assign',      label: 'Assign Desk' },
  { href: '/assignments', label: 'All Assignments' },
  { href: '/students',    label: 'Students' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-14">
        <span className="font-bold text-lg text-slate-800 tracking-tight">
          📚 Desk Manager
        </span>
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="ml-3 px-3 py-1.5 rounded-md text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors border border-slate-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}
