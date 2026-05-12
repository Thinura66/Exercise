import SignupForm from './SignupForm'

export default function SignupPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 lg:p-0"
      style={{ background: '#0f172a' }}
    >
      {/* Ambient glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.05) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-2xl" style={{ minHeight: 560 }}>

        {/* ── Left brand panel ── */}
        <div
          className="hidden lg:flex flex-col justify-between w-[42%] p-12"
          style={{ background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)', borderRight: '1px solid #1e293b' }}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-12">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 5h10M3 8h7M3 11h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M12 10l2 2-2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#64748b' }}>
                Skill Swap Board
              </span>
            </div>

            <h1
              className="text-4xl font-bold leading-tight mb-4"
              style={{ color: '#f8fafc', fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.5px' }}
            >
              Join the<br />
              knowledge<br />
              <span style={{ color: '#f59e0b' }}>exchange.</span>
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
              Create your account to start proposing and receiving skill swaps with your colleagues.
            </p>
          </div>

          <div className="text-xs leading-relaxed" style={{ color: '#475569' }}>
            Already have an account?{' '}
            <a href="/auth/signin" style={{ color: '#f59e0b' }}>Sign in instead</a>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div
          className="flex-1 flex items-center justify-center p-8 lg:p-12"
          style={{ background: '#0f172a' }}
        >
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
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

            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: '#f8fafc', fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Create account
            </h2>
            <p className="text-sm mb-8" style={{ color: '#64748b' }}>
              Fill in your details to get started
            </p>

            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  )
}
