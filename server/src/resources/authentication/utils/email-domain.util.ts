export function extractEmailDomain(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2 || !parts[1]) {
    throw new Error('Invalid email format');
  }
  return parts[1];
}
