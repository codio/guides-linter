import assessment from './assessment/index'

export const checkRules = (ruleName, ruleData, parent, data, errorLevel) => {
  const fullRuleName = parent ? `${parent}.${ruleName}` : ruleName
  if (ruleData.action instanceof Function) {
    if (ruleData.level < errorLevel) {
      return null
    }
    const result = ruleData.action(data)
    if (!result) {
      return null
    }
    return {message: result, ruleName: fullRuleName, level: ruleData.level}
  }
  const result = []
  for (const [innerRuleName, innerRuleData] of Object.entries(ruleData)) {
    result.push(checkRules(innerRuleName, innerRuleData, fullRuleName, data, errorLevel))
  }
  return result.flat(Infinity).filter(item => !!item)
}

export default {
  assessment
}
