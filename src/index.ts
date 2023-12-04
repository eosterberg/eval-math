import {parse} from './math-ast.js';
import {
  type Numeric,
  random,
  VECTOR_ROUTINES,
  VECTOR_PROPERTIES,
} from './vector-routines';
import {EXTRA_FUNCTIONS, EXTRA_CONSTANTS} from './extra';

export type EvaluationContext = Map<string, Numeric | Function>;

type LogicalOperator = '&&' | '||';

type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '**'
  | '<='
  | '>='
  | '<'
  | '>'
  | '==='
  | '!=='
  | '=='
  | '!='
  | '&'
  | '|'
  | '^'
  | '<<'
  | '>>>'
  | '>>';

type Program = {
  type: 'Program';
  body: Statement[];
};

type ExpressionStatement = {
  type: 'ExpressionStatement';
  expression: Expression;
};

type ForStatement = {
  type: 'ForStatement';
  init: Expression;
  test: Expression;
  update: Expression;
  body: Statement;
};

type BlockStatement = {
  type: 'BlockStatement';
  body: Statement[];
};

type FunctionDeclaration = {
  type: 'FunctionDeclaration';
  id: Identifier;
  params: Identifier[];
  body: Statement;
};

type ReturnStatement = {
  type: 'ReturnStatement';
  argument: Expression;
};

type VariableDeclaration = {
  type: 'VariableDeclaration';
  declarations: VariableDeclarator[];
  kind: 'var';
};

type VariableDeclarator = {
  type: 'VariableDeclarator';
  id: Identifier;
  init: Expression;
};

type ThrowStatement = {
  type: 'ThrowStatement';
  argument: Expression;
};

type Statement =
  | ExpressionStatement
  | ForStatement
  | BlockStatement
  | FunctionDeclaration
  | ReturnStatement
  | VariableDeclaration
  | ThrowStatement;

type LogicalExpression = {
  type: 'LogicalExpression';
  operator: LogicalOperator;
  left: Expression;
  right: Expression;
};

type BinaryExpression = {
  type: 'BinaryExpression';
  operator: BinaryOperator;
  left: Expression;
  right: Expression;
};

type UnaryExpression = {
  type: 'UnaryExpression';
  operator: '+' | '-' | '!' | '~';
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
  operator:
    | '='
    | '+='
    | '-='
    | '*='
    | '/='
    | '%='
    | '**='
    | '&='
    | '|='
    | '^='
    | '<<='
    | '>>>='
    | '>>=';
  left: Identifier | ComputedMemberExpression;
  right: Expression;
};

type UpdateExpression = {
  type: 'UpdateExpression';
  operator: '++' | '--';
  argument: Identifier;
  prefix: boolean;
};

type MemberExpression = {
  type: 'MemberExpression';
  object: Identifier;
  property: Identifier;
  computed: false;
};

type ComputedMemberExpression = {
  type: 'MemberExpression';
  object: Identifier;
  property: Expression;
  computed: true;
};

type ConditionalExpression = {
  type: 'ConditionalExpression';
  test: Expression;
  consequent: Expression;
  alternate: Expression;
};

type ArrayExpression = {
  type: 'ArrayExpression';
  elements: Expression[];
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
  | LogicalExpression
  | BinaryExpression
  | UnaryExpression
  | CallExpression
  | AssignmentExpression
  | UpdateExpression
  | MemberExpression
  | ComputedMemberExpression
  | ConditionalExpression
  | ArrayExpression
  | Identifier
  | Literal;

function applyTernaryOperator(
  test: Numeric,
  consequent: Numeric,
  alternate: Numeric
) {
  if (typeof test === 'number') {
    if (typeof consequent === 'number') {
      if (typeof alternate === 'number') {
        return test ? consequent : alternate;
      }
      return alternate.map(a => (test ? consequent : a));
    }
    if (typeof alternate === 'number') {
      return consequent.map(c => (test ? c : alternate));
    }
    return consequent.map((c, i) => (test ? c : alternate[i]));
  }
  if (typeof consequent === 'number') {
    if (typeof alternate === 'number') {
      return test.map(t => (t ? consequent : alternate));
    }
    return test.map((t, i) => (t ? consequent : alternate[i]));
  }
  if (typeof alternate === 'number') {
    return test.map((t, i) => (t ? consequent[i] : alternate));
  }
  return test.map((t, i) => (t ? consequent[i] : alternate[i]));
}

function applyBinaryOperator(
  operator: BinaryOperator,
  left: Numeric,
  right: Numeric
) {
  if (typeof left === 'number') {
    if (typeof right === 'number') {
      switch (operator) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          return left / right;
        case '%':
          return left % right;
        case '**':
          return left ** right;
        case '<=':
          return Number(left <= right);
        case '>=':
          return Number(left >= right);
        case '<':
          return Number(left < right);
        case '>':
          return Number(left > right);
        case '===':
          return Number(left === right);
        case '!==':
          return Number(left !== right);
        case '==':
          // eslint-disable-next-line eqeqeq
          return Number(left == right);
        case '!=':
          // eslint-disable-next-line eqeqeq
          return Number(left != right);
        case '&':
          return left & right;
        case '|':
          return left | right;
        case '^':
          return left ^ right;
        case '<<':
          return left << right;
        case '>>>':
          return left >>> right;
        case '>>':
          return left >> right;
      }
    } else {
      switch (operator) {
        case '+':
          return right.map(r => left + r);
        case '-':
          return right.map(r => left - r);
        case '*':
          return right.map(r => left * r);
        case '/':
          return right.map(r => left / r);
        case '%':
          return right.map(r => left % r);
        case '**':
          return right.map(r => left ** r);
        case '<=':
          return right.map(r => Number(left <= r));
        case '>=':
          return right.map(r => Number(left >= r));
        case '<':
          return right.map(r => Number(left < r));
        case '>':
          return right.map(r => Number(left > r));
        case '===':
          return right.map(r => Number(left === r));
        case '!==':
          return right.map(r => Number(left !== r));
        case '==':
          // eslint-disable-next-line eqeqeq
          return right.map(r => Number(left == r));
        case '!=':
          // eslint-disable-next-line eqeqeq
          return right.map(r => Number(left != r));
        case '&':
          return right.map(r => left & r);
        case '|':
          return right.map(r => left | r);
        case '^':
          return right.map(r => left ^ r);
        case '<<':
          return right.map(r => left << r);
        case '>>>':
          return right.map(r => left >>> r);
        case '>>':
          return right.map(r => left >> r);
      }
    }
  } else {
    if (typeof right === 'number') {
      switch (operator) {
        case '+':
          return left.map(l => l + right);
        case '-':
          return left.map(l => l - right);
        case '*':
          return left.map(l => l * right);
        case '/':
          return left.map(l => l / right);
        case '%':
          return left.map(l => l % right);
        case '**':
          return left.map(l => l ** right);
        case '<=':
          return left.map(l => Number(l <= right));
        case '>=':
          return left.map(l => Number(l >= right));
        case '<':
          return left.map(l => Number(l < right));
        case '>':
          return left.map(l => Number(l > right));
        case '===':
          return left.map(l => Number(l === right));
        case '!==':
          return left.map(l => Number(l !== right));
        case '==':
          // eslint-disable-next-line eqeqeq
          return left.map(l => Number(l == right));
        case '!=':
          // eslint-disable-next-line eqeqeq
          return left.map(l => Number(l != right));
        case '&':
          return left.map(l => l & right);
        case '|':
          return left.map(l => l | right);
        case '^':
          return left.map(l => l ^ right);
        case '<<':
          return left.map(l => l << right);
        case '>>>':
          return left.map(l => l >>> right);
        case '>>':
          return left.map(l => l >> right);
      }
    } else {
      // Trick TypeScript into accepting seemingly unreachable code below.
      switch (operator as any) {
        case '+':
          return left.map((l, i) => l + right[i]);
        case '-':
          return left.map((l, i) => l - right[i]);
        case '*':
          return left.map((l, i) => l * right[i]);
        case '/':
          return left.map((l, i) => l / right[i]);
        case '%':
          return left.map((l, i) => l % right[i]);
        case '**':
          return left.map((l, i) => l ** right[i]);
        case '<=':
          return left.map((l, i) => Number(l <= right[i]));
        case '>=':
          return left.map((l, i) => Number(l >= right[i]));
        case '<':
          return left.map((l, i) => Number(l < right[i]));
        case '>':
          return left.map((l, i) => Number(l > right[i]));
        case '===':
          return left.map((l, i) => Number(l === right[i]));
        case '!==':
          return left.map((l, i) => Number(l !== right[i]));
        case '==':
          // eslint-disable-next-line eqeqeq
          return left.map((l, i) => Number(l == right[i]));
        case '!=':
          // eslint-disable-next-line eqeqeq
          return left.map((l, i) => Number(l != right[i]));
        case '&':
          return left.map((l, i) => l & right[i]);
        case '|':
          return left.map((l, i) => l | right[i]);
        case '^':
          return left.map((l, i) => l ^ right[i]);
        case '<<':
          return left.map((l, i) => l << right[i]);
        case '>>>':
          return left.map((l, i) => l >>> right[i]);
        case '>>':
          return left.map((l, i) => l >> right[i]);
      }
    }
  }
  // The type hierarchy is incomplete so this is actually reachable.
  throw new Error(`Unimplemented operator '${operator}'`);
}

function parseAst(source: string): Program {
  return parse(source);
}

function evaluateExpression(
  ast: Expression,
  context: EvaluationContext,
  globals: EvaluationContext
): Numeric {
  if (ast.type === 'Literal') {
    return ast.value;
  } else if (ast.type === 'ConditionalExpression') {
    const test = evaluateExpression(ast.test, context, globals);
    const consequent = evaluateExpression(ast.consequent, context, globals);
    const alternate = evaluateExpression(ast.alternate, context, globals);
    return applyTernaryOperator(test, consequent, alternate);
  } else if (ast.type === 'LogicalExpression') {
    if (ast.operator === '&&') {
      return (
        evaluateExpression(ast.left, context, globals) &&
        evaluateExpression(ast.right, context, globals)
      );
    }
    return (
      evaluateExpression(ast.left, context, globals) ||
      evaluateExpression(ast.right, context, globals)
    );
  } else if (ast.type === 'BinaryExpression') {
    const left = evaluateExpression(ast.left, context, globals);
    const right = evaluateExpression(ast.right, context, globals);
    return applyBinaryOperator(ast.operator, left, right);
  } else if (ast.type === 'UnaryExpression') {
    if (!ast.prefix) {
      throw new Error('Only prefix unary operators implemented');
    }
    const argument = evaluateExpression(ast.argument, context, globals);
    switch (ast.operator) {
      case '+':
        return typeof argument === 'number' ? +argument : argument.map(x => +x);
      case '-':
        return typeof argument === 'number' ? -argument : argument.map(x => -x);
      case '!':
        return typeof argument === 'number'
          ? Number(!argument)
          : argument.map(x => Number(!x));
      case '~':
        return typeof argument === 'number' ? ~argument : argument.map(x => ~x);
      default:
        throw new Error(`Unimplemented operator '${(ast as any).operator}'`);
    }
  } else if (ast.type === 'CallExpression') {
    const name = ast.callee.name;
    if (!context.has(name) && !globals.has(name)) {
      throw new Error(`ReferenceError: ${name} is not defined`);
    }
    const callee = context.get(name) ?? globals.get(name);
    if (typeof callee !== 'function') {
      throw new Error(`TypeError: ${name} is not a function`);
    }
    const args = ast.arguments.map(arg =>
      evaluateExpression(arg, context, globals)
    );
    if (args.every(arg => typeof arg === 'number')) {
      return callee(...args);
    }
    if (args.length === 1) {
      return (args[0] as Float64Array).map(x => callee(x));
    }
    if (args.length === 2) {
      if (typeof args[0] === 'number') {
        const x = args[0];
        return (args[1] as Float64Array).map(y => callee(x, y));
      } else if (typeof args[1] === 'number') {
        const y = args[1];
        return (args[0] as Float64Array).map(x => callee(x, y));
      }
      const ys = args[1] as Float64Array;
      return (args[0] as Float64Array).map((x, i) => callee(x, ys[i]));
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
    const name = ast.name;
    if (!context.has(name) && !globals.has(name)) {
      throw new Error(`ReferenceError: ${name} is not defined`);
    }
    const value = context.get(name) ?? globals.get(name)!;
    if (typeof value === 'function') {
      throw new Error('Cannot evaluate to a function');
    }
    return value;
  } else if (ast.type === 'AssignmentExpression') {
    let right: Numeric;
    if (ast.operator === '=') {
      right = evaluateExpression(ast.right, context, globals);
    } else {
      right = evaluateExpression(
        {
          type: 'BinaryExpression',
          operator: ast.operator.slice(0, -1) as BinaryOperator,
          left: ast.left,
          right: ast.right,
        },
        context,
        globals
      );
    }
    if (ast.left.type === 'Identifier') {
      if (context.has(ast.left.name)) {
        context.set(ast.left.name, right);
      } else {
        globals.set(ast.left.name, right);
      }
      return right;
    } else {
      const object = evaluateExpression(ast.left.object, context, globals);
      if (typeof object === 'number') {
        throw new Error('Cannot assign properties of numbers');
      }
      const property = evaluateExpression(ast.left.property, context, globals);
      if (typeof property === 'number') {
        if (typeof right !== 'number') {
          throw new Error('Must assign a number');
        }
        if (property < 0) {
          return (object[object.length + property] = right);
        }
        return (object[property] = right);
      }
      if (typeof right === 'number') {
        for (let i = 0; i < object.length; ++i) {
          if (property[i]) {
            object[i] = right;
          }
        }
      } else {
        let j = 0;
        for (let i = 0; i < object.length; ++i) {
          if (property[i]) {
            object[i] = right[j++];
          }
        }
      }
      return right;
    }
  } else if (ast.type === 'UpdateExpression') {
    const argument = evaluateExpression(ast.argument, context, globals);
    let newValue: Numeric;
    if (ast.operator === '++') {
      newValue =
        typeof argument === 'number' ? argument + 1 : argument.map(a => a + 1);
    } else {
      newValue =
        typeof argument === 'number' ? argument - 1 : argument.map(a => a - 1);
    }
    if (context.has(ast.argument.name)) {
      context.set(ast.argument.name, newValue);
    } else {
      globals.set(ast.argument.name, newValue);
    }
    return ast.prefix ? newValue : argument;
  } else if (ast.type === 'MemberExpression') {
    const object = evaluateExpression(ast.object, context, globals);
    if (typeof object === 'number') {
      throw new Error('Cannot access properties of numbers');
    }
    if (!ast.computed) {
      return VECTOR_PROPERTIES[ast.property.name](object);
    }
    const property = evaluateExpression(ast.property, context, globals);
    if (typeof property === 'number') {
      if (property < 0) {
        return object[object.length + property];
      }
      return object[property];
    } else {
      // We only have one data type so we choose the boolean implementation of numpy.
      return object.filter((_, i) => property[i]);
    }
  } else if (ast.type === 'ArrayExpression') {
    const values: number[] = [];
    for (const element of ast.elements) {
      const value = evaluateExpression(element, context, globals);
      if (typeof value !== 'number') {
        throw new Error('Only numbers can be put into arrays');
      }
      values.push(value);
    }
    return new Float64Array(values);
  }
  throw new Error(`${(ast as any).type} not implemented`);
}

function evaluateStatement(
  ast: Statement,
  context: EvaluationContext,
  globals: EvaluationContext
): Numeric | Function | undefined {
  if (ast.type === 'ExpressionStatement') {
    return evaluateExpression(ast.expression, context, globals);
  } else if (ast.type === 'BlockStatement') {
    // Are we CoffeeScript now?
    let hasReturned = false;
    let result: Numeric | Function | undefined;
    for (const statement of ast.body) {
      if (!hasReturned) {
        result = evaluateStatement(statement, context, globals);
      }
      hasReturned ||= statement.type === 'ReturnStatement';
    }
    return result;
  } else if (ast.type === 'ForStatement') {
    let result: Numeric | Function | undefined;
    for (
      result = evaluateExpression(ast.init, context, globals);
      (result = evaluateExpression(ast.test, context, globals));
      result = evaluateExpression(ast.update, context, globals)
    ) {
      result = evaluateStatement(ast.body, context, globals);
    }
    return result;
  } else if (ast.type === 'FunctionDeclaration') {
    const declaration = ast;
    // eslint-disable-next-line no-inner-declarations
    function userDefined(...args: Numeric[]) {
      const locals: EvaluationContext = new Map(context);
      for (let i = 0; i < declaration.params.length; ++i) {
        locals.set(declaration.params[i].name, args[i]);
      }
      return evaluateStatement(declaration.body, locals, globals);
    }
    userDefined.prototype.name = declaration.id.name;
    context.set(declaration.id.name, userDefined);
    return userDefined;
  } else if (ast.type === 'ReturnStatement') {
    return evaluateExpression(ast.argument, context, globals);
  } else if (ast.type === 'VariableDeclaration') {
    let result: Numeric | Function | undefined;
    for (const declarator of ast.declarations) {
      const init = evaluateExpression(declarator.init, context, globals);
      context.set(declarator.id.name, init);
      result = init;
    }
    return result;
  } else if (ast.type === 'ThrowStatement') {
    throw evaluateExpression(ast.argument, context, globals);
  }
  throw new Error(`${(ast as any).type} not implemented`);
}

function defaultContext() {
  const context: EvaluationContext = new Map();

  const mathPropNames = Object.getOwnPropertyNames(Math);
  const mathRecord = Math as unknown as Record<string, number | Function>;
  for (const name of mathPropNames) {
    if (name === 'random') {
      context.set(name, random);
    } else {
      context.set(name, mathRecord[name]);
    }
  }

  for (const name in VECTOR_ROUTINES) {
    context.set(name, VECTOR_ROUTINES[name]);
  }

  for (const name in EXTRA_FUNCTIONS) {
    context.set(name, EXTRA_FUNCTIONS[name]);
  }

  for (const name in EXTRA_CONSTANTS) {
    context.set(name, EXTRA_CONSTANTS[name]);
  }
  return context;
}

export function evalMath(str: string, locals?: EvaluationContext): Numeric {
  const program = parseAst(str);

  const globals = defaultContext();
  if (locals === undefined) {
    locals = new Map();
  }

  let result: Numeric | Function | undefined;
  for (const statement of program.body) {
    result = evaluateStatement(statement, locals, globals);
  }
  if (result === undefined || typeof result === 'function') {
    throw new Error('Expression must evaluate to a value');
  }
  return result;
}

export function em(strings: TemplateStringsArray, ...args: Numeric[]): Numeric {
  const locals: EvaluationContext = new Map();
  let str = strings[0];
  for (let i = 0; i < args.length; ++i) {
    const identifier = `__templateArgument${i}`;
    locals.set(identifier, args[i]);
    str += identifier + strings[i + 1];
  }
  return evalMath(str, locals);
}

export function evalIncremental(
  str: string,
  output: Float64Array,
  locals?: EvaluationContext
) {
  const program = parseAst(str);

  const globals = defaultContext();
  if (locals === undefined) {
    locals = new Map();
  }

  // TODO: Reduce AST as much as possible

  const iterationContext: EvaluationContext = new Map();
  for (let i = 0; i < output.length; ++i) {
    for (const [key, value] of locals) {
      if (typeof value === 'number' || typeof value === 'function') {
        iterationContext.set(key, value);
      } else {
        iterationContext.set(key, value[i]);
      }
    }
    let result: Numeric | Function | undefined;
    for (const statement of program.body) {
      result = evaluateStatement(statement, iterationContext, globals);
    }
    if (result === undefined || typeof result === 'function') {
      throw new Error('Expression must evaluate to a value');
    }
    if (typeof result !== 'number') {
      throw new Error('Incremenatal evaluation must produce numbers');
    }
    output[i] = result;
  }
}
