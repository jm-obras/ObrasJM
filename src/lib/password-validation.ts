/**
 * Password validation utility for ObrasJM
 * VULN-007 FIX: Enforce password complexity policy
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (!password || password.length < 8) {
    errors.push('al menos 8 caracteres')
  }

  if (password && !/[A-Z]/.test(password)) {
    errors.push('al menos una letra mayúscula')
  }

  if (password && !/[a-z]/.test(password)) {
    errors.push('al menos una letra minúscula')
  }

  if (password && !/[0-9]/.test(password)) {
    errors.push('al menos un número')
  }

  if (password && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('al menos un carácter especial (!@#$%^&*...)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function formatPasswordError(errors: string[]): string {
  return `La contraseña debe tener: ${errors.join(', ')}`
}
