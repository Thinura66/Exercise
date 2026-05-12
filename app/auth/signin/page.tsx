import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import SignInForm from './SignInForm'

export default async function SignInPage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 lg:p-0"
      style={{ background: '#0f172a' }}
    >
      {/* Ambient glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Card */}
      <div className="relative w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-2xl" style={{ minHeight: 540 }}>

        {/* ── Left brand panel ── */}
        <div
          className="hidden lg:flex flex-col justify-between w-[42%] p-12"
          style={{ background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)', borderRight: '1px solid #1e293b' }}
        >
          {/* Logo mark */}
          <div>
            <div className="flex items-center gap-2.5 mb-12">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 5h10M3 8h7M3 11h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M12 10l2 2-2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#94a3b8' }}>
                Skill Swap Board
              </span>
            </div>

            <h1
              className="text-4xl font-bold leading-tight mb-4"
              style={{ color: '#f8fafc', fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.5px' }}
            >
              Teach what<br />
              you know.<br />
              <span style={{ color: '#f59e0b' }}>Learn what<br />you don&apos;t.</span>
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
              Connect with colleagues through skill exchange. Share expertise, build relationships, grow together.
            </p>
          </div>

          {/* Bottom decorative stat */}
          <div className="flex gap-6">
            <div>
              <div className="text-2xl font-bold" style={{ color: '#f59e0b', fontFamily: 'Georgia, serif' }}>2×</div>
              <div className="text-xs" style={{ color: '#475569' }}>Faster learning</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#f59e0b', fontFamily: 'Georgia, serif' }}>∞</div>
              <div className="text-xs" style={{ color: '#475569' }}>Skills to share</div>
            </div>
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
              Welcome back
            </h2>
            <p className="text-sm mb-8" style={{ color: '#64748b' }}>
              Sign in to your account to continue
            </p>

            <SignInForm />
          </div>
        </div>
      </div>
    </div>
  )
}
