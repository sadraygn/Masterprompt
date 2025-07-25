/**
 * Maps creativity slider value (0-10) to temperature (0-2)
 * Uses a non-linear curve for better control in the creative range
 */
export function mapCreativityToTemperature(creativity?: number): number {
  if (creativity === undefined || creativity === null) {
    return 0.7; // Default temperature
  }

  // Clamp creativity to 0-10 range
  const clampedCreativity = Math.max(0, Math.min(10, creativity));

  // Non-linear mapping for better control
  // 0-5: Maps to 0-0.8 (more conservative)
  // 5-10: Maps to 0.8-2.0 (more creative)
  if (clampedCreativity <= 5) {
    return (clampedCreativity / 5) * 0.8;
  } else {
    const normalized = (clampedCreativity - 5) / 5;
    return 0.8 + (normalized * 1.2);
  }
}