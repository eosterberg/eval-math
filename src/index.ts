/* eslint-disable no-case-declarations */

class Stack extends Array<Stack | string | number> {
  parent?: Stack;
}

const splitOnAddOrSubtract = (expressions: Stack) => {
  if (!expressions.find(expr => expr === '+' || expr === '-')) {
    return expressions;
  }

  let currParts = new Stack();
  const parts = new Stack();
  parts.push(currParts);
  for (let i = 0; i < expressions.length; i++) {
    const expr = expressions[i];
    if (expr === '+' || expr === '-') {
      parts.push(expr, (currParts = []));
    } else {
      currParts.push(expr);
    }
  }

  return parts;
};

const performOperation = (operation: string, left: number, right: number) => {
  switch (operation) {
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return left / right;
  }
  return left + right;
};

const sumExpressions = (expressions: Stack) => {
  expressions = splitOnAddOrSubtract(expressions);
  let result = 0;
  let currOperation;
  for (let i = 0; i < expressions.length; i++) {
    let expr = expressions[i];
    if (Array.isArray(expr)) {
      expr = sumExpressions(expr);
    }

    if (typeof expr === 'string') {
      currOperation = expr;
    } else {
      result = performOperation(currOperation!, result, expr);
    }
  }

  return result;
};

const pushNumber = (stack: Stack, numberChars: string[]) => {
  const number = parseFloat(numberChars.join(''));
  if (!isNaN(number)) {
    stack.push(number);
  }
  return [];
};

export const evalMath = (str: string) => {
  const strLen = str.length;
  let i = 0;
  let currentStack = new Stack();
  let numberChars: string[] = [];

  while (i < strLen) {
    const char = str[i++];
    switch (char) {
      case '(':
        numberChars = pushNumber(currentStack, numberChars);
        const subStack = new Stack([]);
        subStack.parent = currentStack;
        currentStack.push(subStack);
        currentStack = subStack;
        continue;

      case ')':
        numberChars = pushNumber(currentStack, numberChars);
        currentStack = currentStack.parent!;
        continue;

      case ' ':
        numberChars = pushNumber(currentStack, numberChars);
        continue;

      case '+':
      case '-':
      case '/':
        numberChars = pushNumber(currentStack, numberChars);
        currentStack.push(char);
        continue;

      case '*':
      case 'x':
      case 'X':
        numberChars = pushNumber(currentStack, numberChars);
        currentStack.push('*');
        continue;
    }

    if (char === ',' || char === '.') {
      numberChars.push('.');
    } else if (!isNaN(parseInt(char, 10))) {
      numberChars.push(char);
    }
  }

  pushNumber(currentStack, numberChars);

  while (currentStack.parent) {
    currentStack = currentStack.parent;
  }

  return sumExpressions(currentStack);
};
