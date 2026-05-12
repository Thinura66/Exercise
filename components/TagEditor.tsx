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

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>

      <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              className="text-indigo-500 hover:text-indigo-700 leading-none"
            >
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-sm text-gray-400 italic">No tags yet</span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder={`Add a ${label.toLowerCase()} skill…`}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
          className="border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={addTag}
          className="bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-indigo-700"
        >
          Add
        </button>
      </div>

      <input type="hidden" name={name} value={JSON.stringify(tags)} />
    </div>
  )
}
