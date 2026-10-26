/** Demo publicable sin base de datos externa: datos mock en memoria. */
export function isDemoMock(): boolean {
  if (process.env.FIGMA === '1') return false
  return process.env.DEMO_MOCK === '1' || process.env.DEMO_MOCK === 'true'
}
