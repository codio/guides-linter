import {ASSESSMENT, RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    return assessment.type === ASSESSMENT.TYPES.FREE_TEXT_AUTO && !assessment.source.command ?
      '"Command" in "Free text autograde" should not be blank.' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
