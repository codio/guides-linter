import {getIconByLevel} from './icons'
import {RULE_LEVELS} from '../rules/const'

export const showAllErrors = (errorsList, errors) => {
  const renderedErrors = errors
    .sort((a, b) => a.level > b.level ? -1 : a.level === b.level ? 0 : 1)
    .map(({ruleName, message, level}) => `<li>${getIconByLevel(level)} ${ruleName}: ${message}</li>`)
  errorsList.innerHTML += renderedErrors.join('')
}

export const getErrorsStatus = (errors) => {
  if (!errors.length) {
    return {color: 'green', message: 'Success'}
  }
  const groupped = {errors: [], warnings: [], suggestions: []}
  errors.forEach((item) => {
    item.level === RULE_LEVELS.ISSUE ? groupped.errors.push(item) :
      item.level === RULE_LEVELS.WARNING ? groupped.warnings.push(item) :
        groupped.suggestions.push(item)
  })
  const prefix = groupped.errors.length ? 'Error' : 'Success'
  const info = [
    `errors: ${groupped.errors.length}`,
    `warnings: ${groupped.warnings.length}`,
    `suggestions: ${groupped.suggestions.length}`
  ].join(', ')
  const message = `${prefix}(${info})`
  return {color: groupped.errors.length ? 'red' : 'green', message}
}
