interface Props {
  name: string
  canTeach: string[]
  wantToLearn: string[]
}

export default function ProfileCard({ name, canTeach, wantToLearn }: Props) {
  return (
    <div
      className="rounded-2xl p-6 w-full max-w-lg"
      style={{ background: '#1e293b', border: '1px solid #334155' }}
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #f59e0b22, #d9770622)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: '#f8fafc', fontFamily: 'Georgia, serif' }}>{name}</h1>
          <p className="text-xs" style={{ color: '#475569' }}>Skill Swap Board member</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Can Teach */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>
              Can Teach
            </h2>
          </div>
          {canTeach.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {canTeach.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs italic" style={{ color: '#334155' }}>No skills listed yet</p>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#334155' }} />

        {/* Wants to Learn */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>
              Wants to Learn
            </h2>
          </div>
          {wantToLearn.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {wantToLearn.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs italic" style={{ color: '#334155' }}>No skills listed yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
