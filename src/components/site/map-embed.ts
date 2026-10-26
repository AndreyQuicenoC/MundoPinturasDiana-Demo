// Convierte lo que pegue el administrador (iframe de «Insertar un mapa», enlace de «Compartir» o
// dirección) en un `src` de mapa embebido seguro (solo Google Maps).
const GOOGLE_HOSTS = /^(www\.|maps\.)?google\.(com|com\.co)$/i

const fallback = (q: string) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`

export function mapEmbedSrc(input: string | null | undefined, address: string, mapQuery?: string | null): string {
  const fb = fallback(mapQuery?.trim() || `${address}, Cali, Colombia`)
  let raw = String(input ?? '').trim()
  if (!raw) return fb
  const iframe = raw.match(/src\s*=\s*["']([^"']+)["']/i)
  if (iframe) raw = iframe[1].replace(/&amp;/g, '&')
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return fb
  }
  if (u.protocol !== 'https:' || !GOOGLE_HOSTS.test(u.hostname)) return fb
  if (u.pathname.startsWith('/maps/embed')) return u.toString()
  const q = u.searchParams.get('q') || u.searchParams.get('query')
  if (q) return fallback(q)
  const at = u.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (at) return fallback(`${at[1]},${at[2]}`)
  const place = u.pathname.match(/\/place\/([^/]+)/)
  if (place) {
    try {
      return fallback(decodeURIComponent(place[1].replace(/\+/g, ' ')))
    } catch {}
  }
  return fb
}
