import {ASSESSMENT, RULE_LEVELS} from '../../const'

const HAS_EXPECTED_ANSWER = [
  ASSESSMENT.TYPES.MULTIPLE_CHOICE,
  ASSESSMENT.TYPES.FILL_IN_THE_BLANKS,
  ASSESSMENT.TYPES.CODE_OUTPUT_COMPARE,
  ASSESSMENT.TYPES.MATH,
]

export default {
  action: (assessment) => {
    if (!HAS_EXPECTED_ANSWER.includes(assessment.type)) {
      return undefined
    }
    const {showGuidanceAfterResponseOption} = assessment.source
    return !showGuidanceAfterResponseOption ||
    showGuidanceAfterResponseOption.type !== 'Attempts' ||
    showGuidanceAfterResponseOption.passedFrom !== 2 ?
      '"Show Expected Answer" should be set to “After 2”' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
