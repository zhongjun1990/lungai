// JWT Utilities

/**
 * Parse JWT expiresIn string to seconds
 * Handles formats like "24h", "7d", "3600"
 */
export function parseExpiresIn(expiresIn: string): number {
  if (!expiresIn) return 86400; // default 24h

  // If it's just a number, use it
  if (/^\d+$/.test(expiresIn)) {
    return parseInt(expiresIn, 10);
  }

  // Parse units
  const match = expiresIn.match(/^(\d+)([smhdw])$/);
  if (!match) return 86400;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
  };

  return value * (multipliers[unit] || 3600);
}
