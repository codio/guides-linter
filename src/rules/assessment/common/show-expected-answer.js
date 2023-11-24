import {RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    const {showGuidanceAfterResponseOption} = assessment.source
    return !showGuidanceAfterResponseOption ||
    showGuidanceAfterResponseOption.type !== 'Attempts' ||
    showGuidanceAfterResponseOption.passedFrom !== 2 ?
      '"Show Expected Answer" should be set to “After 2”' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
