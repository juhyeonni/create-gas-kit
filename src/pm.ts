export type PackageManager = 'npm' | 'pnpm' | 'bun'

export function detectPm(
  userAgent: string | undefined = process.env.npm_config_user_agent,
): PackageManager {
  if (!userAgent) return 'npm'
  if (userAgent.startsWith('pnpm')) return 'pnpm'
  if (userAgent.startsWith('bun')) return 'bun'
  return 'npm'
}

export function installCommand(pm: PackageManager): string {
  return `${pm} install`
}

export function runCommand(pm: PackageManager, script: string): string {
  if (pm === 'pnpm') return `pnpm ${script}`
  if (pm === 'bun') return `bun run ${script}`
  return `npm run ${script}`
}
