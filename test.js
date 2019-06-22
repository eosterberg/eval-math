var evalMath = require('./index.js').evalMath

var tests = [
  '-2 + 3',
  '-8 * 3',
  '(26 + 4) * 4',
  '1+2*3',
  '(1+2)*3',
  '13121 * 30.5 + (4+ 4 - (3 - 3     )) / 5 * 10',
]

var testsPassed = true
tests.forEach(test => {
  var calculated = evalMath(test)
  var evaluated = eval(test)

  if (calculated !== evaluated) {
    console.error(
      'Calculated and evaluated results differ, calculated:', calculated, 'evaluated:', evaluated,
    )
    testsPassed = false
  }
})

if (testsPassed) {
  console.log('All tests pass.')
}
