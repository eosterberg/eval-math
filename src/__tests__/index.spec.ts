import {describe, it, expect} from 'vitest';
import {EvaluationContext, evalMath, em, evalIncremental} from '..';

describe('Math expression evaluator', () => {
  it.each([
    // Basic expressions
    '-2 + 3',
    '-8 * 3',
    '(26 + 4) * 4',
    '1+2*3',
    '(1+2)*3',
    '13121 * 30.5 + (4+ 4 - (3 - 3     )) / 5 * 10',
    // Advanced expressions
    '2**3**3',
    '(2**3)**3',
    '12 * 2**-2 + 5 * -7',
    '11 % 3',
    '(-9) % 4',
    '762121 & 82343',
    '934217 | 12377',
    '213421 ^ 42341',
    '1 << 2',
    '(-1) >> 1',
    '(-1) >>> 1',
    '~7',
  ])('Matches the result of raw eval("%s")', (expression: string) => {
    const calculated = evalMath(expression);
    const evaluated = eval(expression);

    expect(calculated, 'Calculated and evaluated results differ').toBe(
      evaluated
    );
  });

  it.each([
    'abs',
    'acos',
    'acosh',
    'asin',
    'asinh',
    'atan',
    'atanh',
    'ceil',
    'cbrt',
    'expm1',
    'clz32',
    'cos',
    'cosh',
    'exp',
    'floor',
    'fround',
    'imul',
    'log',
    'log1p',
    'log2',
    'log10',
    'round',
    'sign',
    'sin',
    'sinh',
    'sqrt',
    'tan',
    'tanh',
    'trunc',
  ])('Evaluates the function %s correctly', (name: string) => {
    const value = Math.random();
    const calculated = evalMath(`${name}(${value})`);
    const evaluated = eval(`Math.${name}(${value})`);

    expect(calculated, 'Calculated and evaluated results differ').toBe(
      evaluated
    );
  });

  it.each(['atan2', 'hypot', 'pow', 'min', 'max'])(
    'Evaluates the function %s correctly with two arguments',
    (name: string) => {
      const a = Math.random();
      const b = Math.random();
      const calculated = evalMath(`${name}(${a}, ${b})`);
      const evaluated = eval(`Math.${name}(${a}, ${b})`);

      expect(calculated, 'Calculated and evaluated results differ').toBe(
        evaluated
      );
    }
  );

  it('Evaluates the random function', () => {
    const result = evalMath('random()');
    expect(result).not.toBeNaN();
    expect(result).not.toBeLessThan(0);
    expect(result).not.toBeGreaterThan(1);
  });

  it.each(['E', 'LN10', 'LN2', 'LOG10E', 'LOG2E', 'PI', 'SQRT1_2', 'SQRT2'])(
    'Evaluates the constant %s correctly',
    (name: string) => {
      const calculated = evalMath(name);
      const evaluated = eval(`Math.${name}`);
      expect(calculated, 'Calculated and evaluated results differ').toBe(
        evaluated
      );
    }
  );

  it('Supports custom functions', () => {
    const context: EvaluationContext = new Map();
    context.set('avg', (a: number, b: number) => (a + b) / 2);
    const calculated = evalMath('avg(2, 3)', context);
    expect(calculated).toBe(2.5);
  });

  it('Supports custom constants', () => {
    const context: EvaluationContext = new Map();
    context.set('FEIGENBAUM_DELTA', 4.66920160910299);
    const calculated = evalMath('FEIGENBAUM_DELTA', context);
    expect(calculated).toBe(4.66920160910299);
  });

  it('Supports variable assignment', () => {
    const result = evalMath('x = 5; x *= 1 + 2; x - 4');
    expect(result).toBe(11);
  });

  it('Broadcasts values to vectors based on context', () => {
    const context: EvaluationContext = new Map();
    const t = new Float64Array(10).map((_, i) => 0.1 * i);
    context.set('t', t);
    const sinusoid = evalMath('sin(2*PI * t)', context);

    const expected = new Float64Array([
      0, 0.5877852522924731, 0.9510565162951535, 0.9510565162951535,
      0.5877852522924732, 0, -0.5877852522924734, -0.9510565162951535,
      -0.9510565162951536, -0.5877852522924734,
    ]);

    for (let i = 0; i < 10; ++i) {
      expect(sinusoid[i]).toBeCloseTo(expected[i]);
    }
  });

  it('Requires a size to create indepentent samples upon broadcasting', () => {
    const context: EvaluationContext = new Map();
    const one = new Float64Array(10).fill(1);
    context.set('one', one);
    const correlated = evalMath('one + random()', context);
    expect(correlated[0]).toBe(correlated[1]);

    const uncorrelated = evalMath('one + random(10)', context);
    expect(uncorrelated[0]).not.toBe(uncorrelated[1]);

    for (let i = 0; i < 10; ++i) {
      expect(correlated[i]).not.toBeLessThan(1);
      expect(correlated[i]).not.toBeGreaterThan(2);

      expect(uncorrelated[i]).not.toBeLessThan(1);
      expect(uncorrelated[i]).not.toBeGreaterThan(2);
    }
  });

  it('Has zeros like numpy', () => {
    const zeros = evalMath('zeros(5)') as Float64Array;
    expect(zeros).toHaveLength(5);
    zeros.every(el => expect(el).toBe(0));
  });

  it('Has ones like numpy', () => {
    const ones = evalMath('ones(6)') as Float64Array;
    expect(ones).toHaveLength(6);
    ones.every(el => expect(el).toBe(1));
  });

  it('Has arange like numpy', () => {
    const range = evalMath('arange(10)') as Float64Array;
    expect(range).toHaveLength(10);
    range.every((el, i) => expect(el).toBe(i));
  });

  it('Has linspace like numpy', () => {
    const space = evalMath('linspace(-1, 2)') as Float64Array;
    expect(space).toHaveLength(50);
    expect(space[0]).toBe(-1);
    expect(space.slice(-1)[0]).toBe(2);
  });

  it('Has a full_like counterpart', () => {
    const sevens = evalMath('z = zeros(11); fullLike(z, 7)') as Float64Array;
    expect(sevens).toHaveLength(11);
    sevens.every(el => expect(el).toBe(7));
  });

  it('Relies on JS semantics to prevent recursive vectorization', () => {
    const nans = evalMath(
      'invalidSize = full(3, 4); ones(invalidSize)'
    ) as Float64Array;
    nans.every(el => expect(el).toBeNaN());
  });

  it('Supports uniform for loops', () => {
    const phis = evalMath(`
      phis = arange(1, 6);
      for (i = 0; i < 3; ++i) {
        phis = 1 + 1 / phis;
      }
      phis;
    `);
    expect(phis[0]).toBeCloseTo(5 / 3);
    expect(phis[1]).toBeCloseTo(8 / 5);
    expect(phis[2]).toBeCloseTo(11 / 7);
    expect(phis[3]).toBeCloseTo(14 / 9);
    expect(phis[4]).toBeCloseTo(17 / 11);
  });

  it('Supports property and array access', () => {
    const three = evalMath('a = arange(5); a[a.length-2]');
    expect(three).toBe(3);
  });

  it('Supports array assignment', () => {
    const a = evalMath(
      'a = arange(5); a[a > 2] += 10; a[0] = -10; a'
    ) as Float64Array;
    expect(a).toEqual(new Float64Array([-10, 1, 2, 13, 14]));
  });

  it('Has a mathematically correct modulo', () => {
    const x = evalMath('mod(-9, 4)');
    expect(x).toBe(3);
  });

  it('Broadcasts binary functions', () => {
    const x = evalMath('hypot(1, arange(3))');
    const y = evalMath('hypot(1, arange(3))');
    const z = evalMath('hypot(10 - arange(3), arange(3))');

    expect(x).toEqual(y);

    expect(x[0]).toBeCloseTo(1);
    expect(x[1]).toBeCloseTo(Math.sqrt(2));
    expect(x[2]).toBeCloseTo(Math.sqrt(5));

    expect(z[0]).toBeCloseTo(10);
    expect(z[1]).toBeCloseTo(Math.sqrt(9 * 9 + 1 * 1));
    expect(z[2]).toBeCloseTo(Math.sqrt(8 * 8 + 2 * 2));
  });

  it('Has a broadcasting ternary operator', () => {
    const x = evalMath(
      'a = arange(3); b = arange(3)**2; c = !arange(3); a ? b : c'
    );
    expect(x).toEqual(new Float64Array([1, 1, 4]));
  });

  it('Supports user-defined functions', () => {
    const x = evalMath(`
      function geomMean(a, b) {
        return sqrt(a * b);
      }
      geomMean(9, 25);
    `);
    expect(x).toBe(15);
  });

  it('Respects the return statement of user-defined functions', () => {
    const x = evalMath(`
      quux = 0;
      baz = 5;
      bar = 3;
      function foo() {
        quux = 1;  // Should be visible
        var baz = -10;  // Should have no effect
        return 1;
        // Should be unreachable
        bar = 9001;
        2;
      }
      foo() + bar + baz + quux;
    `);
    expect(x).toBe(1 + 3 + 5 + 1);
  });

  it('Supports logical operators with short circuiting', () => {
    const x = evalMath('b = 0; (a = 0) && (b = 999); a + b');
    expect(x).toBe(0);
    const y = evalMath('b = 0; (a = 1) || (b = 999); a + b');
    expect(y).toBe(1);
  });

  it('Converts arrays into Float64Arrays', () => {
    const arr = evalMath('[1e6, 1e-6, Infinity, NaN]');
    expect(arr).toHaveLength(4);
    expect(arr).toBeInstanceOf(Float64Array);
    expect(arr[0]).toBe(1000000);
    expect(arr[1]).toBe(0.000001);
    expect(arr[2]).toBe(Infinity);
    expect(arr[3]).toBeNaN();
  });

  it('Has numeric versions of isFinite and isNaN', () => {
    const yes = evalMath('isFinite(7)');
    const no = evalMath('isNaN(7)');
    expect(yes).toBe(1);
    expect(no).toBe(0);
  });

  it('Supports throwing', () => {
    expect(() => evalMath('throw PI')).toThrow();
    try {
      evalMath('throw 8');
    } catch (e) {
      expect(e).toBe(8);
    }
  });

  it('Supports for...in', () => {
    const sum = evalMath('sum = 0; for (i in zeros(4)) sum += i');
    expect(sum).toBe(0 + 1 + 2 + 3);
  });

  it('Supports for...of', () => {
    const sum = evalMath('sum = 0; for (var i of 2*arange(4)) sum += i');
    expect(sum).toBe(0 + 2 + 4 + 6);
  });

  it('Reserves const', () => {
    expect(() => evalMath('const = 42')).toThrow();
  });

  it('Reserves let', () => {
    expect(() => evalMath('let = 42')).toThrow();
  });

  it('Supports if...else', () => {
    const five = evalMath('if (1) 5; else 7');
    expect(five).toBe(5);
  });

  it('Supports break and continue', () => {
    const x = evalMath(`
      a = 0;
      b = 0;
      for (var i = 0; i < 6; ++i) {
        b = i;
        if (i < 2) {
          continue;
        }
        a += i;
        if (i == 4) {
          break;
        }
      }
      a + b;
    `);
    expect(x).toBe(2 + 3 + 4 + 4);
  });
});

describe('Tagged template evaluator', () => {
  it('Behaves like evalMath/eval for basic expressions', () => {
    expect(em`-2 + 3`).toBe(eval('-2 + 3'));
    expect(em`13121 * 30.5 + (4+ 4 - (3 - 3     )) / 5 * 10`).toBe(
      eval('13121 * 30.5 + (4+ 4 - (3 - 3     )) / 5 * 10')
    );
  });

  it('Can be nested', () => {
    expect(em`2 + ${em`3`} * 5`).toBe(17);
  });

  it('Can be used to vectorize addition', () => {
    const oneTwoThree = new Float64Array([1, 2, 3]);
    const primes = new Float64Array([2, 3, 5]);
    const sum = em`${oneTwoThree} + ${primes}`;
    expect(sum).toHaveLength(3);
    expect(sum[0]).toBe(3);
    expect(sum[1]).toBe(5);
    expect(sum[2]).toBe(8);
  });
});

describe('Incremental evaluator', () => {
  it('Can model an infinite impulse response', () => {
    const output = new Float64Array(5);
    const n = output.map((_, i) => i);
    const weave = (i: number) => output[i] ?? 0;
    const context: EvaluationContext = new Map();
    context.set('n', n);
    context.set('weave', weave);
    evalIncremental('(n == 0) + 0.5 * weave(n-1)', output, context);
    expect(output).toEqual(new Float64Array([1, 0.5, 0.25, 0.125, 0.0625]));
  });

  it('Can do non-uniform for loops', () => {
    const output = new Float64Array(5);
    const n = output.map((_, i) => i);
    const context: EvaluationContext = new Map();
    context.set('n', n);
    evalIncremental(
      `
        res = 0;
        for (i = 0; i < n; ++i) {
          res += i;
        }
        res
      `,
      output,
      context
    );
    expect(output).toEqual(new Float64Array([0, 0, 1, 3, 6]));
  });
});
