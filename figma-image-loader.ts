'use client'

import type { ImageLoaderProps } from 'next/image'

/** Loader compatible con Payload en Vercel/Netlify y con Figma Make cuando aplica. */
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src) return ''
  if (/^https?:\/\//i.test(src)) return src

  const w = width || 640
  const q = quality ?? 75

  if (src.includes('/api/') && src.includes('/file/')) {
    const sep = src.includes('?') ? '&' : '?'
    return `${src}${sep}width=${w}&quality=${q}`
  }

  return src
}
