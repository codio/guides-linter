import {RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    return !assessment.source.bloomsObjectiveLevel ? '"Bloom’s Level" field should not be blank' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
