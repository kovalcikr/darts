export function withSeason(path: string, season?: string | null) {
  if (!season) {
    return path
  }

  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}season=${encodeURIComponent(season)}`
}
