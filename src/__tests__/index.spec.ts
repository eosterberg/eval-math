import {describe, it, expect} from 'vitest';
import {evalMath} from '..';

describe('Math expression evaluator', () => {
  it.each([
    '-2 + 3',
    '-8 * 3',
    '(26 + 4) * 4',
    '1+2*3',
    '(1+2)*3',
    '13121 * 30.5 + (4+ 4 - (3 - 3     )) / 5 * 10',
  ])('Matches the result of raw eval("%s")', (expression: string) => {
    const calculated = evalMath(expression);
    const evaluated = eval(expression);

    expect(calculated, 'Calculated and evaluated results differ').toBe(
      evaluated
    );
  });
});
