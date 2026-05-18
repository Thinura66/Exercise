type Props = {
  label: string
  value: number
  highlight?: boolean
}

export default function StatsCard({ label, value, highlight }: Props) {
  const active = highlight && value > 0
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        background: active ? 'rgba(245,158,11,0.08)' : '#1e293b',
        border: `1px solid ${active ? 'rgba(245,158,11,0.2)' : '#334155'}`,
      }}
    >
      <div
        className="text-2xl font-bold"
        style={{ color: active ? '#f59e0b' : '#f8fafc', fontFamily: 'Georgia, serif' }}
      >
        {value}
      </div>
      <div className="text-sm mt-0.5" style={{ color: '#64748b' }}>{label}</div>
    </div>
  )
}
