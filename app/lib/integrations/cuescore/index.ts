import { FakeCueScoreGateway } from './fake'
import { RealCueScoreGateway } from './real'
import { CueScoreGateway, CueScoreProviderName } from './types'

export function getCueScoreProviderName(env = process.env): CueScoreProviderName {
  const configuredProvider = env.CUESCORE_PROVIDER?.toLowerCase()
  if (configuredProvider === 'fake' || configuredProvider === 'real') {
    return configuredProvider
  }

  const hasCredentials = Boolean(env.CUESCORE_USERNAME && env.CUESCORE_PASSWORD)
  if (env.NODE_ENV === 'development' && !hasCredentials) {
    return 'fake'
  }

  return 'real'
}

export function getCueScoreGateway(): CueScoreGateway {
  return getCueScoreProviderName() === 'fake'
    ? new FakeCueScoreGateway()
    : new RealCueScoreGateway()
}
