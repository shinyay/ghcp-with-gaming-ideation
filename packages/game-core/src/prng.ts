export interface PrngStep {
  readonly state: number;
  readonly value: number;
}

export function nextXorShift32(currentState: number): PrngStep {
  let value = currentState | 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  const state = value >>> 0;
  return { state, value: state };
}
