/**
 * Mathematically correct modulo.
 * @param a The dividend.
 * @param b The divisor.
 * @returns The remainder of Euclidean division of a by b.
 */
function mod(a: number, b: number) {
  return ((a % b) + b) % b;
}

function step(x: number) {
  return Number(x >= 0);
}

function limit(x: number) {
  return x < -1 ? -1 : x > 1 ? 1 : x;
}

function isFiniteNumeric(x: number) {
  return Number(isFinite(x));
}

function isNaNNumeric(x: number) {
  return Number(isNaN(x));
}

export const EXTRA_FUNCTIONS: Record<string, Function> = {
  isFinite: isFiniteNumeric,
  isNaN: isNaNNumeric,
  mod,
  step,
  limit,
};

export const EXTRA_CONSTANTS: Record<string, number> = {
  TAU: 2 * Math.PI,
  Infinity,
  NaN,
};
