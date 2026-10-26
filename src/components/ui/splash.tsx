export function Blob({ className = '', color = '#E11D74' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden className={className}>
      <path fill={color} d="M44.7,-58.1C57.4,-47.9,66.6,-33.3,70.9,-17.3C75.1,-1.3,74.4,16.1,66.9,29.6C59.4,43.1,45.1,52.7,29.9,59.6C14.7,66.5,-1.4,70.7,-17.2,67.6C-33,64.5,-48.5,54.1,-58.3,40.2C-68.1,26.3,-72.2,8.9,-69.1,-6.8C-66,-22.5,-55.7,-36.5,-43.2,-46.8C-30.7,-57.1,-15.4,-63.7,0.6,-64.4C16.6,-65.1,32,-68.3,44.7,-58.1Z" transform="translate(100 100)" />
    </svg>
  )
}

export function Squiggle({ className = '', color = '#00ACC1' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 220 24" aria-hidden className={className} fill="none">
      <path className="draw-path" d="M3 12c12-14 22-14 34 0s22 14 34 0 22-14 34 0 22 14 34 0 22-14 34 0 22 14 34 0" stroke={color} strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

export function BrushUnderline({ className = '', color = '#E11D74' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden className={className} fill="none">
      <path className="draw-path" d="M4 12C60 4 120 16 180 8s80 4 116 2" stroke={color} strokeWidth="9" strokeLinecap="round" />
    </svg>
  )
}

export function Star({ className = '', color = '#FFC93C' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className}>
      <path fill={color} d="M50 0 61 39 100 50 61 61 50 100 39 61 0 50 39 39Z" />
    </svg>
  )
}

export function Sticker({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border-2 border-dashed border-plum/40 bg-sun/30 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-plum ${className}`}>
      {children}
    </span>
  )
}
