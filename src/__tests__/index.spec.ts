import {describe, it, expect} from 'vitest';
import {EvaluationContext, evalMath} from '..';

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
});
