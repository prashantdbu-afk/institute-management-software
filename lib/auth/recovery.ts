export const PASSWORD_RECOVERY_CALLBACK_PATH = "/auth/callback"
export const PASSWORD_RESET_PATH = "/auth/reset-password"

export function getSafeRecoveryDestination(next: string | null) {
  return next === PASSWORD_RESET_PATH ? next : PASSWORD_RESET_PATH
}
