/** Demo publicable sin base de datos externa: datos mock en memoria. */
export function isDemoMock(): boolean {
  if (process.env.FIGMA === '1') return false
  if (process.env.DEMO_MOCK === '0' || process.env.DEMO_MOCK === 'false') return false
  if (process.env.DEMO_MOCK === '1' || process.env.DEMO_MOCK === 'true') return true
  // Sin PostgreSQL configurado → siempre mock (Netlify/Vercel/local .env mínimo)
  const db = process.env.DATABASE_URI || process.env.DATABASE_URL
  return !db
}
