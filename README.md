# eval-math

Javascript library for evaluating math expressions.

Supports `+ - * /` and parentheses.

Usage:

    import {evalMath} from 'eval-math'

    evalMath('13121 * 30.5 + (4+ 4 - (3 - 3     )) / 5 * 10')

    > 400206.5 
