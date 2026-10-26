import { buildConfig } from 'payload'
import { buildFigmaConfig } from '@payloadcms/figma'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { isFigmaMake, sharedPayloadConfig } from './payload.build'

const hostedDb = () => {
  const connectionString = process.env.DATABASE_URI || process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'DATABASE_URI (PostgreSQL) es obligatorio en Vercel/Netlify. Usa Neon, Supabase o Vercel Postgres.',
    )
  }
  return postgresAdapter({
    pool: { connectionString },
    push: process.env.PAYLOAD_DB_PUSH !== 'false',
  })
}

const hostedSecret = () => {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('PAYLOAD_SECRET debe tener al menos 16 caracteres en Vercel/Netlify.')
  }
  return secret
}

export default isFigmaMake()
  ? buildFigmaConfig({
      ...sharedPayloadConfig,
      plugins: [mcpPlugin({})],
      figma: {},
    })
  : buildConfig({
      ...sharedPayloadConfig,
      secret: hostedSecret(),
      editor: lexicalEditor(),
      db: hostedDb(),
      plugins: [],
    })
