import {RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    return !assessment.source.name ? 'Name should not be blank' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
