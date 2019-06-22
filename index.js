var splitOnAddOrSubtract = expressions => {
  if (!expressions.find(expr => expr === '+' || expr === '-')) {
    return expressions
  }
  
  var currParts = []
  var parts = [currParts]
  for (var i = 0; i < expressions.length; i++) {
    var expr = expressions[i];
    if (expr === '+' || expr === '-') {
      parts.push(expr, currParts = [])
    } else {
      currParts.push(expr)
    }
  }

  return parts
}

var performOperation = (operation, left, right) => {
  switch (operation) {
    case '-': return left - right
    case '*': return left * right 
    case '/': return left / right
  }
  return left + right
}

var sumExpressions = expressions => {
  expressions = splitOnAddOrSubtract(expressions)
  var result = 0
  var currOperation
  for (var i = 0; i < expressions.length; i++) {
    var expr = expressions[i];
    if (Array.isArray(expr)) {
      expr = sumExpressions(expr)
    } 
    
    if (typeof expr === 'string') {
      currOperation = expr
    } else {
      result = performOperation(currOperation, result, expr)
    }
  }

  return result
}

var pushNumber = (stack, numberChars) => {
  var number = parseFloat(numberChars.join(''), 10)
  if (!isNaN(number)) { stack.push(number) }
  return []
}

exports.evalMath = (str) => {
  var strLen = str.length
  var i = 0
  var currentStack = []
  var numberChars = []

  while (i < strLen) {
    var char = str[i++]
    switch (char) {
      case '(':
        numberChars = pushNumber(currentStack, numberChars)
        var subStack = []
        subStack.parent = currentStack
        currentStack.push(subStack)
        currentStack = subStack
        continue
        
      case ')':
        numberChars = pushNumber(currentStack, numberChars)
        currentStack = currentStack.parent
        continue

      case ' ':
        numberChars = pushNumber(currentStack, numberChars)
        continue

      case '+':
      case '-':
      case '/':
        numberChars = pushNumber(currentStack, numberChars)
        currentStack.push(char)
        continue

      case '*':
      case 'x':
      case 'X':
        numberChars = pushNumber(currentStack, numberChars)
        currentStack.push('*')
        continue
    }

    if (char === ',' || char === '.') {
      numberChars.push('.')
    } else if (!isNaN(parseInt(char, 10))) {
      numberChars.push(char)
    }

  }

  pushNumber(currentStack, numberChars)

  while (currentStack.parent) {
    currentStack = currentStack.parent
  }

  return sumExpressions(currentStack)
}