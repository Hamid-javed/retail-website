'use client'

import { useRef, useState } from 'react'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
}

export function ImageUpload({ images, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    setUploading(true)
    const urls: string[] = []

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const { url } = await res.json()
        urls.push(url)
      }
    }

    onChange([...images, ...urls])
    setUploading(false)
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index))
  }

  function moveImage(from: number, to: number) {
    const next = [...images]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent" />
            <p className="text-sm text-gray-500">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-3xl">📸</div>
            <p className="text-sm font-medium text-gray-700">Drop images here or click to browse</p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP up to 10MB each</p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div key={url} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(i, i - 1)}
                    className="text-white bg-white/20 rounded p-1 text-xs hover:bg-white/40"
                  >←</button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="text-white bg-red-500/80 rounded p-1 text-xs hover:bg-red-500"
                >✕</button>
                {i < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(i, i + 1)}
                    className="text-white bg-white/20 rounded p-1 text-xs hover:bg-white/40"
                  >→</button>
                )}
              </div>
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-black text-white text-xs px-1.5 py-0.5 rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
