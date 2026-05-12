'use client'

import { useState, useRef } from 'react'

interface Props {
  name: string
  label: string
  initialTags: string[]
}

export default function TagEditor({ name, label, initialTags }: Props) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag() {
    const value = inputRef.current?.value.trim() ?? ''
    if (!value || tags.includes(value)) return
    setTags((prev) => [...prev, value])
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const isTeach = name === 'canTeach'
  const accentColor = isTeach ? '#f59e0b' : '#22c55e'
  const tagBg = isTeach ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.08)'
  const tagBorder = isTeach ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.2)'

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
        <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>
          {label}
        </label>
        <span className="text-xs" style={{ color: '#334155' }}>{tags.length} skill{tags.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tags */}
      <div
        className="flex flex-wrap gap-1.5 mb-3 min-h-[2rem] p-2 rounded-lg"
        style={{ background: '#0f172a', border: '1px solid #1e293b' }}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: tagBg, color: accentColor, border: `1px solid ${tagBorder}` }}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              className="leading-none opacity-60 hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-xs italic self-center ml-1" style={{ color: '#334155' }}>Add skills below</span>
        )}
      </div>

      {/* Add input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder={`Add a skill (e.g. ${isTeach ? 'Python, design, SQL' : 'React, leadership'})`}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
          className="flex-1 px-3 py-2 text-sm rounded-lg transition-all duration-150"
          style={{ background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', outline: 'none' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.boxShadow = `0 0 0 2px ${accentColor}22` }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.boxShadow = 'none' }}
        />
        <button
          type="button"
          onClick={addTag}
          className="px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150"
          style={{ background: tagBg, color: accentColor, border: `1px solid ${tagBorder}` }}
        >
          + Add
        </button>
      </div>

      <input type="hidden" name={name} value={JSON.stringify(tags)} />
    </div>
  )
}
