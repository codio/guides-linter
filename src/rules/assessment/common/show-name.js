import {RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    return assessment.source.showName ? '"Show Name" should be toggled off' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
