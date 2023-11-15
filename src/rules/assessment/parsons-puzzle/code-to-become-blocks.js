import {ASSESSMENT_TYPES, RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    return assessment.type === ASSESSMENT_TYPES.PARSONS_PUZZLE && !assessment.source.initial ?
      '"Code to Become Blocks" in "Parsons Puzzle" should not be blank.' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
