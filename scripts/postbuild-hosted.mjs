/** Ejecutado tras `build:hosted` en Vercel/Netlify. Semilla demo solo si SEED_DEMO=true. */
if (process.env.FIGMA === '1') process.exit(0)
if (process.env.SEED_DEMO !== 'true') {
  console.log('[postbuild] SEED_DEMO no está activo; omitiendo seed.')
  process.exit(0)
}

await import('./seed-platform.mjs')
