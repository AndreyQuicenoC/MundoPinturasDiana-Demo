/** Demo publicable sin base de datos externa: datos mock en memoria. */
export function isDemoMock(): boolean {
  if (process.env.FIGMA === '1') return false
  if (process.env.DEMO_MOCK === '0' || process.env.DEMO_MOCK === 'false') return false
  if (process.env.DEMO_MOCK === '1' || process.env.DEMO_MOCK === 'true') return true
  // En Netlify/Vercel esta demo siempre es mock (aunque quede DATABASE_URI viejo en el panel).
  if (process.env.NETLIFY === 'true' || process.env.VERCEL === '1' || process.env.VERCEL_ENV) return true
  const db = process.env.DATABASE_URI || process.env.DATABASE_URL
  return !db
}
