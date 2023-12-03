import {parse} from './math-ast.js';

export type EvaluationContext = Map<string, number | Function>;

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
  operator: '+' | '-' | '*' | '/' | '**';
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
  value: number;
};

type Expression =
  | BinaryExpression
  | UnaryExpression
  | CallExpression
  | AssignmentExpression
  | Identifier
  | Literal;

function parseAst(source: string): Program {
  return parse(source);
}

function evaluateAst(ast: Expression, context: EvaluationContext): number {
  switch (ast.type) {
    case 'Literal':
      return ast.value;
  }
  if (ast.type === 'BinaryExpression') {
    const left = evaluateAst(ast.left, context);
    const right = evaluateAst(ast.right, context);
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
      default:
        throw new Error(`Unimplemented operator '${(ast as any).operator}'`);
    }
  } else if (ast.type === 'UnaryExpression') {
    if (!ast.prefix) {
      throw new Error('Only prefix unary operators implemented');
    }
    const argument = evaluateAst(ast.argument, context);
    switch (ast.operator) {
      case '-':
        return -argument;
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
    return callee(...args);
  } else if (ast.type === 'Identifier') {
    if (!context.has(ast.name)) {
      throw new Error(`ReferenceError: ${ast.name} is not defined`);
    }
    const value = context.get(ast.name)!;
    if (typeof value !== 'number') {
      throw new Error('Cannot evaluate to a function');
    }
    return value;
  } else if (ast.type === 'AssignmentExpression') {
    let right = evaluateAst(ast.right, context);
    if (ast.operator !== '=') {
      let left = evaluateAst(ast.left, context);
      switch (ast.operator) {
        case '+=':
          left += right;
          break;
        case '-=':
          left -= right;
          break;
        case '*=':
          left *= right;
          break;
        case '/=':
          left /= right;
          break;
        case '**=':
          left **= right;
          break;
      }
      right = left;
    }
    context.set(ast.left.name, right);
    return right;
  }
  throw new Error(`${(ast as any).type} not implemented`);
}

export function evalMath(str: string, context?: EvaluationContext): number {
  const program = parseAst(str);

  if (context === undefined) {
    context = new Map();
  } else {
    context = new Map(context);
  }

  const mathPropNames = Object.getOwnPropertyNames(Math);
  const mathRecord = Math as unknown as Record<string, number | Function>;
  for (const name of mathPropNames) {
    context.set(name, mathRecord[name]);
  }

  let result: number | undefined;
  for (const statement of program.body) {
    result = evaluateAst(statement.expression, context);
  }
  if (result === undefined) {
    throw new Error('Expression must evaluate to a value');
  }
  return result;
}
