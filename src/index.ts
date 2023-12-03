import {parse} from './math-ast.js';

export type Numeric = number | Float64Array;
export type EvaluationContext = Map<string, Numeric | Function>;

type BinaryOperator = '+' | '-' | '*' | '/' | '**';

type Program = {
  type: 'Program';
  body: ExpressionStatement[];
};

type ExpressionStatement = {
  type: 'ExpressionStatement';
  expression: Expression;
};

type BinaryExpression = {
  type: 'BinaryExpression';
  operator: BinaryOperator;
  left: Expression;
  right: Expression;
};

type UnaryExpression = {
  type: 'UnaryExpression';
  operator: '-';
  argument: Expression;
  prefix: boolean;
};

type CallExpression = {
  type: 'CallExpression';
  callee: Identifier;
  arguments: Expression[];
};

type AssignmentExpression = {
  type: 'AssignmentExpression';
  operator: '=' | '+=' | '-=' | '*=' | '/=' | '**=';
  left: Identifier;
  right: Expression;
};

type Identifier = {
  type: 'Identifier';
  name: string;
};

type Literal = {
  type: 'Literal';
  value: Numeric;
};

type Expression =
  | BinaryExpression
  | UnaryExpression
  | CallExpression
  | AssignmentExpression
  | Identifier
  | Literal;

// Make it like numpy
function random(size?: number): Numeric {
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

const EXTRA_FUNCTIONS: Record<string, Function> = {
  zeros,
  ones,
  full,
  zerosLike,
  onesLike,
  fullLike,
  arange,
  linspace,
};

function parseAst(source: string): Program {
  return parse(source);
}

function evaluateAst(ast: Expression, context: EvaluationContext): Numeric {
  switch (ast.type) {
    case 'Literal':
      return ast.value;
  }
  if (ast.type === 'BinaryExpression') {
    const left = evaluateAst(ast.left, context);
    const right = evaluateAst(ast.right, context);
    if (typeof left === 'number') {
      if (typeof right === 'number') {
        switch (ast.operator) {
          case '+':
            return left + right;
          case '-':
            return left - right;
          case '*':
            return left * right;
          case '/':
            return left / right;
          case '**':
            return left ** right;
        }
      } else {
        switch (ast.operator) {
          case '+':
            return right.map(r => left + r);
          case '-':
            return right.map(r => left - r);
          case '*':
            return right.map(r => left * r);
          case '/':
            return right.map(r => left / r);
          case '**':
            return right.map(r => left ** r);
        }
      }
    } else {
      if (typeof right === 'number') {
        switch (ast.operator) {
          case '+':
            return left.map(l => l + right);
          case '-':
            return left.map(l => l - right);
          case '*':
            return left.map(l => l * right);
          case '/':
            return left.map(l => l / right);
          case '**':
            return left.map(l => l ** right);
        }
      } else {
        // Trick TypeScript into accepting seemingly unreachable code below.
        switch (ast.operator as any) {
          case '+':
            return left.map((l, i) => l + right[i]);
          case '-':
            return left.map((l, i) => l - right[i]);
          case '*':
            return left.map((l, i) => l * right[i]);
          case '/':
            return left.map((l, i) => l / right[i]);
          case '**':
            return left.map((l, i) => l ** right[i]);
        }
      }
    }
    // The type hierarchy is incomplete so this is actually reachable.
    throw new Error(`Unimplemented operator '${ast.operator}'`);
  } else if (ast.type === 'UnaryExpression') {
    if (!ast.prefix) {
      throw new Error('Only prefix unary operators implemented');
    }
    const argument = evaluateAst(ast.argument, context);
    switch (ast.operator) {
      case '-':
        return typeof argument === 'number' ? -argument : argument.map(x => -x);
      default:
        throw new Error(`Unimplemented operator '${(ast as any).operator}'`);
    }
  } else if (ast.type === 'CallExpression') {
    if (!context.has(ast.callee.name)) {
      throw new Error(`ReferenceError: ${ast.callee.name} is not defined`);
    }
    const callee = context.get(ast.callee.name);
    if (typeof callee !== 'function') {
      throw new Error(`TypeError: ${ast.callee.name} is not a function`);
    }
    const args = ast.arguments.map(arg => evaluateAst(arg, context));
    if (args.every(arg => typeof arg === 'number')) {
      return callee(...args);
    }
    if (args.length === 1) {
      return (args[0] as Float64Array).map(x => callee(x));
    }
    let vectorLength = 1;
    for (const arg of args) {
      if (typeof arg !== 'number') {
        vectorLength = arg.length;
        break;
      }
    }
    const result = new Float64Array(vectorLength);
    for (let i = 0; i < vectorLength; ++i) {
      const subArgs: number[] = [];
      for (const arg of args) {
        if (typeof arg === 'number') {
          subArgs.push(arg);
        } else {
          subArgs.push(arg[i]);
        }
      }
      result[i] = callee(...subArgs);
    }
    return result;
  } else if (ast.type === 'Identifier') {
    if (!context.has(ast.name)) {
      throw new Error(`ReferenceError: ${ast.name} is not defined`);
    }
    const value = context.get(ast.name)!;
    if (typeof value === 'function') {
      throw new Error('Cannot evaluate to a function');
    }
    return value;
  } else if (ast.type === 'AssignmentExpression') {
    let right: Numeric;
    if (ast.operator === '=') {
      right = evaluateAst(ast.right, context);
    } else {
      right = evaluateAst(
        {
          type: 'BinaryExpression',
          operator: ast.operator.slice(0, -1) as BinaryOperator,
          left: ast.left,
          right: ast.right,
        },
        context
      );
    }
    context.set(ast.left.name, right);
    return right;
  }
  throw new Error(`${(ast as any).type} not implemented`);
}

export function evalMath(str: string, context?: EvaluationContext): Numeric {
  const program = parseAst(str);

  if (context === undefined) {
    context = new Map();
  } else {
    context = new Map(context);
  }

  const mathPropNames = Object.getOwnPropertyNames(Math);
  const mathRecord = Math as unknown as Record<string, number | Function>;
  for (const name of mathPropNames) {
    if (!context.has(name)) {
      if (name === 'random') {
        context.set(name, random);
      } else {
        context.set(name, mathRecord[name]);
      }
    }
  }

  for (const name in EXTRA_FUNCTIONS) {
    if (!context.has(name)) {
      context.set(name, EXTRA_FUNCTIONS[name]);
    }
  }

  let result: Numeric | undefined;
  for (const statement of program.body) {
    result = evaluateAst(statement.expression, context);
  }
  if (result === undefined) {
    throw new Error('Expression must evaluate to a value');
  }
  return result;
}

export function em(strings: TemplateStringsArray, ...args: Numeric[]): Numeric {
  const context: EvaluationContext = new Map();
  let str = strings[0];
  for (let i = 0; i < args.length; ++i) {
    const identifier = `__templateArgument${i}`;
    context.set(identifier, args[i]);
    str += identifier + strings[i + 1];
  }
  return evalMath(str, context);
}
