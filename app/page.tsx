import Link from 'next/link'

const features = [
  { icon: '📚', title: 'Share expertise', desc: 'Offer skills you know to colleagues who want to learn' },
  { icon: '🔄', title: 'Mutual exchange', desc: 'Both parties commit — fair, reciprocal, no cost' },
  { icon: '🤝', title: 'Direct connection', desc: 'Agree on terms together through a simple proposal flow' },
]

export default function HomePage() {
  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>
      {/* Nav */}
      <header style={{ borderBottom: '1px solid #1e293b' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
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
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signup"
              className="text-xs font-semibold px-4 py-2 rounded-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a' }}
            >
              Get started →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div
          className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-8"
          style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          <span>✦</span> Internal knowledge exchange platform
        </div>

        <h1
          className="text-5xl sm:text-6xl font-bold mb-6 leading-tight"
          style={{ color: '#f8fafc', fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-1px' }}
        >
          Teach what you know.<br />
          <span style={{ color: '#f59e0b' }}>Learn what you don&apos;t.</span>
        </h1>

        <p className="text-lg mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: '#64748b' }}>
          Propose skill-for-skill swaps with your colleagues.
          Structured, mutual, and built on genuine exchange.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/auth/signup"
            className="text-sm font-semibold px-6 py-3 rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a' }}
          >
            Create your account →
          </Link>
          <Link
            href="/auth/signin"
            className="text-sm font-medium px-6 py-3 rounded-xl transition-colors"
            style={{ color: '#94a3b8', border: '1px solid #334155' }}
          >
            Sign in
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-3 gap-4 mt-20">
          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl p-6 text-left"
              style={{ background: '#1e293b', border: '1px solid #334155' }}
            >
              <div className="text-2xl mb-3">{icon}</div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#f8fafc' }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
