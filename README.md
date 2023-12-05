# eval-math

Javascript library for evaluating math expressions.

Supports `+ - * / **` parentheses and `Math` functions.

## Usage:
```typescript
import {evalMath} from 'eval-math';

evalMath('13121 * 30.5 + (4+ 4 - (3 - 3     )) / 5 * 10');
// 400206.5
```

### Tagged template literals
```typescript
import {em} from 'eval-math';

const primes = new Float64Array([2, 3, 5, 7]);

em`
    p = ${primes};
    r = arange(4);

    // Evaluates to a vectorized sum: [2+0, 3+1, 5+2, 7+3]
    p + r;
`;
// Float64Array(4) [ 2, 4, 7, 10 ]
```
