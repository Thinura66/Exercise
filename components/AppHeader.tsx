import Link from 'next/link'

interface Props {
  userName?: string
  showNav?: boolean
}

export default function AppHeader({ userName, showNav = true }: Props) {
  return (
    <header style={{ background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 5h10M3 8h7M3 11h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M12 10l2 2-2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#64748b' }}>
            Skill Swap Board
          </span>
        </Link>

        {showNav && (
          <nav className="flex items-center gap-5">
            <Link href="/dashboard" className="text-xs font-medium transition-colors" style={{ color: '#64748b' }}>
              Dashboard
            </Link>
            <Link href="/profile/me" className="text-xs font-medium transition-colors" style={{ color: '#64748b' }}>
              My Profile
            </Link>
            {userName && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#1e293b', color: '#f59e0b', border: '1px solid #334155' }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
