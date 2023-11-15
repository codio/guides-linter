import {ASSESSMENT_TYPES, RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    return assessment.type === ASSESSMENT_TYPES.FILL_IN_THE_BLANKS && !assessment.source.showValues ?
      '"Show possible values" in "Fill in the blanks" should be toggled on.' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
