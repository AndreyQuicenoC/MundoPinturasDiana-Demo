import { buildFigmaConfig } from '@payloadcms/figma'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { isFigmaMake, sharedPayloadConfig } from './payload.build'

/** En demo mock el runtime usa `mock-payload`; este stub evita adapters de BD en el bundle. */
const demoConfigStub = {
  ...sharedPayloadConfig,
  secret: process.env.PAYLOAD_SECRET || 'demo-mock-secret-minimum-32-characters!!',
} as Record<string, unknown>

export default isFigmaMake()
  ? buildFigmaConfig({
      ...sharedPayloadConfig,
      plugins: [mcpPlugin({})],
      figma: {},
    })
  : demoConfigStub
