// Make it like numpy

export type Numeric = number | Float64Array;

export function random(size?: number): Numeric {
  if (size === undefined) {
    return Math.random();
  }
  return new Float64Array(size).map(Math.random);
}

function zeros(size: number) {
  return new Float64Array(size).fill(0);
}

function ones(size: number) {
  return new Float64Array(size).fill(1);
}

function full(size: number, fillValue: number) {
  return new Float64Array(size).fill(fillValue);
}

function zerosLike(other: Numeric) {
  if (typeof other === 'number') {
    return 0;
  }
  return zeros(other.length);
}

function onesLike(other: Numeric) {
  if (typeof other === 'number') {
    return 1;
  }
  return ones(other.length);
}

function fullLike(other: Numeric, fillValue: number) {
  if (typeof other === 'number') {
    return fillValue;
  }
  return full(other.length, fillValue);
}

function arange(start: number, stop?: number, step?: number) {
  if (stop === undefined) {
    stop = start;
    start = 0;
  }
  if (step === undefined) {
    step = 1;
  }
  const size = Math.floor((stop - start) / step);

  return new Float64Array(size).map((_, i) => start + i * step!);
}

function linspace(start: number, stop: number, num = 50) {
  const step = (stop - start) / (num - 1);
  return new Float64Array(num).map((_, i) => start + i * step);
}

export const VECTOR_ROUTINES: Record<string, Function> = {
  zeros,
  ones,
  full,
  zerosLike,
  onesLike,
  fullLike,
  arange,
  linspace,
};
