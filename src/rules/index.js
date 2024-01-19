import assessment from './assessment/index'
import page from './page/index'
import assignment from './assignment/index'

const BEFORE_ALL = 'beforeAll'
export const checkRules = async (ruleName, ruleData, parent, data, errorLevel) => {
  const fullRuleName = parent ? `${parent}.${ruleName}` : ruleName
  if (ruleData.action instanceof Function) {
    if (ruleData.level < errorLevel) {
      return null
    }
    const result = await ruleData.action(data)
    if (!result) {
      return null
    }
    return {message: result, ruleName: fullRuleName, level: ruleData.level}
  }
  if (ruleData[BEFORE_ALL]) {
    const beforeAllErrors = await checkRules(BEFORE_ALL, ruleData[BEFORE_ALL], fullRuleName, data, errorLevel)
    if (beforeAllErrors.length) {
      return beforeAllErrors
    }
  }
  const promises = []
  for (const [innerRuleName, innerRuleData] of Object.entries(ruleData)) {
    promises.push(checkRules(innerRuleName, innerRuleData, fullRuleName, data, errorLevel))
  }
  const result = await Promise.all(promises)
  return result.flat(Infinity).filter(item => !!item)
}

export default {
  assessment,
  page,
  assignment
}
