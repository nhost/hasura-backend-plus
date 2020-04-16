// * Helpers for casting environment variables
export const castBooleanEnv = (envVar: string, defaultValue = false): boolean =>
  process.env[envVar] ? process.env[envVar]?.toLowerCase() === 'true' : defaultValue
export const castIntEnv = (envVar: string, defaultValue: number): number =>
  parseInt(process.env[envVar] as string, 10) || defaultValue
export const castStringArrayEnv = (envVar: string): string[] =>
  (process.env[envVar] || '').split(',').map((field) => field.trim())
