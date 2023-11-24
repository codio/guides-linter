import {RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    return assessment.source.maxAttemptsCount ?
      '"Defined Number of Attempts" should be toggled off' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
