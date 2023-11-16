import {ASSESSMENT, RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    return assessment.type === ASSESSMENT.TYPES.MULTIPLE_CHOICE && !assessment.source.isRandomized ?
      '"Shuffle Answers" in "Multiple Choice Questions" should be toggled on' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
