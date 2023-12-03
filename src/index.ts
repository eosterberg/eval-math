import {parse} from './math-ast.js';

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
  operator: '+' | '-' | '*' | '/';
  left: Expression;
  right: Expression;
};

type UnaryExpression = {
  type: 'UnaryExpression';
  operator: '-';
  argument: Expression;
  prefix: boolean;
};

type Literal = {
  type: 'Literal';
  value: number;
};

type Expression = BinaryExpression | UnaryExpression | Literal;

type EvaluationContext = Map<string, number>;

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
  }
  throw new Error('Not implemented');
}

export function evalMath(str: string): number {
  const program = parseAst(str);

  const context: EvaluationContext = new Map();
  let result: number | undefined;
  for (const statement of program.body) {
    result = evaluateAst(statement.expression, context);
  }
  if (result === undefined) {
    throw new Error('Expression must evaluate to a value');
  }
  return result;
}
