/**
 * Exact rational numbers for inheritance shares. Never use floats for quotas.
 * Integers are checked against Number.MAX_SAFE_INTEGER; overflow throws instead of rounding.
 */
export interface Fraction {
  readonly num: number;
  readonly den: number;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

function assertSafe(n: number): number {
  if (!Number.isSafeInteger(n)) throw new RangeError("Fraction overflow — exact arithmetic not possible.");
  return n;
}

export function frac(num: number, den = 1): Fraction {
  if (den === 0) throw new RangeError("Denominator must not be zero.");
  assertSafe(num);
  assertSafe(den);
  const sign = den < 0 ? -1 : 1;
  const g = gcd(num, den) || 1;
  return { num: (sign * num) / g, den: (sign * den) / g };
}

export const ZERO = frac(0);
export const ONE = frac(1);

export function add(a: Fraction, b: Fraction): Fraction {
  return frac(assertSafe(a.num * b.den + b.num * a.den), assertSafe(a.den * b.den));
}

export function sub(a: Fraction, b: Fraction): Fraction {
  return add(a, frac(-b.num, b.den));
}

export function mul(a: Fraction, b: Fraction): Fraction {
  return frac(assertSafe(a.num * b.num), assertSafe(a.den * b.den));
}

export function div(a: Fraction, b: Fraction): Fraction {
  if (b.num === 0) throw new RangeError("Division by zero.");
  return frac(assertSafe(a.num * b.den), assertSafe(a.den * b.num));
}

export function compare(a: Fraction, b: Fraction): number {
  return Math.sign(assertSafe(a.num * b.den) - assertSafe(b.num * a.den));
}

export function sum(values: Fraction[]): Fraction {
  return values.reduce(add, ZERO);
}

export function isZero(a: Fraction): boolean {
  return a.num === 0;
}

export function toString(a: Fraction): string {
  return a.den === 1 ? String(a.num) : `${a.num}/${a.den}`;
}
